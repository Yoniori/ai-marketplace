/**
 * Rule: Phantom Dependencies (AI Hallucination)
 *
 * Parses package.json and checks every dependency and devDependency against
 * the npm registry. Packages that return 404 were likely hallucinated by an
 * AI coding assistant and have never existed — or have been unpublished.
 * Either case creates a dependency confusion attack surface.
 *
 * Severity: MEDIUM_AI_HALLUCINATION
 * CWE: CWE-1104 — Use of Unmaintained Third Party Components
 */

import {
  isExcludedPath,
  isBinaryContent,
  makeFinding,
} from "../utils";
import type { FileEntry, SecurityFinding, RuleFn, AuditConfig } from "../types";

// ── npm registry check ────────────────────────────────────────────────────────

/**
 * Checks whether a given package name exists on the public npm registry.
 * Returns `true` if the package exists, `false` if it returned 404 or timed out.
 */
async function packageExistsOnNpm(
  name: string,
  timeoutMs: number
): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(name)}`,
      { method: "HEAD", signal: controller.signal }
    );
    return response.status !== 404;
  } catch {
    // Network error or timeout — assume the package exists to avoid false positives
    return true;
  } finally {
    clearTimeout(timer);
  }
}

// ── Heuristic: names that LOOK like AI hallucinations ─────────────────────────
//
// Even without a network call we can surface packages with suspicious naming
// patterns that are strong hallucination signals.

const HALLUCINATION_NAME_PATTERNS: RegExp[] = [
  // AI company names combined with unofficial / community / helper suffixes
  /^(?:openai|anthropic|langchain|llama|gpt)-(?:unofficial|community|helper|utils|toolkit|api-wrapper|sdk-helper|wrapper|js|node)$/i,
  // Suspiciously version-specific package names (gpt4, gpt-3, etc.)
  /^gpt-?[3-9](?:\.5)?-(?:api|node|js|wrapper|client)$/i,
  // Common AI library names + random modifier
  /^(?:langchain|llamaindex|chromadb|pinecone|weaviate)-(?:community|tools|extras|addons|plus|pro)$/i,
];

function isLikelyHallucination(name: string): boolean {
  return HALLUCINATION_NAME_PATTERNS.some((p) => p.test(name));
}

// ── Package.json parser ───────────────────────────────────────────────────────

interface ParsedPackageJson {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
}

function parsePackageJson(content: string): ParsedPackageJson | null {
  try {
    const parsed = JSON.parse(content) as Partial<{
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      peerDependencies: Record<string, string>;
    }>;
    return {
      dependencies: parsed.dependencies ?? {},
      devDependencies: parsed.devDependencies ?? {},
      peerDependencies: parsed.peerDependencies ?? {},
    };
  } catch {
    return null;
  }
}

// ── Rule implementation ───────────────────────────────────────────────────────

export const run: RuleFn = async (
  files: FileEntry[],
  config: Required<AuditConfig>
): Promise<SecurityFinding[]> => {
  const findings: SecurityFinding[] = [];

  // Find all package.json files (excluding those in excluded paths)
  const packageJsonFiles = files.filter(
    (f) =>
      !isExcludedPath(f.path) &&
      !isBinaryContent(f.content) &&
      (f.path.endsWith("/package.json") || f.path === "package.json")
  );

  for (const file of packageJsonFiles) {
    const parsed = parsePackageJson(file.content);
    if (!parsed) continue;

    // Combine all dependency types
    const allDeps: Array<{ name: string; source: string }> = [
      ...Object.keys(parsed.dependencies).map((n) => ({ name: n, source: "dependencies" })),
      ...Object.keys(parsed.devDependencies).map((n) => ({ name: n, source: "devDependencies" })),
      ...Object.keys(parsed.peerDependencies).map((n) => ({ name: n, source: "peerDependencies" })),
    ];

    // Step 1: Flag heuristic hallucinations (no network needed)
    for (const dep of allDeps) {
      if (isLikelyHallucination(dep.name)) {
        findings.push(
          makeFinding({
            severity: "MEDIUM_AI_HALLUCINATION",
            category: "PHANTOM_DEPENDENCY",
            title: `Likely AI-Hallucinated Package: "${dep.name}"`,
            description:
              `The package "${dep.name}" (in ${dep.source}) matches naming patterns ` +
              "commonly produced by AI coding assistants that hallucinate npm package names. " +
              "This package may not exist on the npm registry. Installing it creates an " +
              "empty namespace that an attacker can claim to serve malicious code.",
            file: file.path,
            recommendation:
              `Verify "${dep.name}" exists on npmjs.com before committing. ` +
              "If it doesn't exist, remove it or replace it with the correct package. " +
              "Run `npm ls` after install to catch missing transitive dependencies.",
            cweId: "CWE-1104",
            confidence: "MEDIUM",
          })
        );
      }
    }

    // Step 2: Network-based registry check (if enabled)
    if (!config.checkPhantomDeps) continue;

    // Run registry checks in parallel (batch of 10 to avoid hammering npm)
    const BATCH_SIZE = 10;
    for (let i = 0; i < allDeps.length; i += BATCH_SIZE) {
      const batch = allDeps.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (dep) => ({
          dep,
          exists: await packageExistsOnNpm(dep.name, config.networkTimeout),
        }))
      );

      for (const { dep, exists } of results) {
        if (!exists) {
          findings.push(
            makeFinding({
              severity: "MEDIUM_AI_HALLUCINATION",
              category: "PHANTOM_DEPENDENCY",
              title: `Phantom Dependency: "${dep.name}" Not Found on npm`,
              description:
                `The package "${dep.name}" listed in ${dep.source} returned HTTP 404 ` +
                "from the npm registry — it does not exist. This is a strong signal that " +
                "the package name was hallucinated by an AI coding assistant. " +
                "A missing package name is also an open invitation for a dependency confusion " +
                "attack: any attacker can publish a package with this name and have it " +
                "automatically installed by every developer and CI system running `npm install`.",
              file: file.path,
              recommendation:
                `Remove "${dep.name}" from your package.json. Search npmjs.com for the ` +
                "correct alternative package name. Run `npm install` only after verifying " +
                "all dependencies exist. Consider locking your registry with an `.npmrc` " +
                "that specifies `registry=https://registry.npmjs.org/` to prevent scope hijacking.",
              cweId: "CWE-1104",
              confidence: "HIGH",
            })
          );
        }
      }
    }
  }

  return findings;
};

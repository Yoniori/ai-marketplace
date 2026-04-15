/**
 * Rule: Dependency Confusion & Supply-Chain Attack Detection
 *
 * Detects indicators of dependency confusion attacks and supply-chain compromise:
 * - postinstall/preinstall scripts with suspicious payloads
 * - Custom registry redirects that could shadow public packages
 * - Scoped package name conflicts between private and public scopes
 * - Suspicious package.json metadata (no repository, mismatched maintainer)
 *
 * Severity: CRITICAL_MALWARE (if active payload) / HIGH (structural risk)
 * CWE: CWE-427 — Uncontrolled Search Path Element (Dependency Confusion)
 */

import {
  isExcludedPath,
  isBinaryContent,
  getSnippet,
  makeFinding,
} from "../utils";
import type { FileEntry, SecurityFinding, RuleFn } from "../types";

// ── .npmrc analysis ────────────────────────────────────────────────────────────

const SUSPICIOUS_REGISTRY_PATTERNS = [
  // Redirecting a scoped package to a third-party registry
  /^@\w+:registry\s*=\s*(?!https:\/\/registry\.npmjs\.org)https?:\/\//m,
  // Proxies / artifactory that could be misconfigured for scope confusion
  /registry\s*=\s*https?:\/\/(?!registry\.npmjs\.org)[^\s]+/m,
];

// ── package.json lifecycle script checks ──────────────────────────────────────

const DANGEROUS_SCRIPT_TOKENS = [
  // Downloader patterns
  "curl ",
  "wget ",
  "| bash",
  "| sh",
  "; bash",
  "; sh",
  // Exec-from-node
  "node -e",
  "node -p",
  "require('child_process')",
  'require("child_process")',
  // Exfiltration
  "process.env",
  "fetch(",
  "axios",
  "http.get",
  "https.get",
];

const DANGEROUS_SCRIPT_KEYS = [
  "preinstall",
  "postinstall",
  "install",
  "preuninstall",
  "postuninstall",
  "prepare",
  "prepublish",
  "prepublishOnly",
];

// ── Suspicious package.json structural indicators ─────────────────────────────

interface PackageJsonShape {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  repository?: unknown;
  author?: unknown;
  license?: string;
  main?: string;
  files?: string[];
  _resolved?: string;
  _from?: string;
}

function parseJson<T>(content: string): T | null {
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

// ── Rule implementation ───────────────────────────────────────────────────────

export const run: RuleFn = async (files: FileEntry[]): Promise<SecurityFinding[]> => {
  const findings: SecurityFinding[] = [];

  for (const file of files) {
    if (isExcludedPath(file.path)) continue;
    if (isBinaryContent(file.content)) continue;

    const { basename } = require("path") as typeof import("path");
    const name = basename(file.path);

    // ── .npmrc analysis ──────────────────────────────────────────────────────
    if (name === ".npmrc") {
      for (const pattern of SUSPICIOUS_REGISTRY_PATTERNS) {
        if (pattern.test(file.content)) {
          const match = file.content.match(pattern);
          const lineNum = match
            ? file.content.substring(0, match.index).split("\n").length
            : 1;

          findings.push(
            makeFinding({
              severity: "HIGH",
              category: "DEPENDENCY_CONFUSION",
              title: "Custom npm Registry Configuration Detected",
              description:
                "The `.npmrc` file redirects one or more package scopes to a non-standard " +
                "registry. This can be a legitimate internal proxy configuration OR a " +
                "dependency confusion setup where an attacker's registry is used to shadow " +
                "public packages. Verify this registry is intentional and trusted.",
              file: file.path,
              line: lineNum,
              snippet: getSnippet(file.content, lineNum),
              recommendation:
                "Audit all custom registry entries in .npmrc. For internal packages, " +
                "ensure the private registry is locked and authenticated. " +
                "Use `npm config set @scope:registry` only for verified internal registries. " +
                "Consider using `npm audit` and Dependabot to detect scope hijacking.",
              cweId: "CWE-427",
              confidence: "MEDIUM",
            })
          );
        }
      }
    }

    // ── package.json analysis ─────────────────────────────────────────────────
    if (name !== "package.json") continue;

    const pkg = parseJson<PackageJsonShape>(file.content);
    if (!pkg) continue;

    const scripts = pkg.scripts ?? {};

    // Check lifecycle hook scripts for dangerous payloads
    for (const hookKey of DANGEROUS_SCRIPT_KEYS) {
      const scriptValue = scripts[hookKey];
      if (!scriptValue) continue;

      const found = DANGEROUS_SCRIPT_TOKENS.filter((tok) =>
        scriptValue.toLowerCase().includes(tok.toLowerCase())
      );

      if (found.length > 0) {
        // Find line number
        const hookPattern = new RegExp(`["']${hookKey}["']\\s*:`);
        const match = hookPattern.exec(file.content);
        const lineNum = match
          ? file.content.substring(0, match.index).split("\n").length
          : 1;

        findings.push(
          makeFinding({
            severity: "CRITICAL_MALWARE",
            category: "DEPENDENCY_CONFUSION",
            title: `Dangerous Lifecycle Script in "${hookKey}"`,
            description:
              `The "${hookKey}" npm lifecycle script contains suspicious tokens: ` +
              `[${found.map((t) => `\`${t.trim()}\``).join(", ")}]. ` +
              "This script runs automatically when the package is installed. " +
              "Supply-chain attackers use lifecycle hooks to download and execute malware, " +
              "harvest environment variables (API keys, tokens), or install backdoors — " +
              "all without requiring any explicit action from the developer beyond `npm install`.",
            file: file.path,
            line: lineNum,
            snippet: getSnippet(file.content, lineNum),
            recommendation:
              "Immediately inspect the full script value. If this is a transitive dependency, " +
              "report the package to security@npmjs.com and remove it. " +
              "For first-party packages, replace shell scripts with purpose-built Node.js scripts. " +
              "Consider using `npm config set ignore-scripts true` in CI environments " +
              "to prevent lifecycle script execution.",
            cweId: "CWE-506",
            confidence: "HIGH",
          })
        );
      }
    }

    // ── Dependency confusion name-squatting heuristic ─────────────────────────
    //
    // Detect packages that appear to be internal (short name, no scope) but have
    // no repository field — a pattern common in confused dependency attacks where
    // the attacker publishes a public package with the same name as an internal one.

    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    for (const depName of Object.keys(allDeps)) {
      // Short unscoped names with common internal-sounding prefixes
      if (
        !depName.startsWith("@") &&
        /^(?:internal|private|local|corp|company|org|app|service|lib|utils|common|shared|core|platform)-\w+$/.test(
          depName
        )
      ) {
        findings.push(
          makeFinding({
            severity: "HIGH",
            category: "DEPENDENCY_CONFUSION",
            title: `Potential Dependency Confusion Target: "${depName}"`,
            description:
              `The package "${depName}" has a name pattern typical of internal/private ` +
              "packages (prefix: internal-, private-, corp-, service-, etc.) but is referenced " +
              "as a regular npm dependency. If this package doesn't exist on the public npm " +
              "registry, an attacker can publish a malicious version with a higher version number " +
              "and npm will silently install it instead of the intended private package.",
            file: file.path,
            recommendation:
              "Move all internal packages to a scoped name (`@your-org/package-name`) " +
              "to prevent namespace confusion. Configure your `.npmrc` to use a private " +
              "registry for your scope and set `@your-org:registry=https://your-registry.com`. " +
              "Run `npm audit` to check for known vulnerabilities.",
            cweId: "CWE-427",
            confidence: "LOW",
          })
        );
      }
    }

    // ── Missing repository field with network fetch in lifecycle scripts ───────
    //
    // Packages that (1) lack a `repository` field, (2) have lifecycle hooks, and
    // (3) fetch from the network are extremely suspicious.

    const hasLifecycleHook = DANGEROUS_SCRIPT_KEYS.some((k) => scripts[k]);
    const missingRepository = !pkg.repository;
    const hasNetworkFetch = DANGEROUS_SCRIPT_KEYS.some((k) =>
      ["curl ", "wget ", "fetch(", "http.get", "https.get"].some((tok) =>
        (scripts[k] ?? "").includes(tok)
      )
    );

    if (missingRepository && hasLifecycleHook && hasNetworkFetch) {
      findings.push(
        makeFinding({
          severity: "CRITICAL_MALWARE",
          category: "DEPENDENCY_CONFUSION",
          title: "Anonymous Package with Network-Fetching Lifecycle Hook",
          description:
            "This package.json has no `repository` field, contains lifecycle hooks, " +
            "AND those hooks perform network requests. An anonymous package that fetches " +
            "from the network during install is a textbook supply-chain attack pattern. " +
            "The lack of a repository makes it impossible to audit the source code.",
          file: file.path,
          recommendation:
            "Do not install this package. Investigate its origin immediately. " +
            "Check whether it was introduced by an AI assistant or via a compromised " +
            "dependency. Report to security@npmjs.com if found on the public registry.",
          cweId: "CWE-506",
          confidence: "HIGH",
        })
      );
    }
  }

  return findings;
};

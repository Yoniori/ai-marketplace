/**
 * Rule: Hardcoded Secrets
 *
 * Scans for API keys, tokens, and .env files that should never be committed.
 * Covers: OpenAI, Anthropic, Stripe, AWS, GitHub, and generic high-entropy secrets.
 *
 * Severity: HIGH (real keys) / CRITICAL_MALWARE (when combined with exfiltration)
 * CWE: CWE-312 — Cleartext Storage of Sensitive Information
 */

import {
  isExcludedPath,
  isScannableExtension,
  isCommittedEnvFile,
  isBinaryContent,
  getLineNumber,
  getSnippet,
  makeFinding,
  isPlaceholderValue,
} from "../utils";
import type { FileEntry, SecurityFinding, RuleFn } from "../types";

// ── Secret patterns ────────────────────────────────────────────────────────────

interface SecretPattern {
  name: string;
  /** Regex that captures the key VALUE in group 1. */
  regex: RegExp;
  minLength?: number;
}

const SECRET_PATTERNS: SecretPattern[] = [
  // OpenAI — new (sk-proj-...) and classic (sk-...)
  {
    name: "OpenAI API Key",
    regex: /(?:openai[_\-]?api[_\-]?key|OPENAI_API_KEY)\s*[=:]\s*['"]?(sk-(?:proj-)?[A-Za-z0-9\-_]{20,120})['"]?/gi,
  },
  // Also catch a bare sk- key appearing as an assignment value
  {
    name: "OpenAI API Key (bare)",
    regex: /['"`](sk-(?:proj-)?[A-Za-z0-9\-_]{40,120})['"`]/g,
  },

  // Anthropic
  {
    name: "Anthropic API Key",
    regex: /['"`](sk-ant-[A-Za-z0-9\-_]{20,120})['"`]/g,
  },

  // Stripe
  {
    name: "Stripe Live Secret Key",
    regex: /['"`](sk_live_[A-Za-z0-9]{24,64})['"`]/g,
  },
  {
    name: "Stripe Test Secret Key",
    regex: /['"`](sk_test_[A-Za-z0-9]{24,64})['"`]/g,
  },
  {
    name: "Stripe Publishable Key (Live)",
    regex: /['"`](pk_live_[A-Za-z0-9]{24,64})['"`]/g,
  },
  {
    name: "Stripe Webhook Secret",
    regex: /['"`](whsec_[A-Za-z0-9]{32,64})['"`]/g,
  },

  // AWS
  {
    name: "AWS Access Key ID",
    regex: /['"`](AKIA[0-9A-Z]{16})['"`]/g,
  },
  {
    name: "AWS Secret Access Key",
    regex: /(?:aws[_\-]?secret[_\-]?(?:access[_\-]?)?key)\s*[=:]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/gi,
  },

  // GitHub
  {
    name: "GitHub Personal Access Token",
    regex: /['"`](ghp_[A-Za-z0-9]{36,76})['"`]/g,
  },
  {
    name: "GitHub Fine-Grained Token",
    regex: /['"`](github_pat_[A-Za-z0-9_]{82})['"`]/g,
  },
  {
    name: "GitHub OAuth Token",
    regex: /['"`](gho_[A-Za-z0-9]{36})['"`]/g,
  },

  // Generic — high-confidence API key assignment patterns
  {
    name: "Generic API Key Assignment",
    regex: /(?:api[_\-]?(?:key|secret|token)|access[_\-]?token|secret[_\-]?key)\s*[=:]\s*['"]([A-Za-z0-9\-_]{24,128})['"]/gi,
    minLength: 24,
  },
];

// Extensions we scan for secrets (broader than code scanning)
const SECRET_SCAN_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".rb", ".php", ".go", ".java", ".cs",
  ".env", ".yml", ".yaml", ".toml", ".json",
  ".sh", ".bash", ".config", ".conf", ".ini", ".properties",
]);

function shouldScanForSecrets(filePath: string): boolean {
  const { extname, basename } = require("path") as typeof import("path");
  const name = basename(filePath).toLowerCase();
  // Always scan .env* files
  if (name.startsWith(".env")) return true;
  const ext = extname(filePath).toLowerCase();
  return SECRET_SCAN_EXTENSIONS.has(ext);
}

// ── Rule implementation ────────────────────────────────────────────────────────

export const run: RuleFn = async (files: FileEntry[]): Promise<SecurityFinding[]> => {
  const findings: SecurityFinding[] = [];

  for (const file of files) {
    if (isExcludedPath(file.path)) continue;
    if (isBinaryContent(file.content)) continue;
    if (!shouldScanForSecrets(file.path)) continue;

    // Flag committed .env files regardless of content
    if (isCommittedEnvFile(file.path)) {
      findings.push(
        makeFinding({
          severity: "HIGH",
          category: "HARDCODED_SECRET",
          title: "Committed .env File Detected",
          description:
            `The file "${file.path}" appears to be a committed environment file. ` +
            "Environment files containing secrets should NEVER be committed to source control. " +
            "Even if this file is empty now, its commit history may contain real credentials.",
          file: file.path,
          line: 1,
          snippet: file.content.split("\n").slice(0, 5).join("\n"),
          recommendation:
            "Add .env, .env.local, .env.production to your .gitignore immediately. " +
            "If secrets were committed, rotate all affected keys and purge the git history " +
            "using `git filter-repo` or BFG Repo-Cleaner.",
          cweId: "CWE-312",
          confidence: "HIGH",
        })
      );
    }

    // Scan for secret patterns
    const lines = file.content.split("\n");
    const content = file.content;

    for (const pattern of SECRET_PATTERNS) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(content)) !== null) {
        const value = match[1] ?? match[0];

        // Skip obvious placeholders
        if (isPlaceholderValue(value)) continue;
        // Skip very short matches
        if (value.length < (pattern.minLength ?? 16)) continue;
        // Skip if the value is all the same character (xxxxxxx type placeholders)
        if (/^(.)\1{5,}$/.test(value)) continue;

        const lineNum = getLineNumber(content, match.index);
        const snippet = getSnippet(content, lineNum);

        // Redact the key value in the description
        const redacted =
          value.substring(0, 6) + "..." + value.substring(value.length - 4);

        findings.push(
          makeFinding({
            severity: "HIGH",
            category: "HARDCODED_SECRET",
            title: `Hardcoded ${pattern.name}`,
            description:
              `A ${pattern.name} was found hardcoded in the source file. ` +
              `Detected value starts with: \`${redacted}\`. ` +
              "Hardcoded credentials are a critical exposure risk — they are visible to " +
              "anyone with read access to the repository and persist in git history.",
            file: file.path,
            line: lineNum,
            snippet,
            recommendation:
              "Immediately rotate/revoke this key. Move it to an environment variable " +
              "and access it via `process.env.KEY_NAME`. Add the .env file to .gitignore. " +
              "Scan your git history with `git log -p | grep -i <partial_key>`.",
            cweId: "CWE-312",
            confidence: "HIGH",
          })
        );
      }
    }

    // Additional: flag private key blocks (PEM / SSH)
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content)) {
      const lineNum = getLineNumber(
        content,
        content.indexOf("-----BEGIN")
      );
      findings.push(
        makeFinding({
          severity: "HIGH",
          category: "HARDCODED_SECRET",
          title: "Private Key Material in Source File",
          description:
            "A PEM/SSH private key block was found in the source file. " +
            "Committing private keys to a repository is a critical security risk.",
          file: file.path,
          line: lineNum,
          recommendation:
            "Remove the private key from the repository immediately. " +
            "Generate a new key pair — assume the old private key is compromised.",
          cweId: "CWE-321",
          confidence: "HIGH",
        })
      );
    }
  }

  return findings;
};

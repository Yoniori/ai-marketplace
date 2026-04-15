/**
 * ─── Security Auditor — Shared Utilities ─────────────────────────────────────
 *
 * Helper functions shared across all rule engines.
 */

import { extname, basename } from "path";
import type { SecurityFinding, Severity, SecurityCategory } from "./types";

// ── File filtering ─────────────────────────────────────────────────────────────

/** Extensions we bother scanning for code/config issues. */
const SCANNABLE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".rb", ".php", ".go", ".java", ".cs",
  ".json", ".env", ".yml", ".yaml", ".toml",
  ".sh", ".bash", ".zsh", ".fish",
  ".html", ".vue", ".svelte", ".ejs", ".hbs",
  ".graphql", ".gql",
]);

/** Paths/directories we always skip — generated code, lock files, etc. */
const EXCLUDED_PATH_SEGMENTS = [
  "node_modules/",
  ".next/",
  "dist/",
  "build/",
  ".git/",
  "coverage/",
  "__pycache__/",
  ".venv/",
  "vendor/",
];

/** File name suffixes/patterns that are safe to skip for secret scanning. */
export const SAFE_ENV_SUFFIXES = [
  ".example", ".sample", ".template", ".placeholder", ".stub",
];

/** Returns true if this file path should be skipped entirely. */
export function isExcludedPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return EXCLUDED_PATH_SEGMENTS.some((seg) => normalized.includes(seg));
}

/** Returns true if the file extension is worth scanning. */
export function isScannableExtension(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  // Always include files with no extension if the basename is .env*
  if (basename(filePath).startsWith(".env")) return true;
  return SCANNABLE_EXTENSIONS.has(ext);
}

/** Returns true if this looks like a committed .env file (not an example). */
export function isCommittedEnvFile(filePath: string): boolean {
  const name = basename(filePath).toLowerCase();
  if (!name.startsWith(".env")) return false;
  // .env.example, .env.sample, .env.template → safe
  return !SAFE_ENV_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

/** Returns true if the content appears to be a binary file (null bytes). */
export function isBinaryContent(content: string): boolean {
  return content.includes("\0");
}

// ── Line-number helpers ────────────────────────────────────────────────────────

/** Returns the 1-based line number for the given character index in content. */
export function getLineNumber(content: string, charIndex: number): number {
  return content.substring(0, charIndex).split("\n").length;
}

/**
 * Returns a short code snippet centred on the given 1-based line number.
 * Each line is prefixed with its line number for easy reference.
 */
export function getSnippet(
  content: string,
  lineNumber: number,
  contextLines = 2
): string {
  const lines = content.split("\n");
  const start = Math.max(0, lineNumber - 1 - contextLines);
  const end   = Math.min(lines.length - 1, lineNumber - 1 + contextLines);
  return lines
    .slice(start, end + 1)
    .map((line, i) => {
      const n    = String(start + i + 1).padStart(4, " ");
      const mark = start + i + 1 === lineNumber ? "▶" : " ";
      return `${n}${mark} ${line}`;
    })
    .join("\n");
}

// ── Finding factory ────────────────────────────────────────────────────────────

let _seq = 0;

/** Creates a SecurityFinding with a unique sequential ID. */
export function makeFinding(
  partial: Omit<SecurityFinding, "id">
): SecurityFinding {
  _seq += 1;
  const id = `SA-${String(_seq).padStart(4, "0")}`;
  return { id, ...partial };
}

// ── Placeholder-value guard ────────────────────────────────────────────────────

const PLACEHOLDER_PATTERNS = [
  /your[_-]?key/i,
  /your[_-]?secret/i,
  /insert[_-]?here/i,
  /replace[_-]?me/i,
  /xxx+/i,
  /placeholder/i,
  /changeme/i,
  /todo/i,
  /example/i,
  /12345/,
  /test[_-]?key/i,
  /dummy/i,
  /fake/i,
];

/** Returns true if the matched value looks like a placeholder (not a real secret). */
export function isPlaceholderValue(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((p) => p.test(value));
}

// ── Severity helpers ──────────────────────────────────────────────────────────

/** Maps a Severity to its numeric weight for sorting/comparison. */
export function severityWeight(sev: Severity): number {
  switch (sev) {
    case "CRITICAL_MALWARE":        return 4;
    case "HIGH":                    return 3;
    case "MEDIUM_AI_HALLUCINATION": return 2;
    case "LOW":                     return 1;
  }
}

/** Short display label for report tables. */
export function severityLabel(sev: Severity): string {
  switch (sev) {
    case "CRITICAL_MALWARE":        return "🔴 CRITICAL: MALWARE";
    case "HIGH":                    return "🟠 HIGH: SECURITY BREACH";
    case "MEDIUM_AI_HALLUCINATION": return "🟡 MEDIUM: AI-HALLUCINATION";
    case "LOW":                     return "🔵 LOW: CODE QUALITY";
  }
}

/** Maps a category to its CWE page URL for the report. */
export function categoryToCwe(cat: SecurityCategory): string | undefined {
  const MAP: Partial<Record<SecurityCategory, string>> = {
    SQL_INJECTION:        "CWE-89",
    INSECURE_OUTPUT:      "CWE-79",
    HARDCODED_SECRET:     "CWE-312",
    BROKEN_AUTHENTICATION:"CWE-287",
    IDOR:                 "CWE-284",
    PROMPT_INJECTION:     "CWE-1336",
    MALWARE:              "CWE-506",
    PHANTOM_DEPENDENCY:   "CWE-1104",
    DEPENDENCY_CONFUSION: "CWE-427",
  };
  return MAP[cat];
}

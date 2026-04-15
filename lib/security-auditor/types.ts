/**
 * ─── Security Auditor — Core Types ───────────────────────────────────────────
 *
 * Shared interfaces and enums for the External Repo Security Auditor module.
 * Used by every rule engine, the scanner orchestrator, and the report generator.
 */

// ── Severity scale ────────────────────────────────────────────────────────────

/** Four-tier severity scale aligned with CVSS and the Security Report Template. */
export type Severity =
  | "CRITICAL_MALWARE"       // Definite malicious code: backdoors, exfiltration, obfuscated exec
  | "HIGH"                   // Exploitable security flaw: secrets, SQLi, XSS, broken auth
  | "MEDIUM_AI_HALLUCINATION"// AI-specific risk: phantom deps, prompt injection, insecure output
  | "LOW";                   // Hygiene / code-quality warning

// ── Finding categories ────────────────────────────────────────────────────────

export type SecurityCategory =
  | "MALWARE"
  | "PROMPT_INJECTION"
  | "INSECURE_OUTPUT"
  | "HARDCODED_SECRET"
  | "SQL_INJECTION"
  | "IDOR"
  | "BROKEN_AUTHENTICATION"
  | "PHANTOM_DEPENDENCY"
  | "DEPENDENCY_CONFUSION";

// ── Core data structures ──────────────────────────────────────────────────────

/** A single file presented to the scanner rules. */
export interface FileEntry {
  /** Relative path from repo root, e.g. "src/api/users.ts" */
  path: string;
  /** UTF-8 decoded file content (binary files should be excluded before scanning) */
  content: string;
}

/** A single actionable security finding produced by a rule engine. */
export interface SecurityFinding {
  /** Short unique ID for deduplication, e.g. "A3F7B2" */
  id: string;
  severity: Severity;
  category: SecurityCategory;
  /** Short human-readable title, e.g. "Hardcoded OpenAI API Key" */
  title: string;
  /** Detailed explanation of the risk */
  description: string;
  /** File path where the finding was detected */
  file: string;
  /** 1-based line number */
  line?: number;
  /** Code snippet (a few lines around the match) */
  snippet?: string;
  /** Actionable fix recommendation */
  recommendation: string;
  /** Common Weakness Enumeration identifier, e.g. "CWE-89" */
  cweId?: string;
  /** Scanner confidence level — affects display priority */
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

// ── Audit configuration ───────────────────────────────────────────────────────

export interface AuditConfig {
  /**
   * Whether to verify npm package existence against the registry.
   * Requires outbound network access. Default: true.
   */
  checkPhantomDeps?: boolean;
  /** Timeout in ms for npm registry HTTP calls. Default: 5000. */
  networkTimeout?: number;
  /** Max file size in bytes to scan. Larger files are skipped. Default: 1 048 576 (1 MB). */
  maxFileSizeBytes?: number;
}

// ── Report ────────────────────────────────────────────────────────────────────

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "CLEAN";

export interface SecurityReport {
  /** GitHub URL or local path used to identify the scanned target */
  repoIdentifier: string;
  scanTimestamp: string;
  scanDurationMs: number;
  overallRisk: RiskLevel;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  findings: SecurityFinding[];
  /** Packages confirmed absent from the npm registry */
  phantomDependencies: string[];
  filesScanned: number;
  /** Pre-rendered Markdown security report */
  markdown: string;
}

// ── Rule contract ─────────────────────────────────────────────────────────────

/** Every rule module must export a function matching this signature. */
export type RuleFn = (
  files: FileEntry[],
  config: Required<AuditConfig>
) => Promise<SecurityFinding[]>;

/**
 * ─── Security Auditor — Public API ──────────────────────────────────────────
 *
 * The single entry point for the External Repo Security Auditor.
 * Import `runSecurityAudit` and pass it an array of FileEntry objects.
 *
 * Usage:
 *   import { runSecurityAudit } from "@/lib/security-auditor";
 *
 *   const report = await runSecurityAudit("github.com/user/repo", files);
 *   console.log(report.markdown);
 */

export { runSecurityScan as runSecurityAudit } from "./scanner";

// Re-export types for consumers
export type {
  FileEntry,
  SecurityFinding,
  SecurityReport,
  AuditConfig,
  Severity,
  SecurityCategory,
  RiskLevel,
  RuleFn,
} from "./types";

// Re-export report generator for custom rendering
export { generateMarkdownReport } from "./report";

// Re-export severity helpers for UI consumers
export { severityLabel, severityWeight, categoryToCwe } from "./utils";

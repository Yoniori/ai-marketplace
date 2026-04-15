/**
 * ─── Security Auditor — Scanner Orchestrator ────────────────────────────────
 *
 * Runs all rule engines in parallel over the provided file set and aggregates
 * results into a normalised SecurityReport. This is the core execution engine.
 */

import type {
  FileEntry,
  SecurityFinding,
  SecurityReport,
  AuditConfig,
  RiskLevel,
  Severity,
} from "./types";
import { severityWeight, severityLabel } from "./utils";
import { generateMarkdownReport } from "./report";

// ── Rule imports ──────────────────────────────────────────────────────────────

import { run as runHardcodedSecrets }    from "./rules/hardcoded-secrets";
import { run as runPromptInjection }     from "./rules/prompt-injection";
import { run as runInsecureOutput }      from "./rules/insecure-output";
import { run as runMalwareDetection }    from "./rules/malware-detection";
import { run as runClassicFlaws }        from "./rules/classic-flaws";
import { run as runPhantomDeps }         from "./rules/phantom-deps";
import { run as runDependencyConfusion } from "./rules/dependency-confusion";

// ── Default config ─────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Required<AuditConfig> = {
  checkPhantomDeps:  true,
  networkTimeout:    5_000,
  maxFileSizeBytes:  1_048_576, // 1 MB
};

// ── Risk level calculation ─────────────────────────────────────────────────────

function calculateRiskLevel(findings: SecurityFinding[]): RiskLevel {
  if (findings.length === 0) return "CLEAN";

  const hasCritical = findings.some((f) => f.severity === "CRITICAL_MALWARE");
  if (hasCritical) return "CRITICAL";

  const highCount = findings.filter((f) => f.severity === "HIGH").length;
  if (highCount >= 3) return "HIGH";
  if (highCount >= 1) return "HIGH";

  const mediumCount = findings.filter(
    (f) => f.severity === "MEDIUM_AI_HALLUCINATION"
  ).length;
  if (mediumCount >= 1) return "MEDIUM";

  return "LOW";
}

// ── Summary builder ────────────────────────────────────────────────────────────

function buildSummary(findings: SecurityFinding[]) {
  return {
    total:    findings.length,
    critical: findings.filter((f) => f.severity === "CRITICAL_MALWARE").length,
    high:     findings.filter((f) => f.severity === "HIGH").length,
    medium:   findings.filter((f) => f.severity === "MEDIUM_AI_HALLUCINATION").length,
    low:      findings.filter((f) => f.severity === "LOW").length,
  };
}

// ── File size filtering ────────────────────────────────────────────────────────

function filterOversizedFiles(
  files: FileEntry[],
  maxBytes: number
): FileEntry[] {
  return files.filter((f) => {
    const byteLen = Buffer.byteLength(f.content, "utf8");
    return byteLen <= maxBytes;
  });
}

// ── Main scanner ───────────────────────────────────────────────────────────────

/**
 * Runs all security rule engines over the given file set.
 *
 * @param repoIdentifier  Human-readable label (GitHub URL or local path).
 * @param files           Array of { path, content } file entries.
 * @param config          Optional config overrides.
 * @returns               A fully-populated SecurityReport.
 */
export async function runSecurityScan(
  repoIdentifier: string,
  files: FileEntry[],
  config: AuditConfig = {}
): Promise<SecurityReport> {
  const start = Date.now();
  const resolvedConfig: Required<AuditConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Strip oversized files before handing to rules
  const scannableFiles = filterOversizedFiles(files, resolvedConfig.maxFileSizeBytes);

  // Run all rules in parallel
  const [
    secretFindings,
    promptFindings,
    outputFindings,
    malwareFindings,
    classicFindings,
    phantomFindings,
    confusionFindings,
  ] = await Promise.all([
    runHardcodedSecrets(scannableFiles, resolvedConfig),
    runPromptInjection(scannableFiles, resolvedConfig),
    runInsecureOutput(scannableFiles, resolvedConfig),
    runMalwareDetection(scannableFiles, resolvedConfig),
    runClassicFlaws(scannableFiles, resolvedConfig),
    runPhantomDeps(scannableFiles, resolvedConfig),
    runDependencyConfusion(scannableFiles, resolvedConfig),
  ]);

  // Aggregate and sort by severity (critical → high → medium → low)
  const allFindings: SecurityFinding[] = [
    ...secretFindings,
    ...promptFindings,
    ...outputFindings,
    ...malwareFindings,
    ...classicFindings,
    ...phantomFindings,
    ...confusionFindings,
  ].sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity));

  // Deduplicate by (file, line, title) to avoid double-reporting from overlapping regexes
  const seen = new Set<string>();
  const dedupedFindings = allFindings.filter((f) => {
    const key = `${f.file}:${f.line ?? 0}:${f.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Extract phantom dependency names for the report summary
  const phantomDependencies = dedupedFindings
    .filter((f) => f.category === "PHANTOM_DEPENDENCY" && f.confidence === "HIGH")
    .map((f) => {
      // Parse package name from title: `Phantom Dependency: "pkg-name" Not Found on npm`
      const match = f.title.match(/"([^"]+)"/);
      return match ? match[1] : "";
    })
    .filter(Boolean);

  const scanDurationMs = Date.now() - start;
  const overallRisk    = calculateRiskLevel(dedupedFindings);
  const summary        = buildSummary(dedupedFindings);

  const report: SecurityReport = {
    repoIdentifier,
    scanTimestamp:   new Date().toISOString(),
    scanDurationMs,
    overallRisk,
    summary,
    findings:        dedupedFindings,
    phantomDependencies,
    filesScanned:    scannableFiles.length,
    markdown:        "", // populated below
  };

  report.markdown = generateMarkdownReport(report);

  return report;
}

/**
 * ─── Security Auditor — Test Runner ─────────────────────────────────────────
 *
 * Loads the dummy-infected fixture folder and runs the full security scan,
 * printing a colour-coded report to stdout.
 *
 * Usage:
 *   npx tsx scripts/test-security-auditor.ts
 *   npm run audit:test
 */

import * as fs   from "fs";
import * as path from "path";
import { runSecurityAudit } from "../lib/security-auditor";
import type { FileEntry, SecurityReport, RiskLevel } from "../lib/security-auditor";

// ── ANSI colour helpers ───────────────────────────────────────────────────────

const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  red:    "\x1b[31m",
  orange: "\x1b[33m",
  yellow: "\x1b[93m",
  green:  "\x1b[32m",
  cyan:   "\x1b[36m",
  blue:   "\x1b[34m",
  grey:   "\x1b[90m",
  white:  "\x1b[97m",
};

function colour(text: string, ...codes: string[]): string {
  return codes.join("") + text + C.reset;
}

// ── Risk level colour ────────────────────────────────────────────────────────

function riskColour(risk: RiskLevel): string {
  switch (risk) {
    case "CRITICAL": return C.red + C.bold;
    case "HIGH":     return C.orange + C.bold;
    case "MEDIUM":   return C.yellow + C.bold;
    case "LOW":      return C.blue + C.bold;
    case "CLEAN":    return C.green + C.bold;
  }
}

// ── File loader ───────────────────────────────────────────────────────────────

function loadFixtureFiles(fixtureDir: string): FileEntry[] {
  const files: FileEntry[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        try {
          const content = fs.readFileSync(full, "utf-8");
          // Use path relative to fixture dir
          const relative = path.relative(fixtureDir, full).replace(/\\/g, "/");
          files.push({ path: relative, content });
        } catch {
          // Skip unreadable files (binary, permissions, etc.)
        }
      }
    }
  }

  walk(fixtureDir);
  return files;
}

// ── Print helpers ─────────────────────────────────────────────────────────────

function printHeader() {
  console.log("");
  console.log(colour("╔══════════════════════════════════════════════════════╗", C.cyan, C.bold));
  console.log(colour("║   🔐  VIBE CODE MARKET — SECURITY AUDITOR TEST       ║", C.cyan, C.bold));
  console.log(colour("╚══════════════════════════════════════════════════════╝", C.cyan, C.bold));
  console.log("");
}

function printSummary(report: SecurityReport) {
  const risk = report.overallRisk;
  const rc   = riskColour(risk);

  console.log(colour("─".repeat(54), C.grey));
  console.log(colour("SCAN SUMMARY", C.bold, C.white));
  console.log(colour("─".repeat(54), C.grey));
  console.log(`  Target:       ${colour(report.repoIdentifier, C.cyan)}`);
  console.log(`  Files scanned: ${colour(String(report.filesScanned), C.white)}`);
  console.log(`  Duration:      ${colour(report.scanDurationMs + "ms", C.white)}`);
  console.log(`  Overall Risk:  ${colour(risk, rc)}`);
  console.log("");
  console.log(colour("  FINDING COUNTS", C.bold, C.white));
  console.log(`  🔴 Critical (Malware):  ${colour(String(report.summary.critical), C.red, C.bold)}`);
  console.log(`  🟠 High (Security):     ${colour(String(report.summary.high), C.orange, C.bold)}`);
  console.log(`  🟡 Medium (AI Risk):    ${colour(String(report.summary.medium), C.yellow, C.bold)}`);
  console.log(`  🔵 Low (Hygiene):       ${colour(String(report.summary.low), C.blue)}`);
  console.log(`  ─────────────────────`);
  console.log(`  Total:                  ${colour(String(report.summary.total), C.bold, C.white)}`);
  console.log("");
}

function printFindings(report: SecurityReport) {
  if (report.findings.length === 0) {
    console.log(colour("  ✅  No findings — all checks passed!", C.green, C.bold));
    return;
  }

  console.log(colour("─".repeat(54), C.grey));
  console.log(colour("FINDINGS", C.bold, C.white));
  console.log(colour("─".repeat(54), C.grey));
  console.log("");

  for (const [i, finding] of report.findings.entries()) {
    const severityColour =
      finding.severity === "CRITICAL_MALWARE"        ? C.red + C.bold :
      finding.severity === "HIGH"                    ? C.orange + C.bold :
      finding.severity === "MEDIUM_AI_HALLUCINATION" ? C.yellow :
      C.blue;

    const severityLabel =
      finding.severity === "CRITICAL_MALWARE"        ? "🔴 CRITICAL" :
      finding.severity === "HIGH"                    ? "🟠 HIGH" :
      finding.severity === "MEDIUM_AI_HALLUCINATION" ? "🟡 MEDIUM" :
      "🔵 LOW";

    console.log(
      colour(`  [${String(i + 1).padStart(2, "0")}] `, C.grey) +
      colour(severityLabel, severityColour) +
      colour(` — ${finding.title}`, C.white, C.bold)
    );
    console.log(
      colour(`       File: `, C.grey) +
      colour(`${finding.file}${finding.line ? `:${finding.line}` : ""}`, C.cyan)
    );
    console.log(
      colour(`       ID:   ${finding.id}  |  Category: ${finding.category}  |  CWE: ${finding.cweId ?? "N/A"}`, C.grey)
    );
    console.log("");
  }
}

function printPhantomDeps(report: SecurityReport) {
  if (report.phantomDependencies.length === 0) return;
  console.log(colour("─".repeat(54), C.grey));
  console.log(colour("👻 PHANTOM DEPENDENCIES (NOT ON NPM)", C.yellow, C.bold));
  console.log(colour("─".repeat(54), C.grey));
  for (const dep of report.phantomDependencies) {
    console.log(colour(`   ✗ ${dep}`, C.red));
  }
  console.log("");
}

function printMarkdownPreview(report: SecurityReport) {
  console.log(colour("─".repeat(54), C.grey));
  console.log(colour("MARKDOWN REPORT PREVIEW (first 40 lines)", C.bold, C.white));
  console.log(colour("─".repeat(54), C.grey));
  const preview = report.markdown.split("\n").slice(0, 40).join("\n");
  console.log(colour(preview, C.grey));
  console.log(colour("  ... (full report available in report.markdown)", C.grey));
  console.log("");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  printHeader();

  const fixtureDir = path.join(__dirname, "../tests/fixtures/dummy-infected");

  if (!fs.existsSync(fixtureDir)) {
    console.error(colour(`ERROR: Fixture directory not found: ${fixtureDir}`, C.red));
    process.exit(1);
  }

  console.log(colour(`  Loading fixtures from: ${fixtureDir}`, C.grey));
  const files = loadFixtureFiles(fixtureDir);
  console.log(colour(`  Loaded ${files.length} files`, C.grey));
  console.log("");

  console.log(colour("  Running security scan…", C.cyan));
  console.log("");

  const report = await runSecurityAudit(
    "tests/fixtures/dummy-infected (local test)",
    files,
    {
      checkPhantomDeps: false, // Skip live npm checks in local test — avoids network dependency
      networkTimeout:   3_000,
    }
  );

  printSummary(report);
  printPhantomDeps(report);
  printFindings(report);
  printMarkdownPreview(report);

  // Exit with non-zero code if critical or high issues found (useful for CI)
  if (report.summary.critical > 0 || report.summary.high > 0) {
    console.log(colour("  ⚠️  Exiting with code 1 (critical/high issues found)", C.orange, C.bold));
    process.exit(1);
  }

  console.log(colour("  ✅  Scan complete", C.green, C.bold));
  process.exit(0);
}

main().catch((err) => {
  console.error(colour("FATAL ERROR:", C.red, C.bold), err);
  process.exit(1);
});

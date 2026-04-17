/**
 * ─── Security Auditor — Self-Test CLI Runner ────────────────────────────────
 *
 * Loads the dummy-infected fixture + baseline JSON, runs the self-test, and
 * exits non-zero if detection regressed.
 *
 * Two modes:
 *   npm run audit:self-test              → validate against baseline (fails on regression)
 *   npm run audit:self-test -- --update  → regenerate the baseline from current scan output
 */

import * as fs   from "fs";
import * as path from "path";
import { runSelfTest, type Baseline } from "../lib/security-auditor/self-test";
import type { FileEntry, SecurityCategory } from "../lib/security-auditor";
import { SecurityGuardian } from "../lib/security-auditor/guardian";

// ── ANSI colour helpers ───────────────────────────────────────────────────────

const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  red:    "\x1b[31m",
  orange: "\x1b[33m",
  yellow: "\x1b[93m",
  green:  "\x1b[32m",
  cyan:   "\x1b[36m",
  grey:   "\x1b[90m",
  white:  "\x1b[97m",
};

const colour = (t: string, ...c: string[]) => c.join("") + t + C.reset;

// ── Paths ─────────────────────────────────────────────────────────────────────

const FIXTURE_DIR  = path.join(__dirname, "../tests/fixtures/dummy-infected");
const BASELINE_PATH = path.join(FIXTURE_DIR, "expected-findings.json");

// ── File loader ───────────────────────────────────────────────────────────────

function loadFixtureFiles(fixtureDir: string): FileEntry[] {
  const files: FileEntry[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        // Skip the baseline JSON itself — it's not scanner input
        if (full === BASELINE_PATH) continue;
        try {
          const content = fs.readFileSync(full, "utf-8");
          const relative = path.relative(fixtureDir, full).replace(/\\/g, "/");
          files.push({ path: relative, content });
        } catch { /* skip unreadable */ }
      }
    }
  }

  walk(fixtureDir);
  return files;
}

// ── Baseline regeneration ─────────────────────────────────────────────────────

async function regenerateBaseline(files: FileEntry[]): Promise<void> {
  console.log(colour("\n  Regenerating baseline snapshot…", C.cyan, C.bold));

  const guardian = new SecurityGuardian();
  const report = await guardian.scan(
    "tests/fixtures/dummy-infected (baseline gen)",
    files,
    { checkPhantomDeps: false }
  );

  const byCategory: Partial<Record<SecurityCategory, number>> = {};
  for (const f of report.findings) {
    byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;
  }

  const baseline: Baseline = {
    generatedAt:        new Date().toISOString(),
    totalFindings:      report.findings.length,
    minAllowedFindings: report.findings.length,
    byCategory,
    expectedTitles:     Array.from(new Set(report.findings.map((f) => f.title))).sort(),
  };

  fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n", "utf-8");
  console.log(colour(`  ✓ Baseline written: ${BASELINE_PATH}`, C.green, C.bold));
  console.log(colour(`    ${baseline.totalFindings} findings across ${Object.keys(byCategory).length} categories`, C.grey));
  console.log("");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const updateMode = args.includes("--update");

  console.log("");
  console.log(colour("╔════════════════════════════════════════════════════════╗", C.cyan, C.bold));
  console.log(colour("║   🛡️   SECURITY AUDITOR — SELF-TEST (Guardian)          ║", C.cyan, C.bold));
  console.log(colour("╚════════════════════════════════════════════════════════╝", C.cyan, C.bold));
  console.log("");

  if (!fs.existsSync(FIXTURE_DIR)) {
    console.error(colour(`  ERROR: Fixture dir not found: ${FIXTURE_DIR}`, C.red));
    process.exit(2);
  }

  const files = loadFixtureFiles(FIXTURE_DIR);
  console.log(colour(`  Loaded ${files.length} fixture files`, C.grey));

  // ── Regenerate mode ───────────────────────────────────────────────────────
  if (updateMode) {
    await regenerateBaseline(files);
    process.exit(0);
  }

  // ── Validate mode ─────────────────────────────────────────────────────────
  if (!fs.existsSync(BASELINE_PATH)) {
    console.error(colour(`  ERROR: Baseline not found at ${BASELINE_PATH}`, C.red));
    console.error(colour(`  Run: npm run audit:self-test -- --update`, C.yellow));
    process.exit(2);
  }

  const baseline: Baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf-8"));
  console.log(colour(`  Baseline: ${baseline.totalFindings} findings expected across ${Object.keys(baseline.byCategory).length} categories`, C.grey));
  console.log(colour(`  Baseline generated: ${baseline.generatedAt}`, C.grey));
  console.log("");

  console.log(colour("  Running scan…", C.cyan));
  const result = await runSelfTest(files, baseline);
  console.log("");

  // ── Print per-category results ────────────────────────────────────────────
  console.log(colour("  PER-CATEGORY DETECTION", C.bold, C.white));
  console.log(colour("  " + "─".repeat(54), C.grey));
  for (const [cat, row] of Object.entries(result.byCategory)) {
    const mark   = row.passed ? colour("✓", C.green) : colour("✗", C.red);
    const status = row.passed
      ? colour(`${row.actual}/${row.expected}`, C.green)
      : colour(`${row.actual}/${row.expected}`, C.red, C.bold);
    console.log(`  ${mark} ${cat.padEnd(28, " ")} ${status}`);
  }
  console.log("");

  // ── Totals ────────────────────────────────────────────────────────────────
  console.log(colour("  TOTAL FINDINGS", C.bold, C.white));
  console.log(colour("  " + "─".repeat(54), C.grey));
  const t = result.totalFindings;
  const deltaStr =
    t.delta === 0 ? colour("(unchanged)", C.grey) :
    t.delta  > 0 ? colour(`(+${t.delta})`, C.green) :
                   colour(`(${t.delta})`, C.red, C.bold);
  console.log(`    Expected: ${t.expected}   Actual: ${t.actual}   ${deltaStr}`);
  console.log(`    Detection rate: ${(result.detectionRate * 100).toFixed(1)}%`);
  console.log("");

  // ── Missing / unexpected ──────────────────────────────────────────────────
  if (result.missedTitles.length > 0) {
    console.log(colour(`  ✗ MISSED (${result.missedTitles.length} titles from baseline not detected):`, C.red, C.bold));
    for (const t of result.missedTitles) {
      console.log(colour(`    - ${t}`, C.red));
    }
    console.log("");
  }
  if (result.unexpectedTitles.length > 0) {
    console.log(colour(`  + NEW (${result.unexpectedTitles.length} titles not in baseline — may be improvements):`, C.cyan));
    for (const t of result.unexpectedTitles) {
      console.log(colour(`    + ${t}`, C.cyan));
    }
    console.log("");
  }

  // ── Result ────────────────────────────────────────────────────────────────
  if (result.passed) {
    console.log(colour("  ✅  SELF-TEST PASSED — detection rate maintained", C.green, C.bold));
    console.log("");
    process.exit(0);
  } else {
    console.log(colour("  ❌  SELF-TEST FAILED — detection regressed from baseline", C.red, C.bold));
    console.log(colour("      If the regression is intentional, regenerate the baseline:", C.yellow));
    console.log(colour("        npm run audit:self-test -- --update", C.yellow));
    console.log("");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(colour("  FATAL:", C.red, C.bold), err);
  process.exit(2);
});

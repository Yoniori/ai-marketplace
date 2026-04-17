/**
 * ─── Security Auditor — Self-Test (Baseline Validator) ──────────────────────
 *
 * Validates that the rule engine still detects the known set of vulnerabilities
 * in `tests/fixtures/dummy-infected/`. Run via `npm run audit:self-test`.
 *
 * How it works:
 *   1. Loads the fixture folder from disk
 *   2. Runs the SecurityGuardian scan
 *   3. Compares `{ category → count }` against the JSON baseline snapshot
 *   4. Reports per-category pass/fail and exits non-zero if detection dropped
 *
 * This is **not** run at scan time — it's a CI / developer-local sanity check
 * to catch regressions when you modify rule regex patterns.
 */

import type { SecurityFinding, SecurityCategory, SecurityReport } from "./types";
import { SecurityGuardian } from "./guardian";
import type { FileEntry } from "./types";

// ── Expected baseline shape ──────────────────────────────────────────────────

export interface Baseline {
  /** Baseline creation / last-update timestamp */
  generatedAt: string;
  /** Total number of findings expected */
  totalFindings: number;
  /** Minimum allowed findings (regression threshold) — should equal totalFindings */
  minAllowedFindings: number;
  /** Per-category expected minimum counts */
  byCategory: Partial<Record<SecurityCategory, number>>;
  /** Full list of expected finding titles (advisory only — count matters more) */
  expectedTitles: string[];
}

// ── Self-test result ──────────────────────────────────────────────────────────

export interface SelfTestResult {
  passed: boolean;
  ranAt: string;
  totalFindings:    { expected: number; actual: number; delta: number };
  byCategory:       Record<string, { expected: number; actual: number; passed: boolean }>;
  missedTitles:     string[];
  unexpectedTitles: string[];
  detectionRate:    number;
  report:           SecurityReport;
}

// ── Category tally ────────────────────────────────────────────────────────────

function tallyByCategory(
  findings: SecurityFinding[]
): Partial<Record<SecurityCategory, number>> {
  const tally: Partial<Record<SecurityCategory, number>> = {};
  for (const f of findings) {
    tally[f.category] = (tally[f.category] ?? 0) + 1;
  }
  return tally;
}

// ── Core runner ───────────────────────────────────────────────────────────────

/**
 * Runs the scanner against `files` and compares the result to `baseline`.
 *
 * @param files     FileEntry[] loaded from the dummy-infected fixture.
 * @param baseline  Parsed expected-findings.json.
 */
export async function runSelfTest(
  files: FileEntry[],
  baseline: Baseline
): Promise<SelfTestResult> {
  const guardian = new SecurityGuardian();
  const report = await guardian.scan(
    "tests/fixtures/dummy-infected (self-test)",
    files,
    { checkPhantomDeps: false } // no network — self-test must be deterministic
  );

  const findings   = report.findings;
  const actualTally = tallyByCategory(findings);

  // Per-category results
  const byCategory: SelfTestResult["byCategory"] = {};
  const categories = new Set<SecurityCategory>([
    ...(Object.keys(baseline.byCategory) as SecurityCategory[]),
    ...(Object.keys(actualTally)         as SecurityCategory[]),
  ]);
  for (const cat of categories) {
    const expected = baseline.byCategory[cat] ?? 0;
    const actual   = actualTally[cat] ?? 0;
    byCategory[cat] = {
      expected,
      actual,
      passed: actual >= expected,
    };
  }

  const actualTitles = new Set(findings.map((f) => f.title));
  const missedTitles     = baseline.expectedTitles.filter((t) => !actualTitles.has(t));
  const unexpectedTitles = [...actualTitles].filter(
    (t) => !baseline.expectedTitles.includes(t)
  );

  const allCategoriesPass = Object.values(byCategory).every((r) => r.passed);
  const meetsMinimum      = findings.length >= baseline.minAllowedFindings;
  const passed            = allCategoriesPass && meetsMinimum;

  return {
    passed,
    ranAt: new Date().toISOString(),
    totalFindings: {
      expected: baseline.totalFindings,
      actual:   findings.length,
      delta:    findings.length - baseline.totalFindings,
    },
    byCategory,
    missedTitles,
    unexpectedTitles,
    detectionRate:
      baseline.totalFindings === 0
        ? 1
        : Math.min(findings.length / baseline.totalFindings, 1),
    report,
  };
}

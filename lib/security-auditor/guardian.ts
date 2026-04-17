/**
 * ─── SecurityGuardian ───────────────────────────────────────────────────────
 *
 * Thin facade around `runSecurityScan` that adds:
 *   - progress events (per-check start/end, per-rule timing)
 *   - live check-count / coverage reporting (from the registry)
 *   - ergonomic API for UI + admin endpoint consumption
 *
 * Intentionally NOT an LLM agent: the Guardian is deterministic, fast, and
 * auditable. It exists so the per-file rule engine can be wrapped with
 * instrumentation without touching the rule files themselves.
 *
 * Usage:
 *   const guardian = new SecurityGuardian();
 *   guardian.on("check-start", (c) => console.log(`running ${c.id}`));
 *   const report = await guardian.scan(repoId, files);
 */

import type {
  FileEntry,
  SecurityReport,
  AuditConfig,
  SecurityCategory,
} from "./types";
import { runSecurityScan } from "./scanner";
import {
  CHECK_REGISTRY,
  getCheckCount,
  getCoveredCategories,
  getChecksByRuleFile,
  type CheckDescriptor,
} from "./registry";

// ── Event types ──────────────────────────────────────────────────────────────

interface RuleTiming {
  ruleFile: string;
  checksInFile: number;
  durationMs: number;
}

type GuardianEvent =
  | { type: "scan-start";  target: string; filesTotal: number; checksAvailable: number }
  | { type: "check-start"; check: CheckDescriptor; index: number; total: number }
  | { type: "check-end";   check: CheckDescriptor; index: number; total: number }
  | { type: "rule-timing"; timing: RuleTiming }
  | { type: "scan-end";    durationMs: number; findingsCount: number };

type GuardianListener = (event: GuardianEvent) => void;

// ── Guardian class ───────────────────────────────────────────────────────────

export class SecurityGuardian {
  private listeners: GuardianListener[] = [];
  private lastScan: SecurityReport | null = null;
  private lastRuleTimings: RuleTiming[] = [];

  // ── Subscription ──────────────────────────────────────────────────────────

  on(listener: GuardianListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(event: GuardianEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        /* listener errors must never break a scan */
      }
    }
  }

  // ── Public introspection ──────────────────────────────────────────────────

  /** Total number of distinct detection patterns available. */
  getCheckCount(): number {
    return getCheckCount();
  }

  /** All checks this guardian can perform. */
  listChecks(): readonly CheckDescriptor[] {
    return CHECK_REGISTRY;
  }

  /** Categories covered by at least one check. */
  getCoverage(): SecurityCategory[] {
    return getCoveredCategories();
  }

  /** Most-recent scan report, or null if scan() has not been called. */
  getLastScan(): SecurityReport | null {
    return this.lastScan;
  }

  /** Per-rule timing from the most-recent scan. */
  getLastRuleTimings(): RuleTiming[] {
    return [...this.lastRuleTimings];
  }

  // ── Main entry point ──────────────────────────────────────────────────────

  /**
   * Run a full security scan with instrumentation.
   *
   * Emits scan-start → one (check-start, check-end) pair per registry entry →
   * one rule-timing event per rule file → scan-end.
   *
   * The per-check events are synthetic progress indicators; the actual scan
   * runs all rules in parallel inside `runSecurityScan`. The events exist so
   * dashboards and CLIs can display a "Check 34/55: SQL Injection Scan…"
   * progress readout that corresponds to real checks.
   */
  async scan(
    repoIdentifier: string,
    files: FileEntry[],
    config: AuditConfig = {}
  ): Promise<SecurityReport> {
    const totalChecks = CHECK_REGISTRY.length;
    const scanStart = Date.now();

    this.emit({
      type:            "scan-start",
      target:          repoIdentifier,
      filesTotal:      files.length,
      checksAvailable: totalChecks,
    });

    // Emit synthetic per-check progress events BEFORE the parallel scan
    // kicks off. This gives the UI a smooth 0→N progress bar even though
    // the rule engines themselves run concurrently.
    for (let i = 0; i < CHECK_REGISTRY.length; i++) {
      const check = CHECK_REGISTRY[i];
      this.emit({ type: "check-start", check, index: i + 1, total: totalChecks });
      this.emit({ type: "check-end",   check, index: i + 1, total: totalChecks });
    }

    // Run the actual scan (all rule files in parallel, per scanner.ts)
    const ruleTimingStart = Date.now();
    const report = await runSecurityScan(repoIdentifier, files, config);
    const ruleTimingTotal = Date.now() - ruleTimingStart;

    // Approximate per-rule timing by distributing total runtime over the
    // rule files (true per-rule timing would require instrumenting scanner.ts;
    // this gives a "fair-share" view without touching the rule engine).
    const byRule = getChecksByRuleFile();
    const ruleFiles = Object.keys(byRule);
    const timings: RuleTiming[] = ruleFiles.map((ruleFile) => ({
      ruleFile,
      checksInFile: byRule[ruleFile].length,
      durationMs: Math.round(
        ruleTimingTotal * (byRule[ruleFile].length / totalChecks)
      ),
    }));

    for (const timing of timings) {
      this.emit({ type: "rule-timing", timing });
    }

    this.lastScan         = report;
    this.lastRuleTimings  = timings;

    this.emit({
      type:          "scan-end",
      durationMs:    Date.now() - scanStart,
      findingsCount: report.findings.length,
    });

    return report;
  }
}

// ── Module-level singleton ────────────────────────────────────────────────────

/** Shared singleton used by API routes and the admin endpoint. */
export const guardian = new SecurityGuardian();

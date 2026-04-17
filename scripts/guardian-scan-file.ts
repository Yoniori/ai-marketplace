/**
 * ─── Guardian Scan File — Python Bridge CLI ─────────────────────────────────
 *
 * A thin wrapper that exposes the SecurityGuardian scanner to the Python
 * CrewAI tool (`agents/tools/guardian_tool.py`).
 *
 * Usage:
 *   npx tsx scripts/guardian-scan-file.ts <absolute-or-relative-path>
 *
 * Contract:
 *   - Reads the target file as UTF-8.
 *   - Runs the full rule pipeline with checkPhantomDeps:false (no network
 *     calls — the agent's synthetic filenames are not registry-resolvable).
 *   - Emits a JSON summary on stdout (always, even on non-zero exit).
 *   - Exits 1 when any CRITICAL_MALWARE or HIGH finding exists, 0 when clean.
 *   - Exits 2 on invocation errors (missing arg, unreadable file, crash).
 *
 * This file is consumed by Python subprocess — keep output deterministic.
 */

import * as fs from "fs";
import * as path from "path";
import { runSecurityAudit } from "../lib/security-auditor";

async function main(): Promise<void> {
  const arg = process.argv[2];
  if (!arg) {
    process.stdout.write(
      JSON.stringify({ error: "Usage: tsx scripts/guardian-scan-file.ts <filepath>" }),
    );
    process.exit(2);
  }

  const absPath = path.resolve(arg);
  if (!fs.existsSync(absPath)) {
    process.stdout.write(JSON.stringify({ error: `File not found: ${absPath}` }));
    process.exit(2);
  }

  let content: string;
  try {
    content = fs.readFileSync(absPath, "utf-8");
  } catch (err) {
    process.stdout.write(
      JSON.stringify({ error: `Cannot read file: ${(err as Error).message}` }),
    );
    process.exit(2);
    return;
  }

  const relative = path.basename(absPath);

  const report = await runSecurityAudit(
    `crew-agent:${relative}`,
    [{ path: relative, content }],
    { checkPhantomDeps: false },
  );

  // Compact summary the Python tool forwards to the agent. Severities here
  // mirror what the agent's task description references ("CRITICAL / HIGH").
  const gateBlocked =
    report.summary.critical > 0 || report.summary.high > 0;

  const out = {
    file: relative,
    overallRisk: report.overallRisk,
    gateBlocked,
    summary: {
      total:    report.summary.total,
      critical: report.summary.critical, // CRITICAL_MALWARE count
      high:     report.summary.high,
      medium:   report.summary.medium,
      low:      report.summary.low,
    },
    findings: report.findings.map((f) => ({
      id:             f.id,
      title:          f.title,
      severity:       f.severity,
      category:       f.category,
      line:           f.line ?? null,
      cwe:            f.cweId ?? null,
      confidence:     f.confidence,
      recommendation: f.recommendation,
      snippet:        f.snippet ?? null,
    })),
  };

  process.stdout.write(JSON.stringify(out, null, 2));
  process.exit(gateBlocked ? 1 : 0);
}

main().catch((err) => {
  process.stdout.write(
    JSON.stringify({ error: `Guardian CLI crashed: ${(err as Error)?.message ?? String(err)}` }),
  );
  process.exit(2);
});

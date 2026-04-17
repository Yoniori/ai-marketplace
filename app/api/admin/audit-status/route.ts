/**
 * ─── GET /api/admin/audit-status ────────────────────────────────────────────
 *
 * Read-only admin endpoint reporting live SecurityGuardian metadata:
 *   - total checks available (live count from registry)
 *   - categories covered
 *   - last scan summary (if any has been run)
 *   - list of all check descriptors
 *
 * Authorisation:
 *   - Requires an authenticated Supabase session
 *   - Session email must equal process.env.ADMIN_EMAIL
 *
 * This endpoint performs NO scanning — it only reads guardian state.
 * Scanning is initiated elsewhere (future admin trigger) and results are
 * cached in the singleton SecurityGuardian instance.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { guardian } from "@/lib/security-auditor/guardian";

export const dynamic = "force-dynamic";

export async function GET() {
  // ── 1. Auth gate ────────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return NextResponse.json(
      { error: "ADMIN_EMAIL env var not configured" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.email !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 2. Collect guardian state ───────────────────────────────────────────────
  const checksAvailable  = guardian.getCheckCount();
  const categoriesCovered = guardian.getCoverage();
  const checks            = guardian.listChecks();
  const lastScan          = guardian.getLastScan();
  const ruleTimings       = guardian.getLastRuleTimings();

  // ── 3. Build response ───────────────────────────────────────────────────────
  return NextResponse.json({
    engine: "SecurityGuardian v1.0",
    checksAvailable,
    categoriesCovered,
    // Marketing-safe rounded-down count for the UI ("scanned for 55+ patterns")
    displayCount: Math.floor(checksAvailable / 5) * 5,
    checks: checks.map((c) => ({
      id:          c.id,
      ruleFile:    c.ruleFile,
      category:    c.category,
      maxSeverity: c.maxSeverity,
      label:       c.label,
      cweId:       c.cweId ?? null,
    })),
    lastScan: lastScan
      ? {
          repoIdentifier:  lastScan.repoIdentifier,
          scanTimestamp:   lastScan.scanTimestamp,
          scanDurationMs:  lastScan.scanDurationMs,
          overallRisk:     lastScan.overallRisk,
          summary:         lastScan.summary,
          filesScanned:    lastScan.filesScanned,
          phantomDependencies: lastScan.phantomDependencies,
          ruleTimings,
        }
      : null,
  });
}

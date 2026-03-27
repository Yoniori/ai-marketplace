/**
 * GET /api/listings/[id]/check/latest
 *
 * Returns the most recent listing_checks row for a listing.
 * Used by the creator dashboard to hydrate on load and to poll
 * after triggering a check.
 *
 * Returns { check: null } if no check has been run yet.
 *
 * Guards:
 *   - Must be authenticated
 *   - Must own the listing
 *
 * Response 200:
 *   { check: ListingCheck | null }
 *
 *   When check.status = 'done', check.report contains the full CheckReport.
 *   When check.status = 'running' | 'queued', scores and report are null.
 *   When check.status = 'failed', check.error_message describes what went wrong.
 *
 * Error responses:
 *   401 — not authenticated
 *   403 — not the listing owner
 *   404 — listing not found
 */

import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // ── Auth ─────────────────────────────────────────────────────
  const userClient = await createClient();
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let adminClient: Awaited<ReturnType<typeof createAdminClient>>;
  try {
    adminClient = await createAdminClient();
  } catch (err) {
    console.error("[GET /check/latest] Admin client unavailable:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }

  // Cast for new columns / tables not yet in generated DB types.
  // TODO: remove after `npm run db:types` post-migration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminClient as any;

  // ── Verify listing ownership ──────────────────────────────────
  const { data: listing, error: listingError } = await db
    .from("listings")
    .select("creator_id")
    .eq("id", id)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Fetch latest check ────────────────────────────────────────
  // maybeSingle() returns null (not an error) when no rows match.
  const { data: check, error: checkError } = await db
    .from("listing_checks")
    .select(
      `
      id,
      status,
      outcome,
      triggered_at,
      completed_at,
      completeness_score,
      security_score,
      clarity_score,
      overall_score,
      report,
      files_analyzed,
      model_used,
      duration_ms,
      attempt_count,
      error_message
    `
    )
    .eq("listing_id", id)
    .order("triggered_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (checkError) {
    console.error("[GET /check/latest] Query error:", checkError.message);
    return NextResponse.json(
      { error: "Failed to fetch check" },
      { status: 500 }
    );
  }

  return NextResponse.json({ check: check ?? null });
}

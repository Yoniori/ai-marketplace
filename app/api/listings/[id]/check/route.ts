// Vercel: allow up to 60 s for the synchronous Claude call (~10–20 s typical).
// Without this, Hobby plan kills the function at 10 s.
export const maxDuration = 60;

/**
 * POST /api/listings/[id]/check
 *
 * Triggers an automated quality check for a listing.
 * Runs synchronously — the response is returned only after the Claude call
 * completes (~5–20s). The client should display a loading state.
 *
 * Why synchronous (not fire-and-forget):
 *   Next.js 14 serverless functions on Vercel are terminated when the
 *   response is sent. waitUntil() is Next.js 15+ only. Async background
 *   processing is safe only with an external queue (Phase 2).
 *
 * Guards:
 *   - Creator must own the listing
 *   - Listing must not already be published
 *   - No check already in progress (review_status = 'pending')
 *   - title and description must be non-empty
 *
 * Response 200:
 *   { check_id, outcome, overall_score, report }
 *
 * Error responses:
 *   401 — not authenticated
 *   403 — not the listing owner
 *   404 — listing not found
 *   400 — listing already published
 *   409 — check already in progress
 *   422 — missing required fields { error, missing: string[] }
 *   500 — check failed (Claude error or DB error)
 */

import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { runCheck } from "@/lib/listing-check/worker";
import { sendCheckFlaggedNotification } from "@/lib/resend/emails";
import type { ListingForCheck } from "@/lib/listing-check/types";

export async function POST(
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

  // ── Fetch listing ─────────────────────────────────────────────
  // Use admin client so we can read listings at any status (draft, etc.)
  // without being limited by the public-read-published RLS policy.
  let adminClient: Awaited<ReturnType<typeof createAdminClient>>;
  try {
    adminClient = await createAdminClient();
  } catch (err) {
    console.error("[POST /check] Admin client unavailable:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }

  // Cast to any for: (a) listing_checks table not yet in generated types,
  // (b) files_path / review_status columns not yet in generated types.
  // TODO: remove cast after running `npm run db:types` post-migration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminClient as any;

  const { data: listing, error: listingError } = await db
    .from("listings")
    .select(
      `
      id,
      creator_id,
      title,
      description,
      price_type,
      price_cents,
      files_path,
      status,
      review_status,
      categories ( name )
    `
    )
    .eq("id", id)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // ── Ownership guard ───────────────────────────────────────────
  if (listing.creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── State guards ──────────────────────────────────────────────
  if (listing.status === "published") {
    return NextResponse.json(
      { error: "Listing is already published" },
      { status: 400 }
    );
  }

  if (listing.review_status === "pending") {
    return NextResponse.json(
      { error: "A check is already in progress for this listing" },
      { status: 409 }
    );
  }

  // ── Validate minimum required fields ──────────────────────────
  const missing: string[] = [];
  if (!listing.title?.trim()) missing.push("title");
  if (!listing.description?.trim()) missing.push("description");

  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: "Missing required fields before running a check",
        missing,
      },
      { status: 422 }
    );
  }

  // ── Insert check row ──────────────────────────────────────────
  // Start as 'running' directly — we're synchronous, never queued.
  const { data: check, error: insertError } = await db
    .from("listing_checks")
    .insert({
      listing_id: id,
      triggered_by: user.id,
      status: "running",
      attempt_count: 1,
    })
    .select("id")
    .single();

  if (insertError || !check) {
    console.error(
      "[POST /check] Failed to insert listing_checks row:",
      insertError?.message
    );
    return NextResponse.json(
      { error: "Failed to start check" },
      { status: 500 }
    );
  }

  // ── Mark listing as pending ───────────────────────────────────
  await db
    .from("listings")
    .update({ review_status: "pending" })
    .eq("id", id);

  // ── Run check synchronously ───────────────────────────────────
  const listingForCheck: ListingForCheck = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price_type: listing.price_type,
    price_cents: listing.price_cents,
    files_path: listing.files_path ?? null,
    category_name: (listing.categories as { name: string } | null)?.name ?? null,
  };

  try {
    const report = await runCheck(check.id, listingForCheck, adminClient);

    // ── Update listing review_status ──────────────────────────
    await db
      .from("listings")
      .update({ review_status: report.outcome })
      .eq("id", id);

    // ── Notify admin on flagged outcome (best-effort) ─────────
    if (report.outcome === "flagged") {
      sendCheckFlaggedNotification({
        listingId: id,
        listingTitle: listing.title,
        checkId: check.id,
      }).catch(() => {
        // Email failure must not affect the response to the creator
      });
    }

    // ── Return the full check row ──────────────────────────────
    // Re-read from DB so the client gets the authoritative persisted state
    // (scores, files_analyzed, model_used, duration_ms, etc.) in one shot.
    // This lets the frontend set state directly from this response without
    // a second GET /check/latest round-trip that could race against a slow
    // DB write and return a stale "running" row.
    const { data: finalCheck } = await db
      .from("listing_checks")
      .select(
        `id, status, outcome, triggered_at, completed_at,
         completeness_score, security_score, clarity_score, overall_score,
         report, files_analyzed, model_used, duration_ms, error_message`
      )
      .eq("id", check.id)
      .single();

    // If the re-read somehow fails (should never happen), fall back to
    // constructing the shape from the in-memory report so the client still
    // gets a usable response.
    const responseCheck = finalCheck ?? {
      id: check.id,
      status: "done",
      outcome: report.outcome,
      triggered_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      completeness_score: report.completeness_score,
      security_score: report.security_score,
      clarity_score: report.clarity_score,
      overall_score: report.overall_score,
      report,
      files_analyzed: null,
      model_used: "claude-3-5-sonnet-20241022",
      duration_ms: null,
      error_message: null,
    };

    return NextResponse.json({ check: responseCheck });
  } catch (err) {
    // Worker already marked the check row as 'failed'.
    // Reset review_status so the creator can retry.
    await db.from("listings").update({ review_status: null }).eq("id", id);

    console.error(
      "[POST /check] Check failed:",
      err instanceof Error ? err.message : err
    );

    return NextResponse.json(
      { error: "Check failed. Please try again." },
      { status: 500 }
    );
  }
}

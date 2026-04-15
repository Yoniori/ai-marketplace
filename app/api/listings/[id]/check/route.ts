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
import { decryptToken } from "@/lib/github/crypto";
import type { EncryptedToken } from "@/lib/github/crypto";
import type { ListingForCheck } from "@/lib/listing-check/types";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // ── CHECKPOINT 1: env variables ──────────────────────────────
  // Logs true/false for presence, and first 22 chars of each key so you can
  // verify the correct key was pasted (all Supabase JWTs start with
  // "eyJhbGciOiJIUzI1NiIs" — if you see something different, the wrong key
  // was used). Safe to log: the JWT header is always the same string.
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const oaiKey  = process.env.OPENAI_API_KEY ?? "";
  console.log("[POST /check] CHECKPOINT 1 — env", {
    NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "MISSING",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey  ? anonKey.slice(0, 22)  + "…" : "MISSING",
    SUPABASE_SERVICE_ROLE_KEY:     svcKey   ? svcKey.slice(0, 22)   + "…" : "MISSING",
    OPENAI_API_KEY:                oaiKey   ? oaiKey.slice(0, 10)   + "…" : "MISSING",
    svcKey_length:                 svcKey.length,
    NODE_ENV:                      process.env.NODE_ENV,
  });

  if (!svcKey) {
    console.error("[POST /check] FATAL: SUPABASE_SERVICE_ROLE_KEY is empty. Add it in Vercel → Settings → Environment Variables and redeploy.");
    return NextResponse.json(
      { error: "Server misconfiguration: missing service key. Contact support." },
      { status: 500 }
    );
  }
  if (!oaiKey) {
    console.error("[POST /check] FATAL: OPENAI_API_KEY is empty. Add it in Vercel → Settings → Environment Variables and redeploy.");
    return NextResponse.json(
      { error: "Server misconfiguration: missing AI key. Contact support." },
      { status: 500 }
    );
  }

  // ── CHECKPOINT 2: auth ────────────────────────────────────────
  console.log("[POST /check] CHECKPOINT 2 — calling createClient for auth…");
  let userClient: Awaited<ReturnType<typeof createClient>>;
  try {
    userClient = await createClient();
  } catch (err) {
    console.error("[POST /check] CHECKPOINT 2 FAILED — createClient threw:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Auth service unavailable." }, { status: 500 });
  }

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  console.log("[POST /check] CHECKPOINT 2 — auth result:", { userId: user?.id ?? null, authError: authError?.message ?? null });

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── CHECKPOINT 3: admin client ────────────────────────────────
  console.log("[POST /check] CHECKPOINT 3 — calling createAdminClient…");
  let adminClient: Awaited<ReturnType<typeof createAdminClient>>;
  try {
    adminClient = await createAdminClient();
    console.log("[POST /check] CHECKPOINT 3 — createAdminClient OK");
  } catch (err) {
    console.error("[POST /check] CHECKPOINT 3 FAILED — createAdminClient threw:", err instanceof Error ? err.message : err);
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

  // ── CHECKPOINT 4: fetch listing ──────────────────────────────
  console.log("[POST /check] CHECKPOINT 4 — querying listing id:", id);
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
    console.error("[POST /check] CHECKPOINT 4 FAILED — listing query:", listingError?.message ?? "no row returned");
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  console.log("[POST /check] CHECKPOINT 4 — listing found, status:", listing.status, "| review_status:", listing.review_status);

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
    // Auto-unstick: if the latest "running" check is older than 90s it has
    // almost certainly crashed without cleaning up. Reset it so the creator
    // can retry instead of being permanently blocked.
    const STUCK_MS = 5 * 60 * 1000; // 5 minutes — matches GET /check/latest zombie threshold
    const { data: stuckCheck } = await db
      .from("listing_checks")
      .select("id, triggered_at, status")
      .eq("listing_id", id)
      .in("status", ["running", "queued"])
      .order("triggered_at", { ascending: false })
      .limit(1)
      .single();

    const isStuck =
      stuckCheck &&
      Date.now() - new Date(stuckCheck.triggered_at).getTime() > STUCK_MS;

    if (!isStuck) {
      return NextResponse.json(
        { error: "A check is already in progress for this listing" },
        { status: 409 }
      );
    }

    // Reset the stuck check row and clear the listing's pending flag.
    console.log(
      "[POST /check] Auto-resetting stuck check:",
      stuckCheck.id,
      "age:",
      Math.round((Date.now() - new Date(stuckCheck.triggered_at).getTime()) / 1000) + "s"
    );
    await db
      .from("listing_checks")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: "Check timed out and was automatically reset.",
      })
      .eq("id", stuckCheck.id);
    await db.from("listings").update({ review_status: null }).eq("id", id);
    // Fall through to start a fresh check.
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

  // ── Look up GitHub repo (for imported listings without a ZIP) ──
  let github_repo_full_name: string | null = null;
  let github_access_token:   string | null = null;

  if (!listing.files_path) {
    const { data: importedRepo } = await db
      .from("github_imported_repos")
      .select("github_repo_full_name")
      .eq("listing_id", id)
      .maybeSingle();

    if (importedRepo?.github_repo_full_name) {
      github_repo_full_name = importedRepo.github_repo_full_name;

      const { data: conn } = await db
        .from("github_connections")
        .select("encrypted_access_token, token_iv, token_auth_tag")
        .eq("user_id", user.id)
        .maybeSingle();

      if (conn) {
        github_access_token = decryptToken({
          ciphertext: conn.encrypted_access_token,
          iv:         conn.token_iv,
          authTag:    conn.token_auth_tag,
        } as EncryptedToken);
      }
    }
  }

  // ── Run check synchronously ───────────────────────────────────
  const listingForCheck: ListingForCheck = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price_type: listing.price_type,
    price_cents: listing.price_cents,
    files_path: listing.files_path ?? null,
    category_name: (listing.categories as { name: string } | null)?.name ?? null,
    github_repo_full_name,
    github_access_token,
  };

  // ── CHECKPOINT 5: worker ──────────────────────────────────────
  console.log("[POST /check] CHECKPOINT 5 — starting runCheck. checkId:", check.id);
  try {
    const report = await runCheck(check.id, listingForCheck, adminClient);
    console.log("[POST /check] CHECKPOINT 5 — runCheck completed. outcome:", report.outcome);

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

    // ── Debug: log what we're sending back to the frontend ───────
    console.log(
      "[POST /check] finalCheck from DB:",
      finalCheck
        ? JSON.stringify({
            id:               finalCheck.id,
            status:           finalCheck.status,
            outcome:          finalCheck.outcome,
            overall_score:    finalCheck.overall_score,
            error_message:    finalCheck.error_message,
            report_is_object: typeof finalCheck.report === "object" && finalCheck.report !== null,
          })
        : "null — falling back to in-memory report"
    );

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
      model_used: "gpt-4o-mini",
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

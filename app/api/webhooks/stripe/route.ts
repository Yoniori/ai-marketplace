// Vercel: allow up to 60 s for webhook processing.
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe, calculateFees } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

/**
 * POST /api/webhooks/stripe
 *
 * Handles Stripe webhook events.
 * Signature verification is enforced on every request — unsigned or
 * tampered payloads are rejected with 400 before any processing.
 *
 * Events handled:
 *   - checkout.session.completed → create/complete purchase record, grant access
 *   - account.updated            → sync creator Stripe Connect onboarding status
 */
export async function POST(request: Request) {
  // ── Raw body required for signature verification ────────────────────────
  const body        = await request.text();
  const headersList = await headers();
  const signature   = headersList.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error(
      "[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set. " +
        "Add it in Vercel → Settings → Environment Variables."
    );
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // ── Verify signature ─────────────────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(
      "[stripe-webhook] Signature verification failed:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  // ── Route events ─────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      default:
        // Silently ignore unhandled event types
        break;
    }
  } catch (err) {
    // Log but return 200 so Stripe doesn't retry an event that will always fail.
    // For transient errors, Stripe's retry logic is a last resort — we prefer
    // idempotent handlers that can safely re-run.
    console.error(
      `[stripe-webhook] Handler failed for event ${event.type}:`,
      err instanceof Error ? err.message : err
    );
  }

  return NextResponse.json({ received: true });
}

// ── Event Handlers ────────────────────────────────────────────────────────────

/**
 * checkout.session.completed
 * - Upsert the purchase record with status=completed and access_granted=true
 * - Increment the listing's purchase_count
 *
 * Idempotent: safe to run multiple times for the same session_id.
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const {
    listing_id,
    buyer_id,
    platform_fee_cents: rawFee,
    creator_payout_cents: rawPayout,
  } = session.metadata ?? {};

  if (!listing_id || !buyer_id) {
    console.error("[stripe-webhook] checkout.session.completed missing metadata:", session.id);
    return;
  }

  const amountCents = session.amount_total ?? 0;

  // Use metadata fees if present, otherwise re-calculate
  const platformFeeCents   = rawFee   ? parseInt(rawFee,   10) : calculateFees(amountCents).platformFeeCents;
  const creatorPayoutCents = rawPayout ? parseInt(rawPayout, 10) : calculateFees(amountCents).creatorPayoutCents;

  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  // Idempotency check: if this session is already completed, skip the
  // purchase_count increment. Stripe may retry a webhook multiple times
  // (network error, our 5xx, etc.). The upsert below is safe to re-run,
  // but the RPC is not — it would double-count the purchase.
  const { data: alreadyCompleted } = await db
    .from("purchases")
    .select("id")
    .eq("stripe_session_id", session.id)
    .eq("status", "completed")
    .maybeSingle();

  // Upsert purchase — creates the row if checkout route's insert failed
  const { error: upsertError } = await db
    .from("purchases")
    .upsert(
      {
        buyer_id,
        listing_id,
        stripe_session_id:    session.id,
        stripe_payment_intent: typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
        amount_cents:         amountCents,
        platform_fee_cents:   platformFeeCents,
        creator_payout_cents: creatorPayoutCents,
        currency:             session.currency ?? "usd",
        status:               "completed",
        access_granted:       true,
      },
      {
        onConflict:       "stripe_session_id",
        ignoreDuplicates: false,
      }
    );

  if (upsertError) {
    console.error("[stripe-webhook] Purchase upsert failed:", upsertError.message);
    throw new Error(`Purchase upsert failed: ${upsertError.message}`);
  }

  // Only increment purchase_count on the FIRST completion of this session.
  // Re-delivered webhooks must not inflate the count.
  if (!alreadyCompleted) {
    const { error: rpcError } = await db.rpc("increment_purchase_count", {
      p_listing_id: listing_id,
    });
    if (rpcError) {
      // Non-fatal: denormalized count is not critical
      console.warn("[stripe-webhook] increment_purchase_count failed:", rpcError.message);
    }
  } else {
    console.log(`[stripe-webhook] Duplicate delivery for session ${session.id} — skipping count increment.`);
  }

  console.log(
    `[stripe-webhook] Purchase completed — listing: ${listing_id}, buyer: ${buyer_id}, session: ${session.id}`
  );
}

/**
 * account.updated
 * Sync the creator's Stripe Connect onboarding status.
 * Sets stripe_onboarded=true when details_submitted and charges_enabled.
 */
async function handleAccountUpdated(account: Stripe.Account) {
  if (!account.id) return;

  const onboarded = account.details_submitted === true && account.charges_enabled === true;

  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("profiles")
    .update({ stripe_onboarded: onboarded })
    .eq("stripe_account_id", account.id);

  if (error) {
    console.error("[stripe-webhook] account.updated sync failed:", error.message);
    throw new Error(`account.updated sync failed: ${error.message}`);
  }

  console.log(
    `[stripe-webhook] Stripe account synced — account: ${account.id}, onboarded: ${onboarded}`
  );
}

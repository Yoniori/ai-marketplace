import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { stripe, calculateFees } from "@/lib/stripe/client";

/**
 * POST /api/payments/checkout
 *
 * Creates a Stripe Checkout Session for a listing purchase.
 * Uses Stripe Connect destination charges so the creator receives
 * their payout directly and the platform retains its fee.
 *
 * Body: { listingId: string }
 *
 * Response: { checkoutUrl: string }
 *
 * Guards:
 *   - Must be authenticated
 *   - Cannot purchase own listing
 *   - Listing must be published and paid
 *   - Creator must have completed Stripe Connect onboarding
 *   - Buyer cannot have an existing completed purchase (idempotency)
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : null;
  if (!listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Fetch listing with creator's Stripe account
  const { data: listing, error: listingError } = await db
    .from("listings")
    .select(`
      id, title, slug, price_cents, price_type, currency, status, thumbnail_url,
      creator_id,
      creator:profiles!creator_id ( stripe_account_id, stripe_onboarded, display_name )
    `)
    .eq("id", listingId)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.status !== "published") {
    return NextResponse.json({ error: "Listing is not available for purchase" }, { status: 400 });
  }

  if (listing.price_type !== "paid") {
    return NextResponse.json({ error: "This listing is not a paid product" }, { status: 400 });
  }

  // Prevent self-purchase
  if (listing.creator_id === user.id) {
    return NextResponse.json({ error: "You cannot purchase your own listing" }, { status: 400 });
  }

  // Verify creator has connected Stripe
  const creator = listing.creator as {
    stripe_account_id: string | null;
    stripe_onboarded: boolean;
    display_name: string | null;
  };
  if (!creator?.stripe_account_id || !creator.stripe_onboarded) {
    return NextResponse.json(
      { error: "This creator has not completed payment onboarding yet." },
      { status: 400 }
    );
  }

  // Check for existing completed purchase (idempotency)
  const { data: existing } = await db
    .from("purchases")
    .select("id")
    .eq("buyer_id", user.id)
    .eq("listing_id", listingId)
    .eq("status", "completed")
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "You have already purchased this listing." },
      { status: 409 }
    );
  }

  // Validate price before touching Stripe — Stripe rejects amounts outside
  // this range anyway, but failing early gives a cleaner error message.
  // 50 cents minimum (Stripe's USD minimum), $999,999.99 maximum.
  if (!listing.price_cents || listing.price_cents < 50 || listing.price_cents > 99_999_999) {
    return NextResponse.json({ error: "Listing has an invalid price." }, { status: 400 });
  }

  // Calculate fees
  const { platformFeeCents, creatorPayoutCents } = calculateFees(listing.price_cents);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Create Stripe Checkout Session with Connect transfer
  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    session = await stripe.checkout.sessions.create({
      mode:                 "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency:     listing.currency ?? "usd",
            unit_amount:  listing.price_cents,
            product_data: {
              name:   listing.title,
              images: listing.thumbnail_url ? [listing.thumbnail_url] : [],
            },
          },
          quantity: 1,
        },
      ],
      // Stripe Connect: transfer to the creator's account minus platform fee
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: creator.stripe_account_id,
        },
      },
      success_url: `${appUrl}/listing/${listing.slug}?purchase=success`,
      cancel_url:  `${appUrl}/listing/${listing.slug}?purchase=cancelled`,
      // Pass metadata so the webhook can look up the purchase
      metadata: {
        listing_id:            listingId,
        buyer_id:              user.id,
        platform_fee_cents:    String(platformFeeCents),
        creator_payout_cents:  String(creatorPayoutCents),
      },
    });
  } catch (err) {
    console.error("[POST /api/payments/checkout] Stripe error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }

  // Create a pending purchase record so we have a record before the webhook fires
  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("purchases")
    .insert({
      buyer_id:             user.id,
      listing_id:           listingId,
      stripe_session_id:    session.id,
      amount_cents:         listing.price_cents,
      platform_fee_cents:   platformFeeCents,
      creator_payout_cents: creatorPayoutCents,
      currency:             listing.currency ?? "usd",
      status:               "pending",
      access_granted:       false,
    })
    .select("id")
    .single();
  // Intentionally non-fatal — the webhook will create the record if this fails

  return NextResponse.json({ checkoutUrl: session.url });
}

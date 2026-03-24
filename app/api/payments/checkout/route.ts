import { NextResponse } from "next/server";

/**
 * POST /api/payments/checkout
 * Creates a Stripe Checkout Session for a listing purchase.
 * Full implementation in Step 8 (Purchase Flow).
 */
export async function POST() {
  // TODO (Step 8): Create Stripe Checkout session with Connect transfer
  return NextResponse.json({ message: "Coming in Step 8" }, { status: 501 });
}

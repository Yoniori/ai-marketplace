import { NextResponse } from "next/server";

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events:
 * - checkout.session.completed → grant purchase access
 * - account.updated → sync creator Stripe Connect status
 *
 * Full implementation in Step 8 (Purchase Flow).
 */
export async function POST() {
  // TODO (Step 8): Verify Stripe signature + route events to handlers
  return NextResponse.json({ received: true });
}

import Stripe from "stripe";

/**
 * Server-side Stripe client.
 * Use only in API routes, Server Actions, and webhook handlers.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
  typescript: true,
});

/**
 * Platform fee percentage taken from each transaction.
 * Configured via STRIPE_PLATFORM_FEE_PERCENT env var (default: 10).
 */
export const PLATFORM_FEE_PERCENT =
  Number(process.env.STRIPE_PLATFORM_FEE_PERCENT) || 10;

/**
 * Calculate the platform fee and creator payout for a given amount.
 * @param amountCents - Total amount in cents
 * @returns { platformFeeCents, creatorPayoutCents }
 */
export function calculateFees(amountCents: number) {
  const platformFeeCents = Math.round(
    (amountCents * PLATFORM_FEE_PERCENT) / 100
  );
  const creatorPayoutCents = amountCents - platformFeeCents;
  return { platformFeeCents, creatorPayoutCents };
}

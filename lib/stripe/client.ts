import Stripe from "stripe";

/**
 * Validates a required server-side env var at module load time.
 * Throws a clear, actionable error instead of a cryptic undefined crash.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `[Vibe Code Market] Missing required environment variable: ${name}\n` +
        `→ Add it in Vercel → Settings → Environment Variables (or .env.local locally).`
    );
  }
  return value.trim();
}

/**
 * Server-side Stripe client.
 * Use only in API routes, Server Actions, and webhook handlers.
 *
 * Throws at module load time if STRIPE_SECRET_KEY is missing so the error
 * surfaces immediately (build/startup) rather than at the first payment call.
 */
export const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
  apiVersion: "2024-04-10",
  typescript: true,
});

/**
 * Platform fee percentage taken from each transaction.
 * Defaults to 10 if the env var is missing or non-numeric.
 *
 * NOTE: If STRIPE_PLATFORM_FEE_PERCENT is not set in production, the
 * platform will silently charge the default 10%. Set it explicitly to
 * avoid unexpected fee calculations.
 */
export const PLATFORM_FEE_PERCENT = (() => {
  const raw = process.env.STRIPE_PLATFORM_FEE_PERCENT;
  if (!raw) return 10;
  const parsed = Number(raw);
  if (isNaN(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(
      `[Vibe Code Market] STRIPE_PLATFORM_FEE_PERCENT must be a number between 0 and 100.\n` +
        `→ Got: "${raw}"`
    );
  }
  return parsed;
})();

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

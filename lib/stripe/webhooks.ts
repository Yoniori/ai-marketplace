import type Stripe from "stripe";

/**
 * Placeholder webhook event handlers.
 * Each function will be implemented in Step 8 (Purchase Flow).
 */

/**
 * Handles a successful Stripe Checkout session.
 * Creates the purchase record and grants access to the buyer.
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  // TODO (Step 8): Implement purchase record creation and access grant
  console.log("[Stripe] checkout.session.completed", session.id);
}

/**
 * Handles Stripe Connect account updates.
 * Updates the creator's stripe_onboarded status.
 */
export async function handleAccountUpdated(account: Stripe.Account) {
  // TODO (Step 8): Update profiles.stripe_onboarded when Connect onboarding completes
  console.log("[Stripe] account.updated", account.id);
}

/**
 * Handles payment intent events for logging/monitoring.
 */
export async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  // TODO (Step 8): Optional — additional logging or notifications
  console.log("[Stripe] payment_intent.succeeded", paymentIntent.id);
}

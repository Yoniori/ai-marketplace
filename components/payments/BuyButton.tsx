"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface BuyButtonProps {
  listingId: string;
  priceType: "free" | "paid" | "contact";
  priceLabel: string;
  /** Pass the creator's contact URL or email if priceType === "contact" */
  contactUrl?: string;
  isAuthenticated: boolean;
}

/**
 * BuyButton — client component that initiates a Stripe checkout.
 *
 * For paid listings:
 *   POST /api/payments/checkout → redirect to Stripe Checkout URL.
 *
 * For free listings:
 *   TODO (Step 8): grant free access without payment.
 *
 * For contact listings:
 *   Link to creator's contact URL or mailto.
 */
export function BuyButton({
  listingId,
  priceType,
  priceLabel,
  isAuthenticated,
}: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handlePurchase() {
    if (!isAuthenticated) {
      window.location.href = `/login?redirectTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ listingId }),
      });

      const data = await res.json() as { checkoutUrl?: string; error?: string };

      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? "Failed to start checkout. Please try again.");
        return;
      }

      // Redirect to Stripe-hosted Checkout page
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (priceType === "contact") {
    return (
      <a
        href="/browse"
        className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Contact creator
      </a>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handlePurchase}
        disabled={loading}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {priceType === "free"
          ? "Get for free"
          : `Buy — ${priceLabel}`}
      </button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

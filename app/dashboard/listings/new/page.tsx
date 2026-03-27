"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createListing } from "@/app/actions/listing";

export default function NewListingPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [priceType, setPriceType] = useState<"free" | "paid" | "contact">("free");

  const INPUT =
    "w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/40 disabled:opacity-40 transition-colors";

  const LABEL =
    "font-mono text-[10px] uppercase tracking-[0.16em] text-white/35";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createListing(null, formData);
      if (result && !result.success) {
        setError(result.error);
      }
      // On success, createListing redirects via Next.js redirect() —
      // no explicit navigation needed here.
    });
  }

  return (
    <div className="max-w-xl space-y-8">

      {/* Back */}
      <div>
        <Link
          href="/dashboard/listings"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-white/30 transition-colors hover:text-white/60"
        >
          <ArrowLeft className="h-3 w-3" />
          All listings
        </Link>
      </div>

      {/* Header */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25 mb-2">
          Dashboard
        </p>
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-white">
          New listing
        </h1>
        <p className="mt-1.5 font-mono text-xs text-white/30">
          Create a draft — run the AI quality check before publishing.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="title" className={LABEL}>
            Title <span className="text-white/20">(required)</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={120}
            placeholder="My AI-powered thing"
            disabled={isPending}
            className={INPUT}
          />
          <p className="font-mono text-[10px] text-white/20">
            120 characters max. Keep it clear and specific.
          </p>
        </div>

        {/* Tagline */}
        <div className="space-y-1.5">
          <label htmlFor="tagline" className={LABEL}>
            Tagline
          </label>
          <input
            id="tagline"
            name="tagline"
            type="text"
            maxLength={200}
            placeholder="One sentence that sells it"
            disabled={isPending}
            className={INPUT}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className={LABEL}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            maxLength={5000}
            placeholder="What does it do? Who is it for? What problem does it solve?"
            disabled={isPending}
            className={`${INPUT} resize-none`}
          />
          <p className="font-mono text-[10px] text-white/20">
            Markdown is supported when published.
          </p>
        </div>

        {/* Price type */}
        <div className="space-y-2">
          <p className={LABEL}>Pricing</p>
          <div className="flex gap-2">
            {(["free", "paid", "contact"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPriceType(type)}
                className={`rounded-md border px-3 py-1.5 font-mono text-xs capitalize transition-colors ${
                  priceType === type
                    ? "border-primary/40 bg-primary/[0.1] text-primary"
                    : "border-white/[0.08] text-white/40 hover:border-white/[0.16] hover:text-white/70"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <input type="hidden" name="price_type" value={priceType} />
        </div>

        {/* Price amount — only when paid */}
        {priceType === "paid" && (
          <div className="space-y-1.5">
            <label htmlFor="price_cents" className={LABEL}>
              Price (USD)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-white/30">
                $
              </span>
              <input
                id="price_cents"
                name="price_cents"
                type="number"
                min="1"
                max="9999"
                step="0.01"
                defaultValue="9.00"
                disabled={isPending}
                className={`${INPUT} pl-7`}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-md border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Creating…" : "Create draft"}
          </button>
          <Link
            href="/dashboard/listings"
            className="text-sm text-white/30 transition-colors hover:text-white/60"
          >
            Cancel
          </Link>
        </div>

      </form>
    </div>
  );
}

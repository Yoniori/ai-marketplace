import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await (supabase as any)
    .from("listings")
    .select("title, tagline")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!data) return { title: "Listing not found" };
  return {
    title: `${data.title} — Vibe Code Market`,
    description: data.tagline,
  };
}

export default async function PublicListingPage({ params }: Props) {
  const supabase = await createClient();

  const { data: listing } = await (supabase as any)
    .from("listings")
    .select(
      "id, title, slug, tagline, description, price_type, price_cents, currency, thumbnail_url, creator_id, demo_url, review_count, avg_rating, purchase_count"
    )
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!listing) notFound();

  // Fetch creator profile
  const { data: creator } = await (supabase as any)
    .from("profiles")
    .select("display_name, username, avatar_url")
    .eq("id", listing.creator_id)
    .single();

  // Get current viewer
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Fire-and-forget view tracking ─────────────────────────────────────────
  // We intentionally do NOT await this — tracking must never block page render.
  void (supabase as any)
    .from("listing_views")
    .insert({ listing_id: listing.id, viewer_id: user?.id ?? null });

  const displayName = creator?.display_name ?? `@${creator?.username ?? "unknown"}`;
  const priceLabel = formatPrice(listing.price_cents, listing.currency);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold">
            <span className="font-mono text-xs font-bold text-primary select-none leading-none">▸</span>
            <span>Vibe Code Market</span>
          </Link>
          <Link
            href="/browse"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse products
          </Link>
        </div>
      </header>

      <main className="container py-12 md:py-20">
        <div className="max-w-3xl">
          {/* Title + tagline */}
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {listing.title}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">{listing.tagline}</p>

          {/* Meta row */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {creator && (
              <span>
                By{" "}
                <Link
                  href={`/profile/${creator.username}`}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  {displayName}
                </Link>
              </span>
            )}
            {listing.review_count > 0 && (
              <span>
                ★ {listing.avg_rating} ({listing.review_count} reviews)
              </span>
            )}
            {listing.purchase_count > 0 && (
              <span>{listing.purchase_count} purchases</span>
            )}
          </div>

          {/* Divider */}
          <div className="mt-8 border-t border-border" />

          {/* Description */}
          <div className="mt-8 prose prose-sm prose-invert max-w-none">
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {listing.description}
            </p>
          </div>

          {/* CTA */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-6 sm:min-w-[280px]">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Price
                </p>
                <p className="mt-0.5 text-xl font-bold text-foreground">
                  {listing.price_type === "contact" ? "Contact" : priceLabel}
                </p>
              </div>
              {listing.demo_url && (
                <a
                  href={listing.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Live demo
                </a>
              )}
            </div>

            <button
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              disabled
            >
              {listing.price_type === "free"
                ? "Get for free"
                : listing.price_type === "contact"
                ? "Contact creator"
                : `Buy — ${priceLabel}`}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

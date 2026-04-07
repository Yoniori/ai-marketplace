/**
 * Public Listing Detail Page — /listing/[slug]
 *
 * Two-column layout (desktop): left = gallery + description + reviews,
 * right (sticky) = buy CTA + creator card + quality score card.
 * Full-width below: similar products grid.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, getInitials, formatDate } from "@/lib/utils";
import { ListingCard } from "@/components/listing/ListingCard";
import { QualityBadge } from "@/components/listing/QualityBadge";
import { Star } from "lucide-react";
import type { Metadata } from "next";

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
  params: { slug: string };
}

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  reviewer: { display_name: string | null; username: string | null } | null;
};

type SimilarListing = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  price_type: "free" | "paid" | "contact";
  price_cents: number;
  currency: string;
  thumbnail_url: string | null;
  avg_rating: number | null;
  review_count: number | null;
  purchase_count: number | null;
};

// ── Metadata ─────────────────────────────────────────────────────────────────

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

// ── Card wrapper ──────────────────────────────────────────────────────────────

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border ${className}`}
      style={{
        background: "rgba(25,25,28,0.80)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(72,71,74,0.50)",
      }}
    >
      {children}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicListingPage({ params }: Props) {
  const supabase = await createClient();

  // ── Listing ──────────────────────────────────────────────────────────────
  const { data: listing } = await (supabase as any)
    .from("listings")
    .select(
      "id, title, slug, tagline, description, price_type, price_cents, currency, thumbnail_url, gallery_urls, creator_id, demo_url, review_count, avg_rating, purchase_count, review_status, published_at, category_id"
    )
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!listing) notFound();

  // ── Creator profile ───────────────────────────────────────────────────────
  const { data: creator } = await (supabase as any)
    .from("profiles")
    .select("display_name, username, avatar_url, bio, role")
    .eq("id", listing.creator_id)
    .single();

  // ── Latest passing quality check ──────────────────────────────────────────
  const { data: qualityCheck } = await (supabase as any)
    .from("listing_checks")
    .select("overall_score, security_score, completeness_score, clarity_score, outcome")
    .eq("listing_id", listing.id)
    .eq("status", "done")
    .eq("outcome", "ready")
    .order("triggered_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // ── Recent reviews (top 3) ────────────────────────────────────────────────
  const { data: reviewsData } = await (supabase as any)
    .from("reviews")
    .select("id, rating, title, body, created_at, reviewer:profiles!reviewer_id(display_name, username)")
    .eq("listing_id", listing.id)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(3);

  const reviews: Review[] = reviewsData ?? [];

  // ── Similar listings ──────────────────────────────────────────────────────
  let similarQuery = (supabase as any)
    .from("listings")
    .select("id, slug, title, tagline, price_type, price_cents, currency, thumbnail_url, avg_rating, review_count, purchase_count")
    .eq("status", "published")
    .neq("id", listing.id)
    .limit(3);

  if (listing.category_id) {
    similarQuery = similarQuery.eq("category_id", listing.category_id);
  }

  const { data: similarData } = await similarQuery;
  const similarListings: SimilarListing[] = similarData ?? [];

  // ── Current viewer (for view tracking) ────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Fire-and-forget view tracking ─────────────────────────────────────────
  // We intentionally do NOT await this — tracking must never block page render.
  void (supabase as any)
    .from("listing_views")
    .insert({ listing_id: listing.id, viewer_id: user?.id ?? null });

  // ── Derived values ────────────────────────────────────────────────────────
  const displayName = creator?.display_name ?? `@${creator?.username ?? "unknown"}`;
  const priceLabel = formatPrice(listing.price_cents, listing.currency);
  const galleryImages: string[] = [
    ...(listing.thumbnail_url ? [listing.thumbnail_url] : []),
    ...(Array.isArray(listing.gallery_urls) ? listing.gallery_urls : []),
  ].filter(Boolean);

  const isNew = listing.published_at
    ? Date.now() - new Date(listing.published_at).getTime() < 7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="min-h-screen" style={{ background: "#0e0e10" }}>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          background: "rgba(14,14,16,0.90)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderColor: "rgba(72,71,74,0.40)",
        }}
      >
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-white/90">
            <span className="font-mono text-xs font-bold text-cyan-400 select-none leading-none">▸</span>
            <span>Vibe Code Market</span>
          </Link>
          <Link
            href="/browse"
            className="text-sm font-mono text-white/40 hover:text-white/80 transition-colors"
          >
            Browse products
          </Link>
        </div>
      </header>

      <main className="container py-10 md:py-14">

        {/* ── Two-column grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:gap-10 lg:items-start">

          {/* ══════════════════════════════════ LEFT COLUMN ══════════════════ */}
          <div className="flex flex-col gap-8 min-w-0">

            {/* ── Gallery ─────────────────────────────────────────────────── */}
            {galleryImages.length > 0 && (
              <div>
                {galleryImages.length === 1 ? (
                  <div
                    className="w-full overflow-hidden rounded-xl"
                    style={{ aspectRatio: "16/9", maxHeight: 400 }}
                  >
                    <img
                      src={galleryImages[0]}
                      alt={listing.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                    {galleryImages.map((url: string, i: number) => (
                      <div
                        key={i}
                        className="shrink-0 overflow-hidden rounded-xl"
                        style={{ width: 280, aspectRatio: "16/9" }}
                      >
                        <img
                          src={url}
                          alt={`${listing.title} screenshot ${i + 1}`}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          style={{ maxHeight: 320 }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Title + meta ─────────────────────────────────────────────── */}
            <div>
              <div className="flex flex-wrap items-start gap-3 mb-2">
                <h1 className="font-headline text-2xl font-bold leading-tight text-white md:text-3xl">
                  {listing.title}
                </h1>
                {isNew && (
                  <span
                    className="mt-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold"
                    style={{ color: "#bf81ff", border: "1px solid rgba(191,129,255,0.25)", background: "rgba(191,129,255,0.08)" }}
                  >
                    ✨ New
                  </span>
                )}
                {listing.review_status === "ready" && (
                  <span
                    className="mt-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold"
                    style={{ color: "#00e6e6", border: "1px solid rgba(0,230,230,0.20)", background: "rgba(0,230,230,0.06)" }}
                  >
                    ✓ Checked
                  </span>
                )}
              </div>
              {listing.tagline && (
                <p className="text-base leading-relaxed text-white/55">{listing.tagline}</p>
              )}

              {/* Meta row */}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                {creator && (
                  <span className="font-mono text-[11px] text-white/40">
                    by{" "}
                    <Link
                      href={`/profile/${creator.username}`}
                      className="text-white/65 hover:text-cyan-400 transition-colors"
                    >
                      {displayName}
                    </Link>
                  </span>
                )}
                {listing.review_count > 0 && (
                  <span className="flex items-center gap-1 font-mono text-[11px] text-white/40">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {Number(listing.avg_rating).toFixed(1)}
                    <span className="text-white/25">({listing.review_count} reviews)</span>
                  </span>
                )}
                {listing.purchase_count > 0 && (
                  <span className="font-mono text-[11px] text-white/30">
                    {listing.purchase_count} purchases
                  </span>
                )}
              </div>
            </div>

            {/* ── Description ─────────────────────────────────────────────── */}
            <GlassCard className="p-6">
              <h2 className="font-mono text-[11px] uppercase tracking-widest text-white/40 mb-4">
                About this product
              </h2>
              <div className="text-sm leading-relaxed text-white/65 whitespace-pre-line">
                {listing.description}
              </div>
            </GlassCard>

            {/* ── Reviews section ──────────────────────────────────────────── */}
            <div id="reviews">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline text-lg font-semibold text-white/85">
                  Reviews
                  {listing.review_count > 0 && (
                    <span className="ml-2 font-mono text-sm font-normal text-white/35">
                      ({listing.review_count})
                    </span>
                  )}
                </h2>
                {listing.review_count > 0 && (
                  <span className="flex items-center gap-1 font-mono text-[11px] text-yellow-400/80">
                    <Star className="h-3 w-3 fill-yellow-400" />
                    {Number(listing.avg_rating).toFixed(1)} avg
                  </span>
                )}
              </div>

              {reviews.length === 0 ? (
                <GlassCard className="p-8 text-center">
                  <p className="font-mono text-sm text-white/30">
                    No reviews yet. Be the first buyer.
                  </p>
                </GlassCard>
              ) : (
                <div className="flex flex-col gap-3">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                  {listing.review_count > 3 && (
                    <a
                      href="#reviews"
                      className="font-mono text-[11px] text-cyan-400/60 hover:text-cyan-400 transition-colors text-center py-2"
                    >
                      View all {listing.review_count} reviews →
                    </a>
                  )}
                </div>
              )}
            </div>

          </div>
          {/* ══════════════════════════════════ END LEFT COLUMN ═════════════ */}

          {/* ══════════════════════════════════ RIGHT COLUMN (STICKY) ════════ */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-20">

            {/* ── Buy CTA card ─────────────────────────────────────────────── */}
            <GlassCard className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35 mb-1">
                Price
              </p>
              <p className="text-3xl font-bold text-white mb-4">
                {listing.price_type === "free"
                  ? "Free"
                  : listing.price_type === "contact"
                  ? "Contact"
                  : priceLabel}
              </p>

              {/* Buy button */}
              <button
                className="w-full rounded-lg py-2.5 font-mono text-sm font-semibold transition-all duration-200 mb-3"
                style={{
                  background: "rgba(0,230,230,0.12)",
                  border: "1px solid rgba(0,230,230,0.35)",
                  color: "#00e6e6",
                }}
                disabled
              >
                {listing.price_type === "free"
                  ? "Get for free"
                  : listing.price_type === "contact"
                  ? "Contact creator"
                  : `Buy — ${priceLabel}`}
              </button>

              {/* Demo link */}
              {listing.demo_url && (
                <a
                  href={listing.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center rounded-lg py-2.5 font-mono text-sm text-white/50 hover:text-white/80 transition-colors mb-3"
                  style={{ border: "1px solid rgba(72,71,74,0.40)" }}
                >
                  Live demo →
                </a>
              )}

              {/* Trust line */}
              <p className="font-mono text-[10px] text-white/25 text-center">
                🔒 Secure checkout via Stripe
              </p>
            </GlassCard>

            {/* ── Creator card ──────────────────────────────────────────────── */}
            {creator && (
              <GlassCard className="p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/35 mb-3">
                  Creator
                </h3>
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className="shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-mono text-[11px] font-bold"
                    style={{
                      background: creator.avatar_url ? undefined : "rgba(0,230,230,0.10)",
                      border: "1px solid rgba(0,230,230,0.20)",
                      color: "#00e6e6",
                      overflow: "hidden",
                    }}
                  >
                    {creator.avatar_url ? (
                      <img
                        src={creator.avatar_url}
                        alt={displayName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      getInitials(displayName)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-headline text-sm font-semibold text-white/85 truncate">
                      {creator.display_name ?? creator.username}
                    </p>
                    {creator.username && (
                      <Link
                        href={`/profile/${creator.username}`}
                        className="font-mono text-[10px] text-white/35 hover:text-cyan-400 transition-colors"
                      >
                        @{creator.username}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {creator.bio && (
                  <p className="mt-3 text-xs leading-relaxed text-white/45 line-clamp-2">
                    {creator.bio}
                  </p>
                )}

                {/* Stats */}
                <div
                  className="mt-3 flex items-center gap-4 pt-3"
                  style={{ borderTop: "1px solid rgba(72,71,74,0.35)" }}
                >
                  <span className="font-mono text-[10px] text-white/35">
                    <span className="text-white/60 font-semibold">{listing.purchase_count ?? 0}</span> sales
                  </span>
                  <span className="font-mono text-[10px] text-white/35">
                    <span className="text-white/60 font-semibold">{listing.review_count ?? 0}</span> reviews
                  </span>
                </div>

                {/* View profile link */}
                {creator.username && (
                  <Link
                    href={`/profile/${creator.username}`}
                    className="mt-3 block text-center font-mono text-[10px] text-white/35 hover:text-cyan-400 transition-colors"
                  >
                    View profile →
                  </Link>
                )}
              </GlassCard>
            )}

            {/* ── Quality Score card ────────────────────────────────────────── */}
            {qualityCheck && (
              <GlassCard className="p-5">
                <QualityBadge
                  overallScore={qualityCheck.overall_score}
                  securityScore={qualityCheck.security_score}
                  completenessScore={qualityCheck.completeness_score}
                  clarityScore={qualityCheck.clarity_score}
                  outcome={qualityCheck.outcome}
                  variant="full"
                />
              </GlassCard>
            )}

          </div>
          {/* ══════════════════════════════════ END RIGHT COLUMN ════════════ */}

        </div>

        {/* ── Similar products (full width below) ───────────────────────────── */}
        {similarListings.length > 0 && (
          <div className="mt-16">
            <div
              className="h-px w-full mb-8"
              style={{ background: "linear-gradient(90deg, transparent, rgba(72,71,74,0.40), transparent)" }}
            />
            <h2 className="font-headline text-lg font-semibold text-white/70 mb-6">
              More from this category
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similarListings.map((item) => (
                <ListingCard
                  key={item.id}
                  id={item.id}
                  slug={item.slug}
                  title={item.title}
                  tagline={item.tagline}
                  price_type={item.price_type}
                  price_cents={item.price_cents}
                  currency={item.currency}
                  thumbnail_url={item.thumbnail_url}
                  avg_rating={item.avg_rating ?? undefined}
                  review_count={item.review_count ?? undefined}
                  purchase_count={item.purchase_count ?? undefined}
                />
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// ── ReviewCard ────────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const reviewerName =
    review.reviewer?.display_name ?? review.reviewer?.username ?? "Anonymous";
  const initials = getInitials(reviewerName);

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "rgba(25,25,28,0.80)",
        border: "1px solid rgba(72,71,74,0.40)",
      }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-mono text-[10px] font-bold"
          style={{
            background: "rgba(191,129,255,0.10)",
            border: "1px solid rgba(191,129,255,0.20)",
            color: "#bf81ff",
          }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-mono text-[11px] text-white/60 truncate">{reviewerName}</span>
            <span className="font-mono text-[10px] text-white/25 shrink-0">
              {formatDate(review.created_at)}
            </span>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-0.5 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-2.5 w-2.5"
                style={{
                  fill: i < review.rating ? "#facc15" : "transparent",
                  color: i < review.rating ? "#facc15" : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>

          {review.title && (
            <p className="font-headline text-sm font-semibold text-white/80 mb-1">
              {review.title}
            </p>
          )}
          {review.body && (
            <p className="text-xs leading-relaxed text-white/50">{review.body}</p>
          )}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

interface ListingCardProps {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  price_type: "free" | "paid" | "contact";
  price_cents: number;
  currency?: string;
  category?: string;
  avg_rating?: number;
  review_count?: number;
  purchase_count?: number;
  thumbnail_url?: string | null;
  creator_display_name?: string;
  creator_username?: string;
  review_status?: string | null;
  is_new?: boolean;
  is_trending?: boolean;
}

function formatPrice(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/**
 * ListingCard — Dark Cyber-Tech product card.
 *
 * Visual language:
 *   • Pure black / #0A0A0A surface, subtle dark border
 *   • Space Grotesk for title, JetBrains Mono for price/stats
 *   • Indigo border-glow on hover, slight lift
 *   • Status badges: cyber HUD style
 */
export function ListingCard({
  slug,
  title,
  tagline,
  price_type,
  price_cents,
  currency = "usd",
  category,
  avg_rating,
  review_count,
  purchase_count,
  thumbnail_url,
  creator_display_name,
  creator_username,
  review_status,
  is_new,
  is_trending,
}: ListingCardProps) {
  const priceLabel =
    price_type === "free"
      ? "Free"
      : price_type === "contact"
      ? "Contact"
      : formatPrice(price_cents, currency);

  // Price badge styles — cyber minimal
  const priceStyle =
    price_type === "free"
      ? { color: "#22C55E", border: "1px solid rgba(34,197,94,0.25)", bg: "rgba(34,197,94,0.08)" }
      : price_type === "contact"
      ? { color: "#00F5FF", border: "1px solid rgba(0,245,255,0.25)", bg: "rgba(0,245,255,0.06)" }
      : { color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.12)", bg: "rgba(255,255,255,0.04)" };

  // Status badge — HUD-style tag
  let statusBadge: React.ReactNode = null;
  if (is_trending) {
    statusBadge = (
      <span
        className="rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide font-mono"
        style={{ color: "#F59E0B", border: "1px solid rgba(245,158,11,0.30)", background: "rgba(245,158,11,0.08)" }}
      >
        Trending
      </span>
    );
  } else if (is_new) {
    statusBadge = (
      <span
        className="rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide font-mono"
        style={{ color: "#6366F1", border: "1px solid rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.08)" }}
      >
        New
      </span>
    );
  } else if (review_status === "ready") {
    statusBadge = (
      <span
        className="rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide font-mono"
        style={{ color: "#22C55E", border: "1px solid rgba(34,197,94,0.30)", background: "rgba(34,197,94,0.07)" }}
      >
        Verified
      </span>
    );
  }

  return (
    <Link
      href={`/listing/${slug}`}
      className="group relative flex flex-col rounded-xl card-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        background: "#0A0A0A",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* ── Thumbnail ── */}
      {thumbnail_url && (
        <div className="overflow-hidden rounded-t-xl" style={{ aspectRatio: "16/9" }}>
          <img
            src={thumbnail_url}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-5">

        {/* ── Status + price row ── */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {statusBadge ?? (
              category ? (
                <span
                  className="text-[10px] font-medium uppercase tracking-[0.12em] font-mono"
                  style={{ color: "#71717A" }}
                >
                  {category}
                </span>
              ) : null
            )}
          </div>

          <span
            className="rounded px-2 py-0.5 text-[11px] font-semibold shrink-0 font-mono"
            style={{
              color: priceStyle.color,
              border: priceStyle.border,
              background: priceStyle.bg,
            }}
          >
            {priceLabel}
          </span>
        </div>

        {/* ── Title ── */}
        <div className="flex-1">
          <h3
            className="font-headline text-[0.9375rem] font-semibold leading-snug transition-colors duration-150 group-hover:text-[#818CF8] line-clamp-2"
            style={{ color: "#FFFFFF" }}
          >
            {title}
          </h3>
          {tagline && (
            <p
              className="mt-1.5 text-xs leading-relaxed line-clamp-2"
              style={{ color: "#71717A" }}
            >
              {tagline}
            </p>
          )}
        </div>

        {/* ── Meta row ── */}
        <div
          className="flex items-center justify-between pt-3.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            {(creator_display_name || creator_username) && (
              <p className="text-[10px] truncate font-mono" style={{ color: "#3F3F46" }}>
                by {creator_display_name ?? `@${creator_username}`}
              </p>
            )}
            <div className="flex items-center gap-3">
              {avg_rating != null && review_count != null && review_count > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: "#71717A" }}>
                  <Star className="h-2.5 w-2.5 fill-[#6366F1] text-[#6366F1]" />
                  {avg_rating.toFixed(1)}
                  <span style={{ color: "#3F3F46" }}>({review_count})</span>
                </span>
              )}
              {(purchase_count == null || purchase_count === 0) ? (
                <span className="text-[10px] font-mono" style={{ color: "rgba(99,102,241,0.5)" }}>
                  Be first to buy
                </span>
              ) : (
                <span className="text-[10px] font-mono" style={{ color: "#3F3F46" }}>
                  {purchase_count} sold
                </span>
              )}
            </div>
          </div>

          <ArrowRight
            className="h-3.5 w-3.5 shrink-0 transition-all duration-150 group-hover:translate-x-0.5"
            style={{ color: "#3F3F46" }}
          />
        </div>

      </div>
    </Link>
  );
}

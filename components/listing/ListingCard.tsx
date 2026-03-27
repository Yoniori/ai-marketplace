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
}

/** Price badge colours keyed by price_type */
const PRICE_STYLE = {
  free:    { color: "#69fd5d", border: "rgba(105,253,93,0.20)",  bg: "rgba(105,253,93,0.06)"  },
  paid:    { color: "#c1fffe", border: "rgba(193,255,254,0.20)", bg: "rgba(193,255,254,0.06)" },
  contact: { color: "#bf81ff", border: "rgba(191,129,255,0.20)", bg: "rgba(191,129,255,0.06)" },
} as const;

function formatPrice(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/**
 * ListingCard — Stitch glassmorphism product card.
 *
 * Visual language:
 *   • Dark frosted glass surface (glass-card utility)
 *   • Cyan glow on hover
 *   • Space Grotesk for title
 *   • JetBrains Mono for price, category, meta
 *   • Colour-coded price badge (green=free, cyan=paid, violet=contact)
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
  creator_display_name,
  creator_username,
}: ListingCardProps) {
  const priceStyle = PRICE_STYLE[price_type] ?? PRICE_STYLE.paid;
  const priceLabel =
    price_type === "free"
      ? "Free"
      : price_type === "contact"
      ? "Contact"
      : formatPrice(price_cents, currency);

  return (
    <Link
      href={`/listing/${slug}`}
      className="group relative flex flex-col rounded-xl border transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,255,255,0.10)] hover:border-cyan-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        background: "rgba(25, 25, 28, 0.80)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "rgba(72, 71, 74, 0.60)",
      }}
    >
      {/* ── Top accent line — appears on hover ── */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px rounded-t-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(0,255,255,0.50), rgba(156,66,244,0.50), transparent)",
        }}
      />

      <div className="flex flex-1 flex-col gap-4 p-5">

        {/* ── Category + price row ── */}
        <div className="flex items-center justify-between gap-2">
          {category ? (
            <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/60">
              {category}
            </span>
          ) : (
            <span />
          )}

          {/* Price badge */}
          <span
            className="rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold"
            style={{
              color: priceStyle.color,
              border: `1px solid ${priceStyle.border}`,
              background: priceStyle.bg,
            }}
          >
            {priceLabel}
          </span>
        </div>

        {/* ── Title ── */}
        <div className="flex-1">
          <h3 className="font-headline text-[0.9375rem] font-semibold leading-snug text-white/90 transition-colors duration-200 group-hover:text-cyan-400 line-clamp-2">
            {title}
          </h3>
          {tagline && (
            <p className="mt-1.5 text-xs leading-relaxed text-on-surface-variant/70 line-clamp-2">
              {tagline}
            </p>
          )}
        </div>

        {/* ── Meta row ── */}
        <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "rgba(72,71,74,0.40)" }}>

          {/* Creator + stats */}
          <div className="flex flex-col gap-1 min-w-0">
            {(creator_display_name || creator_username) && (
              <p className="font-mono text-[10px] text-on-surface-variant/50 truncate">
                by {creator_display_name ?? `@${creator_username}`}
              </p>
            )}
            <div className="flex items-center gap-3">
              {avg_rating != null && review_count != null && review_count > 0 && (
                <span className="flex items-center gap-1 font-mono text-[10px] text-on-surface-variant/60">
                  <Star className="h-2.5 w-2.5 fill-current text-yellow-400" />
                  {avg_rating.toFixed(1)}
                  <span className="text-on-surface-variant/40">({review_count})</span>
                </span>
              )}
              {purchase_count != null && purchase_count > 0 && (
                <span className="font-mono text-[10px] text-on-surface-variant/40">
                  {purchase_count} sold
                </span>
              )}
            </div>
          </div>

          {/* Arrow caret */}
          <ArrowRight
            className="h-4 w-4 shrink-0 text-on-surface-variant/30 transition-all duration-200 group-hover:text-cyan-400 group-hover:translate-x-0.5"
          />
        </div>

      </div>
    </Link>
  );
}

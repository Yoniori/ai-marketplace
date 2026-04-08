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
 * ListingCard — Editorial luxury product card.
 *
 * Visual language:
 *   • White surface, soft shadow, hairline border
 *   • Playfair Display for title
 *   • Terracotta / Forest / Gold status badges
 *   • Elegant hover: shadow lift + subtle border darkening
 *   • No glows, no gradients, no neon
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

  // Price badge styles
  const priceStyle =
    price_type === "free"
      ? { color: "#2D4739", border: "0.5px solid rgba(45,71,57,0.30)", bg: "rgba(45,71,57,0.06)" }
      : price_type === "contact"
      ? { color: "#B89F6E", border: "0.5px solid rgba(184,159,110,0.40)", bg: "rgba(184,159,110,0.08)" }
      : { color: "#0F0F0F", border: "0.5px solid rgba(15,15,15,0.18)", bg: "rgba(15,15,15,0.04)" };

  // Status badge — editorial minimal tags
  let statusBadge: React.ReactNode = null;
  if (is_trending) {
    statusBadge = (
      <span
        className="rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide"
        style={{ color: "#C05A44", border: "0.5px solid rgba(192,90,68,0.30)", background: "rgba(192,90,68,0.06)" }}
      >
        Trending
      </span>
    );
  } else if (is_new) {
    statusBadge = (
      <span
        className="rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide"
        style={{ color: "#2D4739", border: "0.5px solid rgba(45,71,57,0.30)", background: "rgba(45,71,57,0.06)" }}
      >
        New
      </span>
    );
  } else if (review_status === "ready") {
    statusBadge = (
      <span
        className="rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide"
        style={{ color: "#B89F6E", border: "0.5px solid rgba(184,159,110,0.35)", background: "rgba(184,159,110,0.07)" }}
      >
        Verified
      </span>
    );
  }

  return (
    <Link
      href={`/listing/${slug}`}
      className="group relative flex flex-col rounded-xl bg-white transition-all duration-200 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        border: "0.5px solid rgba(15,15,15,0.09)",
        boxShadow: "0 1px 3px rgba(15,15,15,0.06), 0 1px 2px rgba(15,15,15,0.04)",
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
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#9B9690]">
                  {category}
                </span>
              ) : null
            )}
          </div>

          <span
            className="rounded px-2 py-0.5 text-[11px] font-semibold shrink-0"
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
          <h3 className="font-headline text-[0.9375rem] font-semibold leading-snug text-[#0F0F0F] transition-colors duration-150 group-hover:text-[#C05A44] line-clamp-2">
            {title}
          </h3>
          {tagline && (
            <p className="mt-1.5 text-xs leading-relaxed text-[#6B6860] line-clamp-2">
              {tagline}
            </p>
          )}
        </div>

        {/* ── Meta row ── */}
        <div
          className="flex items-center justify-between pt-3.5"
          style={{ borderTop: "0.5px solid rgba(15,15,15,0.08)" }}
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            {(creator_display_name || creator_username) && (
              <p className="text-[10px] text-[#9B9690] truncate">
                by {creator_display_name ?? `@${creator_username}`}
              </p>
            )}
            <div className="flex items-center gap-3">
              {avg_rating != null && review_count != null && review_count > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-[#6B6860]">
                  <Star className="h-2.5 w-2.5 fill-[#B89F6E] text-[#B89F6E]" />
                  {avg_rating.toFixed(1)}
                  <span className="text-[#9B9690]">({review_count})</span>
                </span>
              )}
              {(purchase_count == null || purchase_count === 0) ? (
                <span className="text-[10px] text-[#C05A44]/60">
                  Be first to buy
                </span>
              ) : (
                <span className="text-[10px] text-[#9B9690]">
                  {purchase_count} sold
                </span>
              )}
            </div>
          </div>

          <ArrowRight
            className="h-3.5 w-3.5 shrink-0 text-[#9B9690] transition-all duration-150 group-hover:text-[#C05A44] group-hover:translate-x-0.5"
          />
        </div>

      </div>
    </Link>
  );
}

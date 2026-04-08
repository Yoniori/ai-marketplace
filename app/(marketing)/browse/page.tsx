/**
 * Browse Page — /browse
 *
 * Server Component. Fetches published listings + categories from Supabase,
 * applies URL-driven search & category filters, and renders the marketplace grid.
 *
 * URL params:
 *   ?q=<search term>          — full-text ilike on title + tagline
 *   ?category=<slug>          — filter by category slug
 *   ?built_with=<tool>        — filter by tool used to build the listing
 */

import { createClient }       from "@/lib/supabase/server";
import { ListingCard }        from "@/components/listing/ListingCard";
import { BrowseFilters }      from "./_components/BrowseFilters";
import type { CategoryItem }  from "./_components/BrowseFilters";
import { Package }            from "lucide-react";

// Revalidate cached renders every 60 s (ISR).
// Dynamic (searchParams) renders are always fresh.
export const revalidate = 60;

// ── Types ────────────────────────────────────────────────────────────────────

type ListingRow = {
  id:             string;
  slug:           string;
  title:          string;
  tagline:        string;
  price_type:     "free" | "paid" | "contact";
  price_cents:    number;
  currency:       string;
  thumbnail_url:  string | null;
  review_count:   number;
  avg_rating:     number;
  purchase_count: number;
  categories:     { id: number; name: string; slug: string } | null;
  creator:        { display_name: string | null; username: string | null } | null;
};

// ── Page ─────────────────────────────────────────────────────────────────────

interface BrowsePageProps {
  searchParams: { q?: string; category?: string; built_with?: string };
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const supabase    = await createClient();
  // Sanitize search input before use in PostgREST .or() filter string.
  // Commas and parentheses are PostgREST OR-syntax delimiters; if left in
  // the interpolated string they will break the filter and return wrong results.
  // ILIKE wildcards % and _ are escaped so users searching for literal "50%"
  // or "my_tool" match exactly, not as wildcard patterns.
  const rawQ = searchParams.q?.trim() ?? "";
  const safeQ = rawQ
    .replace(/[%_]/g, "\\$&")   // escape ILIKE special chars
    .replace(/[,()]/g, " ")     // replace PostgREST syntax chars with space
    .trim();
  const categorySlug = searchParams.category ?? null;
  const builtWith    = searchParams.built_with ?? null;

  // ── 1. Fetch categories (used for filter bar + resolving category_id) ──────
  const { data: categoriesData } = await supabase
    .from("categories")
    .select("id, name, slug, icon")
    .order("sort_order");

  const categories: CategoryItem[] = (categoriesData ?? []).map((c) => ({
    id:   c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon ?? null,
  }));

  // Resolve slug → category object (avoids a second DB round-trip)
  const activeCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug) ?? null
    : null;

  // ── 2. Build + execute listings query ────────────────────────────────────
  let query = supabase
    .from("listings")
    .select(`
      id,
      slug,
      title,
      tagline,
      price_type,
      price_cents,
      currency,
      thumbnail_url,
      review_count,
      avg_rating,
      purchase_count,
      categories ( id, name, slug ),
      creator:profiles!creator_id ( display_name, username )
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(72);

  if (activeCategory) {
    query = query.eq("category_id", activeCategory.id);
  }

  if (safeQ) {
    // ilike search across title and tagline (safeQ has PostgREST syntax chars stripped)
    query = query.or(
      `title.ilike.%${safeQ}%,tagline.ilike.%${safeQ}%`,
    );
  }

  if (builtWith) {
    query = (query as any).contains("built_with", [builtWith]);
  }

  const { data: listingsData } = await query;
  const listings = (listingsData ?? []) as unknown as ListingRow[];

  // ── 3. Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDFCFB]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: "0.5px solid rgba(15,15,15,0.09)" }}>
        <div className="container py-10 md:py-14">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9B9690]">
            Marketplace
          </p>
          <h1
            className="font-headline font-bold tracking-tight text-[#0F0F0F]"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 1.05 }}
          >
            Browse Products
          </h1>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-[#6B6860]">
            Apps, automations, agents, and tools built with AI coding tools.
            Instant purchase — immediate access.
          </p>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="container py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">

          {/* ── Sidebar filters ────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <BrowseFilters
              categories={categories}
              activeCategorySlug={categorySlug}
              activeBuiltWith={builtWith}
              searchQuery={rawQ}
              totalCount={listings.length}
            />
          </aside>

          {/* ── Listing grid ───────────────────────────────────────────── */}
          <section>
            {listings.length === 0 ? (
              <EmptyState searchQuery={rawQ} hasCategory={!!activeCategory} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    slug={listing.slug}
                    title={listing.title}
                    tagline={listing.tagline}
                    price_type={listing.price_type}
                    price_cents={listing.price_cents}
                    currency={listing.currency}
                    thumbnail_url={listing.thumbnail_url}
                    review_count={listing.review_count}
                    avg_rating={Number(listing.avg_rating)}
                    purchase_count={listing.purchase_count}
                    category={listing.categories?.name}
                    creator_display_name={
                      listing.creator?.display_name ?? undefined
                    }
                    creator_username={
                      listing.creator?.username ?? undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  searchQuery,
  hasCategory,
}: {
  searchQuery: string;
  hasCategory: boolean;
}) {
  const isFiltered = searchQuery || hasCategory;

  return (
    <div
      className="flex flex-col items-center gap-5 rounded-xl px-8 py-24 text-center bg-white"
      style={{ border: "0.5px solid rgba(15,15,15,0.09)" }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: "#F5F3F0", border: "0.5px solid rgba(15,15,15,0.10)" }}
      >
        <Package className="h-5 w-5 text-[#9B9690]" />
      </div>

      <div className="max-w-xs">
        <p className="font-headline text-lg font-semibold text-[#0F0F0F]">
          {isFiltered ? "No results found" : "No products yet"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#6B6860]">
          {searchQuery
            ? `Nothing matched "${searchQuery}". Try a broader search or clear the category filter.`
            : hasCategory
            ? "No published products in this category yet. Try browsing all categories."
            : "Check back soon — creators are publishing products now."}
        </p>
      </div>

      <div
        className="h-px w-12 rounded-full"
        style={{ background: "rgba(15,15,15,0.12)" }}
      />
    </div>
  );
}

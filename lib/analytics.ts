import { createClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyRevenue {
  date: string;        // "YYYY-MM-DD"
  revenue: number;     // creator_payout_cents (integer)
}

export interface TopListing {
  id: string;
  title: string;
  slug: string;
  sales: number;
  revenue: number;     // creator_payout_cents total (integer)
  views: number;
}

export interface CreatorAnalytics {
  totalRevenueCents: number;
  totalSales: number;
  totalViews: number;
  avgRatingWeighted: number;       // purchase-weighted avg across all listings
  dailyRevenue: DailyRevenue[];    // last 30 days, filled with 0s for empty days
  topListings: TopListing[];       // top 5 by revenue
}

// ─── Main Function ────────────────────────────────────────────────────────────

/**
 * Fetches raw data for the authenticated creator and aggregates
 * analytics entirely in JavaScript (no GROUP BY / date_trunc in SQL).
 *
 * Returns structured analytics ready for the earnings dashboard.
 */
export async function getCreatorAnalytics(): Promise<CreatorAnalytics | null> {
  const supabase = await createClient();

  // 1. Verify session
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 2. Fetch the creator's listings (id, title, slug, avg_rating, review_count)
  const { data: listings, error: listingsErr } = await (supabase as any)
    .from("listings")
    .select("id, title, slug, avg_rating, review_count")
    .eq("creator_id", user.id);

  if (listingsErr || !listings || listings.length === 0) {
    return emptyAnalytics();
  }

  const listingIds: string[] = listings.map((l: { id: string }) => l.id);

  // 3. Fetch all completed purchases for those listings (raw rows, no aggregation in SQL)
  const { data: purchases } = await (supabase as any)
    .from("purchases")
    .select("id, listing_id, creator_payout_cents, created_at")
    .in("listing_id", listingIds)
    .eq("status", "completed");

  const rawPurchases: Array<{
    id: string;
    listing_id: string;
    creator_payout_cents: number;
    created_at: string;
  }> = purchases ?? [];

  // 4. Fetch all views for those listings (raw rows)
  const { data: views } = await (supabase as any)
    .from("listing_views")
    .select("listing_id, viewed_at")
    .in("listing_id", listingIds);

  const rawViews: Array<{ listing_id: string; viewed_at: string }> = views ?? [];

  // ── Aggregate in JavaScript ────────────────────────────────────────────────

  // 5. KPI totals
  const totalRevenueCents = rawPurchases.reduce(
    (sum, p) => sum + (p.creator_payout_cents ?? 0),
    0
  );
  const totalSales = rawPurchases.length;
  const totalViews = rawViews.length;

  // 6. Purchase-weighted average rating
  const totalReviews = listings.reduce(
    (sum: number, l: { review_count: number }) => sum + (l.review_count ?? 0),
    0
  );
  const avgRatingWeighted =
    totalReviews === 0
      ? 0
      : listings.reduce(
          (sum: number, l: { avg_rating: number; review_count: number }) =>
            sum + (l.avg_rating ?? 0) * (l.review_count ?? 0),
          0
        ) / totalReviews;

  // 7. Daily revenue — last 30 days
  const dailyRevenue = buildDailyRevenue(rawPurchases, 30);

  // 8. Top listings by revenue (top 5)
  const viewsByListing = rawViews.reduce<Record<string, number>>((acc, v) => {
    acc[v.listing_id] = (acc[v.listing_id] ?? 0) + 1;
    return acc;
  }, {});

  const salesByListing = rawPurchases.reduce<
    Record<string, { sales: number; revenue: number }>
  >((acc, p) => {
    if (!acc[p.listing_id]) acc[p.listing_id] = { sales: 0, revenue: 0 };
    acc[p.listing_id].sales += 1;
    acc[p.listing_id].revenue += p.creator_payout_cents ?? 0;
    return acc;
  }, {});

  const topListings: TopListing[] = listings
    .map((l: { id: string; title: string; slug: string }) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      sales: salesByListing[l.id]?.sales ?? 0,
      revenue: salesByListing[l.id]?.revenue ?? 0,
      views: viewsByListing[l.id] ?? 0,
    }))
    .sort((a: TopListing, b: TopListing) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    totalRevenueCents,
    totalSales,
    totalViews,
    avgRatingWeighted,
    dailyRevenue,
    topListings,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyAnalytics(): CreatorAnalytics {
  return {
    totalRevenueCents: 0,
    totalSales: 0,
    totalViews: 0,
    avgRatingWeighted: 0,
    dailyRevenue: buildDailyRevenue([], 30),
    topListings: [],
  };
}

/**
 * Groups raw purchase rows into daily buckets for the last `days` days.
 * Returns an array sorted ascending by date, with 0-revenue days included.
 */
function buildDailyRevenue(
  purchases: Array<{ creator_payout_cents: number; created_at: string }>,
  days: number
): DailyRevenue[] {
  // Build a map of date → revenue from raw rows
  const map: Record<string, number> = {};
  for (const p of purchases) {
    const date = p.created_at.slice(0, 10); // "YYYY-MM-DD"
    map[date] = (map[date] ?? 0) + (p.creator_payout_cents ?? 0);
  }

  // Fill every day in the window, even if 0
  const result: DailyRevenue[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({ date: dateStr, revenue: map[dateStr] ?? 0 });
  }

  return result;
}

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/listings
 *
 * Browse and search published listings.
 *
 * Query params:
 *   q          — full-text ilike search on title + tagline
 *   category   — category slug filter
 *   price_type — "free" | "paid" | "contact"
 *   sort       — "newest" (default) | "rating" | "popular"
 *   page       — 1-based page number (default: 1)
 *   limit      — results per page (default: 24, max: 72)
 *
 * POST /api/listings
 * Listing creation is handled by the createListing server action
 * (app/actions/listing.ts), not this REST route.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const rawQ      = searchParams.get("q")?.trim() ?? "";
  const catSlug   = searchParams.get("category") ?? null;
  const priceType = searchParams.get("price_type") ?? null;
  const sort      = searchParams.get("sort") ?? "newest";
  const page      = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit     = Math.min(72, Math.max(1, parseInt(searchParams.get("limit") ?? "24", 10) || 24));
  const offset    = (page - 1) * limit;

  // Sanitize search: strip PostgREST OR-syntax chars and escape ILIKE wildcards
  const safeQ = rawQ
    .replace(/[%_]/g, "\\$&")
    .replace(/[,()]/g, " ")
    .trim();

  const supabase = await createClient();

  // Resolve category slug → id (avoids a join)
  let categoryId: number | null = null;
  if (catSlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", catSlug)
      .single();
    categoryId = cat?.id ?? null;
    // Unknown slug returns empty result set (not an error)
    if (!categoryId) {
      return NextResponse.json({ data: [], total: 0, page, limit });
    }
  }

  // Build query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("listings")
    .select(
      `
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
      published_at,
      categories ( id, name, slug ),
      creator:profiles!creator_id ( display_name, username, avatar_url )
      `,
      { count: "exact" }
    )
    .eq("status", "published");

  if (categoryId) query = query.eq("category_id", categoryId);
  if (priceType && ["free", "paid", "contact"].includes(priceType)) {
    query = query.eq("price_type", priceType);
  }
  if (safeQ) {
    query = query.or(`title.ilike.%${safeQ}%,tagline.ilike.%${safeQ}%`);
  }

  // Sort
  switch (sort) {
    case "rating":
      query = query.order("avg_rating", { ascending: false }).order("review_count", { ascending: false });
      break;
    case "popular":
      query = query.order("purchase_count", { ascending: false });
      break;
    default: // newest
      query = query.order("published_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[GET /api/listings] Query error:", error.message);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, limit });
}

export async function POST() {
  // Listing creation is handled server-side via the createListing server action.
  // See: app/actions/listing.ts
  return NextResponse.json(
    { error: "Use the createListing server action to create listings." },
    { status: 405 }
  );
}

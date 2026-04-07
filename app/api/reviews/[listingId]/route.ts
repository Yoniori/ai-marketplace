import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ listingId: string }> };

/**
 * GET /api/reviews/[listingId]
 * Fetch paginated visible reviews for a listing.
 * Public — no auth required.
 *
 * Query params:
 *   page  — 1-based (default: 1)
 *   limit — per page (default: 20, max: 50)
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { listingId } = await params;
  const { searchParams } = request.nextUrl;

  const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const offset = (page - 1) * limit;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error, count } = await db
    .from("reviews")
    .select(
      `
      id,
      rating,
      title,
      body,
      created_at,
      reviewer:profiles!reviewer_id ( display_name, username, avatar_url )
      `,
      { count: "exact" }
    )
    .eq("listing_id", listingId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[GET /api/reviews] Query error:", error.message);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, limit });
}

/**
 * POST /api/reviews/[listingId]
 * Submit a review. Requires:
 *   - authenticated user
 *   - user has a completed purchase for this listing (enforced by RLS + API)
 *   - user has not already reviewed this listing
 *
 * Body: { rating: 1-5, title?: string, body?: string, purchase_id: string }
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { listingId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate fields
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "rating must be an integer between 1 and 5" },
      { status: 400 }
    );
  }
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 100) || null : null;
  const reviewBody = typeof body.body === "string" ? body.body.trim().slice(0, 2000) || null : null;
  const purchaseId = typeof body.purchase_id === "string" ? body.purchase_id : null;

  if (!purchaseId) {
    return NextResponse.json(
      { error: "purchase_id is required" },
      { status: 400 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Verify buyer owns the purchase and it's completed for this listing
  const { data: purchase } = await db
    .from("purchases")
    .select("id, buyer_id, listing_id, status")
    .eq("id", purchaseId)
    .eq("buyer_id", user.id)
    .eq("listing_id", listingId)
    .eq("status", "completed")
    .single();

  if (!purchase) {
    return NextResponse.json(
      { error: "You must have a completed purchase to review this listing." },
      { status: 403 }
    );
  }

  // Check for duplicate review
  const { data: existing } = await db
    .from("reviews")
    .select("id")
    .eq("reviewer_id", user.id)
    .eq("listing_id", listingId)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "You have already reviewed this listing." },
      { status: 409 }
    );
  }

  const { data: review, error: insertError } = await db
    .from("reviews")
    .insert({
      listing_id:  listingId,
      reviewer_id: user.id,
      purchase_id: purchaseId,
      rating,
      title,
      body:        reviewBody,
    })
    .select(
      `id, rating, title, body, created_at,
       reviewer:profiles!reviewer_id ( display_name, username, avatar_url )`
    )
    .single();

  if (insertError) {
    // Handle unique constraint (duplicate review race condition)
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "You have already reviewed this listing." },
        { status: 409 }
      );
    }
    console.error("[POST /api/reviews] Insert error:", insertError.message);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }

  return NextResponse.json({ data: review }, { status: 201 });
}

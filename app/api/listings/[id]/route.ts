import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/listings/[id]
 * Returns a single listing by ID.
 * Published listings are public; draft/archived listings require ownership.
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: listing, error } = await db
    .from("listings")
    .select(
      `
      id,
      slug,
      title,
      tagline,
      description,
      price_type,
      price_cents,
      currency,
      status,
      thumbnail_url,
      gallery_urls,
      demo_url,
      product_url,
      review_count,
      avg_rating,
      purchase_count,
      published_at,
      created_at,
      updated_at,
      categories ( id, name, slug ),
      creator:profiles!creator_id ( id, display_name, username, avatar_url, bio )
      `
    )
    .eq("id", id)
    .single();

  if (error || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Non-published listings are only visible to owner or admin
  if (listing.status !== "published") {
    if (!user) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    const isOwner = listing.creator?.id === user.id;
    if (!isOwner) {
      const { data: profile } = await db
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
      }
    }
  }

  return NextResponse.json({ data: listing });
}

/**
 * PATCH /api/listings/[id]
 * Update a listing. Owner (or admin) only.
 *
 * Allowed fields: title, tagline, description, price_type, price_cents,
 *   thumbnail_url, gallery_urls, demo_url, product_url, category_id, status.
 *
 * Status transitions enforced:
 *   - draft → published: only if review_status = 'ready'
 *   - published → archived: always allowed
 *   - archived → draft: always allowed
 *   - Any → suspended: admin only
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Fetch current listing for ownership + state checks
  const { data: listing, error: fetchError } = await db
    .from("listings")
    .select("id, creator_id, status, review_status")
    .eq("id", id)
    .single();

  if (fetchError || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Check ownership
  const isOwner = listing.creator_id === user.id;
  if (!isOwner) {
    const { data: profile } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Build allowed update payload (whitelist — never trust arbitrary input)
  const ALLOWED = [
    "title", "tagline", "description", "price_type", "price_cents",
    "thumbnail_url", "gallery_urls", "demo_url", "product_url", "category_id",
  ];
  const update: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) update[key] = body[key];
  }

  // Validate title/tagline lengths if provided
  if (typeof update.title === "string") {
    if (update.title.trim().length < 3 || update.title.trim().length > 100) {
      return NextResponse.json(
        { error: "Title must be between 3 and 100 characters." },
        { status: 400 }
      );
    }
    update.title = update.title.trim();
  }
  if (typeof update.tagline === "string") {
    if (update.tagline.trim().length < 10 || update.tagline.trim().length > 120) {
      return NextResponse.json(
        { error: "Tagline must be between 10 and 120 characters." },
        { status: 400 }
      );
    }
    update.tagline = update.tagline.trim();
  }

  // Validate price
  if (update.price_type === "paid") {
    const cents = Number(update.price_cents ?? body.price_cents);
    if (!cents || cents <= 0) {
      return NextResponse.json(
        { error: "A paid listing requires a price greater than 0." },
        { status: 400 }
      );
    }
  }
  if (update.price_type !== "paid") {
    update.price_cents = 0;
  }

  // Handle status transition separately
  if ("status" in body) {
    const newStatus = body.status as string;
    const currentStatus = listing.status;

    const validTransitions: Record<string, string[]> = {
      draft:     ["published", "archived"],
      published: ["archived"],
      archived:  ["draft"],
      suspended: [], // admin-only, handled below
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from "${currentStatus}" to "${newStatus}".` },
        { status: 400 }
      );
    }

    // Publishing requires passing the quality check
    if (newStatus === "published" && listing.review_status !== "ready") {
      return NextResponse.json(
        { error: "Listing must pass the quality check (status: ready) before publishing." },
        { status: 400 }
      );
    }

    update.status = newStatus;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const { data: updated, error: updateError } = await db
    .from("listings")
    .update(update)
    .eq("id", id)
    .select("id, slug, title, status, updated_at")
    .single();

  if (updateError) {
    console.error("[PATCH /api/listings/[id]] Update error:", updateError.message);
    return NextResponse.json(
      { error: `Update failed: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/listings/[id]
 * Soft-delete a listing by setting status = "archived".
 * Owner or admin only.
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: listing, error: fetchError } = await db
    .from("listings")
    .select("creator_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const isOwner = listing.creator_id === user.id;
  if (!isOwner) {
    const { data: profile } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (listing.status === "archived") {
    return NextResponse.json({ message: "Listing is already archived." });
  }

  const { error: archiveError } = await db
    .from("listings")
    .update({ status: "archived" })
    .eq("id", id);

  if (archiveError) {
    console.error("[DELETE /api/listings/[id]] Archive error:", archiveError.message);
    return NextResponse.json({ error: "Failed to archive listing" }, { status: 500 });
  }

  return NextResponse.json({ message: "Listing archived successfully." });
}

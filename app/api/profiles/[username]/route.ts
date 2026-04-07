import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/profiles/[username]
 * Returns a public creator profile and their published listings.
 * No authentication required.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Validate username format (mirrors DB constraint: ^[a-z0-9_-]+$)
  if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select(
      "id, username, display_name, bio, avatar_url, website_url, twitter_url, github_url, role, created_at"
    )
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Fetch published listings for this creator
  const { data: listings } = await db
    .from("listings")
    .select(
      `id, slug, title, tagline, price_type, price_cents, currency,
       thumbnail_url, review_count, avg_rating, purchase_count, published_at,
       categories ( id, name, slug )`
    )
    .eq("creator_id", profile.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(48);

  return NextResponse.json({ data: { ...profile, listings: listings ?? [] } });
}

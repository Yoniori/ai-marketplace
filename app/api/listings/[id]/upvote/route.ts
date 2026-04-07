import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/listings/[id]/upvote
 * Returns today's upvote count and whether the current user has voted.
 */
export async function GET(_req: Request, { params }: RouteContext) {
  const { id: listingId } = await params;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: { user } } = await supabase.auth.getUser();

  const { count } = await (supabase as any)
    .from("launch_upvotes")
    .select("*", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .eq("date", today);

  let hasVoted = false;
  if (user) {
    const { data } = await (supabase as any)
      .from("launch_upvotes")
      .select("id")
      .eq("listing_id", listingId)
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();
    hasVoted = !!data;
  }

  return NextResponse.json({ count: count ?? 0, hasVoted });
}

/**
 * POST /api/listings/[id]/upvote
 * Adds today's upvote. Returns 409 if already voted.
 */
export async function POST(_req: Request, { params }: RouteContext) {
  const { id: listingId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await (supabase as any)
    .from("launch_upvotes")
    .insert({ user_id: user.id, listing_id: listingId, date: today });

  if (error) {
    if (error.code === "23505") { // unique violation
      return NextResponse.json({ error: "Already voted today" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return new count
  const { count } = await (supabase as any)
    .from("launch_upvotes")
    .select("*", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .eq("date", today);

  return NextResponse.json({ count: count ?? 0, hasVoted: true });
}

/**
 * DELETE /api/listings/[id]/upvote
 * Removes today's upvote.
 */
export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id: listingId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await (supabase as any)
    .from("launch_upvotes")
    .delete()
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .eq("date", today);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count } = await (supabase as any)
    .from("launch_upvotes")
    .select("*", { count: "exact", head: true })
    .eq("listing_id", listingId)
    .eq("date", today);

  return NextResponse.json({ count: count ?? 0, hasVoted: false });
}

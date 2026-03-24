import { NextResponse } from "next/server";

/**
 * GET /api/listings
 * Browse and search published listings.
 * Full implementation in Step 6 (Browse & Search).
 *
 * POST /api/listings
 * Create a new listing (authenticated creators only).
 * Full implementation in Step 5 (Create Listing Flow).
 */

export async function GET() {
  // TODO (Step 6): Implement search, filter, sort, pagination
  return NextResponse.json({ data: [], total: 0, message: "Coming in Step 6" });
}

export async function POST() {
  // TODO (Step 5): Implement listing creation with auth guard
  return NextResponse.json({ message: "Coming in Step 5" }, { status: 501 });
}

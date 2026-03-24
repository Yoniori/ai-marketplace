import { NextResponse } from "next/server";

/**
 * GET /api/reviews/[listingId]
 * Fetch all visible reviews for a listing.
 *
 * POST /api/reviews/[listingId]
 * Submit a review (verified buyer only — must have completed purchase).
 *
 * Full implementation in Step 9 (Reviews).
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const { listingId } = await params;
  // TODO (Step 9): Fetch paginated reviews for listing
  return NextResponse.json({ listingId, data: [], message: "Coming in Step 9" });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  const { listingId } = await params;
  // TODO (Step 9): Create review — verify buyer has completed purchase
  return NextResponse.json({ listingId, message: "Coming in Step 9" }, { status: 501 });
}

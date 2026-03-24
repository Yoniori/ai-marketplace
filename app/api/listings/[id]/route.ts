import { NextResponse } from "next/server";

/**
 * GET /api/listings/[id]
 * Fetch a single listing by ID.
 *
 * PATCH /api/listings/[id]
 * Update a listing (owner only).
 *
 * DELETE /api/listings/[id]
 * Archive a listing (owner only).
 *
 * Full implementation in Step 5 (Create Listing Flow).
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO (Step 5): Fetch listing by ID with creator + tags join
  return NextResponse.json({ id, message: "Coming in Step 5" });
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO (Step 5): Update listing (auth guard — owner only)
  return NextResponse.json({ id, message: "Coming in Step 5" }, { status: 501 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // TODO (Step 5): Soft-delete (set status = 'archived')
  return NextResponse.json({ id, message: "Coming in Step 5" }, { status: 501 });
}

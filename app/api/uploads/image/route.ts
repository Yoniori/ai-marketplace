import { NextResponse } from "next/server";

/**
 * POST /api/uploads/image
 * Returns a presigned Supabase Storage URL for direct image upload.
 * Full implementation in Step 5 (Create Listing Flow).
 */
export async function POST() {
  // TODO (Step 5): Generate presigned upload URL for Supabase Storage
  return NextResponse.json({ message: "Coming in Step 5" }, { status: 501 });
}

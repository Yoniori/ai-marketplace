import { NextResponse } from "next/server";

/**
 * GET /api/profiles/[username]
 * Returns a public creator profile with their published listings.
 * Full implementation in Step 4 (Creator Profile).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  // TODO (Step 4): Fetch profile by username + published listings
  return NextResponse.json({ username, message: "Coming in Step 4" });
}

import { NextResponse } from "next/server";

/**
 * PATCH /api/profiles/me
 * Updates the authenticated user's own profile.
 * Full implementation in Step 4 (Creator Profile).
 */
export async function PATCH() {
  // TODO (Step 4): Update profile with Zod validation + Supabase
  return NextResponse.json({ message: "Coming in Step 4" }, { status: 501 });
}

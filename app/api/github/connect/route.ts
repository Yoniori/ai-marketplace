import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getGitHubClientId } from "@/lib/supabase/env";

/**
 * GET /api/github/connect
 *
 * Initiates the GitHub OAuth flow for repository import.
 * This is a separate OAuth App from Supabase social login —
 * the callback lands at /api/github/callback (not /auth/callback).
 *
 * Flow:
 *   1. Verify the platform user is authenticated.
 *   2. Generate a random CSRF state token and store it in an
 *      HTTP-only cookie (5-minute TTL).
 *   3. Redirect the browser to GitHub's authorisation endpoint.
 *
 * Scopes requested: public_repo read:user
 *   - public_repo  : read public repo metadata, contents (README)
 *   - read:user    : read the GitHub user's numeric ID and username
 *   Private repos are intentionally excluded for MVP.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  // ── Auth check ──────────────────────────────────────────────
  // Only authenticated platform users can connect a GitHub account.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not signed in — redirect to login, then back here after.
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("redirectTo", "/api/github/connect");
    return NextResponse.redirect(loginUrl);
  }

  // ── CSRF state ──────────────────────────────────────────────
  // A random UUID stored in an HTTP-only cookie. The callback route
  // verifies the returned state matches before processing the code.
  const state       = crypto.randomUUID();
  const cookieStore = await cookies();

  cookieStore.set("github_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",  // Must be lax (not strict) so the cookie survives
    secure:   process.env.NODE_ENV === "production", // HTTPS in prod only
    maxAge:   300,    // 5 minutes — code must be exchanged within this window
    path:     "/",
  });

  // ── Build authorisation URL ─────────────────────────────────
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? origin;
  const redirectUri = `${appUrl}/api/github/callback`;

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id",    getGitHubClientId());
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope",        "public_repo read:user");
  authUrl.searchParams.set("state",        state);

  return NextResponse.redirect(authUrl);
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getGitHubClientId, getGitHubClientSecret } from "@/lib/supabase/env";
import { encryptToken } from "@/lib/github/crypto";

/**
 * GET /api/github/callback
 *
 * Receives the GitHub OAuth redirect after the user approves (or denies)
 * the repository import authorisation.
 *
 * This route handles our own OAuth App — completely separate from
 * Supabase social login (/auth/callback).
 *
 * Steps:
 *   1. Validate the CSRF state cookie.
 *   2. Verify the platform user is still authenticated.
 *   3. Exchange the one-time code for a GitHub access token.
 *   4. Fetch the GitHub user's ID and username.
 *   5. Encrypt the access token (AES-256-GCM).
 *   6. Upsert into github_connections (admin client, bypasses RLS).
 *   7. Redirect to /dashboard/settings with a success flag.
 *
 * On any error: redirect to /dashboard/settings?github_error=<reason>
 */

const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_BASE  = "https://api.github.com";

// GitHub requires a User-Agent header — requests without one get a 403.
const USER_AGENT = "VibecodeMarket/1.0 (https://vibecodemarket.com)";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code    = searchParams.get("code");
  const state   = searchParams.get("state");
  const ghError = searchParams.get("error"); // e.g. "access_denied"

  // ── Helper: redirect to settings with an error query param ──
  // Kept local so it can close over `origin` without extra args.
  function errorRedirect(reason: string): NextResponse {
    const url = new URL("/dashboard/settings", origin);
    url.searchParams.set("github_error", reason);
    return NextResponse.redirect(url);
  }

  // ── GitHub returned an error (user denied access, etc.) ─────
  if (ghError) {
    console.error("[GitHub Callback] GitHub error:", ghError);
    return errorRedirect("access_denied");
  }

  if (!code || !state) {
    console.error("[GitHub Callback] Missing code or state in callback.");
    return errorRedirect("missing_params");
  }

  // ── Validate CSRF state ─────────────────────────────────────
  const cookieStore = await cookies();
  const storedState = cookieStore.get("github_oauth_state")?.value;

  // Delete the state cookie regardless of outcome — it's single-use.
  cookieStore.delete("github_oauth_state");

  if (!storedState || storedState !== state) {
    console.error("[GitHub Callback] State mismatch — possible CSRF.");
    return errorRedirect("invalid_state");
  }

  // ── Verify the platform user is still authenticated ─────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Session expired between connect and callback — send to login.
    return NextResponse.redirect(new URL("/login", origin));
  }

  // ── Exchange code for GitHub access token ───────────────────
  const appUrl      = process.env.NEXT_PUBLIC_APP_URL ?? origin;
  const redirectUri = `${appUrl}/api/github/callback`;

  let accessToken: string;
  let tokenScope:  string;

  try {
    const tokenRes = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        // Must be application/json to receive JSON back.
        // The default Accept returns `access_token=...&token_type=bearer` (form-encoded).
        Accept:           "application/json",
        "Content-Type":   "application/json",
        "User-Agent":     USER_AGENT,
      },
      body: JSON.stringify({
        client_id:     getGitHubClientId(),
        client_secret: getGitHubClientSecret(),
        code,
        redirect_uri:  redirectUri,
      }),
      // No caching — OAuth codes are single-use.
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      throw new Error(`Token endpoint returned HTTP ${tokenRes.status}`);
    }

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      scope?:        string;
      token_type?:   string;
      error?:        string;
      error_description?: string;
    };

    if (tokenData.error || !tokenData.access_token) {
      throw new Error(tokenData.error_description ?? tokenData.error ?? "No access_token in response");
    }

    accessToken = tokenData.access_token;
    tokenScope  = tokenData.scope ?? "";
  } catch (err) {
    console.error("[GitHub Callback] Token exchange failed:", err);
    return errorRedirect("token_exchange_failed");
  }

  // ── Fetch GitHub user identity ───────────────────────────────
  // We need the numeric github_user_id (stable, survives username changes)
  // and the github_username (display only).
  let githubUserId:   number;
  let githubUsername: string;

  try {
    const userRes = await fetch(`${GITHUB_API_BASE}/user`, {
      headers: {
        Authorization:          `Bearer ${accessToken}`,
        Accept:                 "application/vnd.github+json",
        "User-Agent":           USER_AGENT,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });

    if (!userRes.ok) {
      throw new Error(`GET /user returned HTTP ${userRes.status}`);
    }

    const githubUser = (await userRes.json()) as {
      id:    number;
      login: string;
    };

    if (!githubUser.id || !githubUser.login) {
      throw new Error("GitHub user response missing id or login");
    }

    githubUserId   = githubUser.id;
    githubUsername = githubUser.login;
  } catch (err) {
    console.error("[GitHub Callback] Failed to fetch GitHub user:", err);
    return errorRedirect("user_fetch_failed");
  }

  // ── Encrypt the access token ─────────────────────────────────
  // The plaintext token never touches the database.
  // encryptToken() calls getGitHubEncryptionKey() which throws if the env
  // var is absent or malformed — guard so we return a friendly redirect.
  let encrypted: ReturnType<typeof encryptToken>;
  try {
    encrypted = encryptToken(accessToken);
  } catch (err) {
    console.error("[GitHub Callback] Token encryption failed:", err);
    return errorRedirect("encryption_failed");
  }

  // ── Upsert connection row ────────────────────────────────────
  // createAdminClient() bypasses RLS — required because the anon client's
  // INSERT policy requires the row's user_id to match auth.uid(), which is
  // correct for direct client writes but we're writing server-side here.
  // The admin client is safe because we've already verified user.id above.
  //
  // ON CONFLICT (user_id) handles reconnects: an existing connection row
  // is fully replaced with the new token and GitHub identity.
  //
  // (admin as any) cast: the __InternalSupabase format mismatch in
  // types/supabase.ts causes .from("github_connections") to resolve to
  // `never` until db:types is re-run against the updated schema.
  try {
    const admin = await createAdminClient();

    const { error: upsertError } = await (admin as any)
      .from("github_connections")
      .upsert(
        {
          user_id:                user.id,
          github_user_id:         githubUserId,
          github_username:        githubUsername,
          encrypted_access_token: encrypted.ciphertext,
          token_iv:               encrypted.iv,
          token_auth_tag:         encrypted.authTag,
          token_scope:            tokenScope,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("[GitHub Callback] Upsert failed:", upsertError.message);
      return errorRedirect("save_failed");
    }
  } catch (err) {
    console.error("[GitHub Callback] Admin client error:", err);
    return errorRedirect("save_failed");
  }

  // ── Success ──────────────────────────────────────────────────
  const successUrl = new URL("/dashboard/settings", origin);
  successUrl.searchParams.set("github_connected", "true");
  return NextResponse.redirect(successUrl);
}

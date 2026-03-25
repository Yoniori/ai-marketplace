import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase/env";

/**
 * GET /auth/callback
 *
 * OAuth return URL for Google (and other providers) via Supabase.
 * Also handles Supabase email confirmation links.
 *
 * Flow:
 *   Google → Supabase /auth/v1/callback → here → /dashboard
 *
 * Two things are critical for PKCE to work:
 *
 *  1. This route is excluded from middleware.ts matcher so that
 *     updateSession()'s getUser() call cannot wipe the PKCE code verifier
 *     cookie before we exchange it.
 *
 *  2. We read cookies from `request.cookies` (raw incoming request), not
 *     from `cookies()` (next/headers), which reflects post-middleware state.
 *     The PKCE verifier was set by createBrowserClient via document.cookie
 *     and lives in the raw Cookie header.
 *
 *  3. We write session cookies onto the NextResponse object directly so that
 *     Set-Cookie headers are guaranteed to reach the browser.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code      = searchParams.get("code");
  const error     = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");
  const next      = searchParams.get("next") ?? "/dashboard";

  // ── [DIAG] Log all incoming cookies — PKCE verifier must be present ────────
  const allIncomingCookies = request.cookies.getAll();
  console.log("[OAuth-CB:diag] ALL incoming cookie names:",
    allIncomingCookies.map((c) => c.name)
  );
  const pkceCookie = allIncomingCookies.find((c) => c.name.includes("code-verifier"));
  console.log(
    "[OAuth-CB:diag] PKCE verifier cookie:",
    pkceCookie
      ? `FOUND — name="${pkceCookie.name}" value="${pkceCookie.value.slice(0, 20)}…"`
      : "MISSING ⚠️  — this will cause exchangeCodeForSession to fail"
  );
  // ── [DIAG] End ──────────────────────────────────────────────────────────────

  console.log("[OAuth] code:", !!code, "| next:", next, "| origin:", origin);

  // ── Provider-level error (user denied access, etc.) ──────────────────────
  if (error) {
    console.error("[OAuth] Provider error:", error, "|", errorDesc);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDesc ?? "Authentication cancelled.")}`, origin)
    );
  }

  // ── No code ───────────────────────────────────────────────────────────────
  if (!code) {
    console.warn("[OAuth] No code in request — redirecting to /login");
    return NextResponse.redirect(new URL("/login", origin));
  }

  // ── Build the response we'll return so we can attach session cookies ──────
  const safeNext    = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const destination = new URL(safeNext, origin);
  const response    = NextResponse.redirect(destination);

  // ── Supabase client bound to raw request cookies + response ───────────────
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Read from the raw incoming request — this is where the PKCE
        // code verifier cookie lives, untouched by middleware.
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        // Write session cookies directly onto the response the browser
        // receives — guarantees Set-Cookie headers are forwarded.
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // ── [DIAG] Exact cookie check right before exchange ──────────────────────
  console.log('[OAuth-CB:diag] cookie names:', request.cookies.getAll().map(c => c.name))
  const pkce = request.cookies.get('sb-mnjgulzwzxrfwlbpfghh-auth-token-code-verifier')
  console.log('[OAuth-CB:diag] pkce exists:', !!pkce)
  console.log('[OAuth-CB:diag] pkce value length:', pkce?.value?.length ?? 0)
  // ── [DIAG] End ────────────────────────────────────────────────────────────

  // ── Exchange one-time code for a session ──────────────────────────────────
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  console.log("[OAuth] exchange success:", !exchangeError);

  if (exchangeError) {
    console.error("[OAuth] exchangeCodeForSession failed:", exchangeError.message);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, origin)
    );
  }

  // ── Session set — send user to destination ────────────────────────────────
  console.log("[OAuth] Redirecting to:", destination.toString());
  return response;
}

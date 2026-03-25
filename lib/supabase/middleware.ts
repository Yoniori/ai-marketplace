import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase/env";

/**
 * Refreshes the Supabase auth session cookie on every matched request.
 * Called from the root middleware.ts.
 *
 * Critical rules (per Supabase SSR docs):
 *  1. createServerClient must be called with the cookies adapter below — no shortcuts.
 *  2. supabase.auth.getUser() must be called immediately after creating the client.
 *  3. Do NOT add any logic between createServerClient and getUser.
 *  4. Always return supabaseResponse (not NextResponse.next()) so Set-Cookie headers
 *     are forwarded to the browser correctly.
 */
export async function updateSession(request: NextRequest) {
  // Start with a pass-through response that carries the incoming request headers
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        // Step 1: mirror cookies onto the request object (required by @supabase/ssr)
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        // Step 2: rebuild response so it carries the updated request
        supabaseResponse = NextResponse.next({ request });
        // Step 3: write Set-Cookie headers onto the response sent to the browser
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // ⚠️  Do NOT add any code between createServerClient and getUser.
  //     getUser() validates the JWT and refreshes the session token when needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Route Guards ─────────────────────────────────────────────

  // Protect /dashboard/* — unauthenticated users go to /login
  if (!user && pathname.startsWith("/dashboard")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users away from /login and /signup
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.searchParams.delete("redirectTo");
    return NextResponse.redirect(redirectUrl);
  }

  // ⚠️  Always return supabaseResponse (not a plain NextResponse.next()).
  //     Returning a different response object drops the refreshed session cookies.
  return supabaseResponse;
}

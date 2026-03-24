import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Root Next.js middleware.
 * Runs on every matched request to refresh the Supabase session
 * and enforce auth guards on protected routes.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Public assets in /public
     * - auth/callback — MUST be excluded so the middleware's getUser() call
     *   does not wipe the PKCE code verifier cookie before the route handler
     *   can exchange the code. (@supabase/ssr v0.3.x clears all auth storage
     *   on _removeSession, which runs when no active session is found.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

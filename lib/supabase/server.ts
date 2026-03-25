import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { supabaseUrl, supabaseAnonKey, getServiceRoleKey } from "@/lib/supabase/env";

/**
 * Supabase client for use in Server Components, Route Handlers,
 * and Server Actions. Reads and writes the session via cookies.
 *
 * ⚠️  Do NOT use `await cookies()` before calling createServerClient —
 *     Next.js requires cookies() to be called inside the function body,
 *     not cached at module scope.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component where cookie writes are a no-op.
          // The root middleware.ts handles the actual cookie refresh.
        }
      },
    },
  });
}

/**
 * Supabase admin client using the service role key.
 *
 * ⚠️  ONLY use in trusted server-side contexts:
 *     - Stripe webhook handlers
 *     - Admin-only API routes
 *     - Background jobs
 *
 * Bypasses ALL Row Level Security policies — never expose to the browser.
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, getServiceRoleKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // No-op in Server Components — expected
        }
      },
    },
  });
}

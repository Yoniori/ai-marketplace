"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase/env";

/**
 * Supabase client for use in Client Components.
 * Uses the public anon key — all access is governed by RLS policies.
 *
 * Env vars are validated at module load time via lib/supabase/env.ts.
 * A missing or malformed URL throws a clear error before reaching
 * createBrowserClient (preventing the generic "Invalid supabaseUrl" crash).
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

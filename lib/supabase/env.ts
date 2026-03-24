/**
 * lib/supabase/env.ts
 * Vibe Code Market — Supabase environment variable validation
 *
 * Central source of truth for all Supabase env reads.
 * Throws a clear, actionable error at startup instead of
 * letting an undefined value silently reach createBrowserClient /
 * createServerClient and surface as "Invalid supabaseUrl".
 */

function assertEnv(name: string, value: string | undefined): string {
  if (!value || value.trim() === "" || value.startsWith("your_")) {
    throw new Error(
      `[Vibe Code Market] Missing or invalid environment variable: ${name}\n` +
        `→ Open .env.local and set a real value for ${name}.\n` +
        `→ Then restart the dev server with: npm run dev`
    );
  }
  return value.trim();
}

function assertUrl(name: string, value: string | undefined): string {
  const raw = assertEnv(name, value);
  try {
    const parsed = new URL(raw);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Protocol must be http or https");
    }
  } catch {
    throw new Error(
      `[Vibe Code Market] ${name} is not a valid URL.\n` +
        `→ Got: "${raw}"\n` +
        `→ Expected format: https://<project-ref>.supabase.co\n` +
        `→ Find it at: Supabase Dashboard → Project Settings → API`
    );
  }
  return raw;
}

// ── Public (safe for browser) ─────────────────────────────────

export const supabaseUrl = assertUrl(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL
);

export const supabaseAnonKey = assertEnv(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── Server-only (never sent to browser) ──────────────────────

/**
 * Returns the Supabase service role key.
 * Only call this in server-side code (API routes, webhooks).
 * It will throw at runtime if accidentally bundled client-side.
 */
export function getServiceRoleKey(): string {
  return assertEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ── GitHub OAuth (server-only) ────────────────────────────────
// All three getters are lazy functions — NEVER called at module
// scope, because this file is also imported by lib/supabase/client.ts
// which runs in the browser. The env vars themselves don't exist
// in the browser bundle, and that is correct.

/**
 * GitHub OAuth App client ID.
 * Register your OAuth App at github.com/settings/developers.
 */
export function getGitHubClientId(): string {
  return assertEnv("GITHUB_CLIENT_ID", process.env.GITHUB_CLIENT_ID);
}

/**
 * GitHub OAuth App client secret.
 * Used server-side only for the token exchange in the callback route.
 * Never log, expose in errors, or send to the client.
 */
export function getGitHubClientSecret(): string {
  return assertEnv("GITHUB_CLIENT_SECRET", process.env.GITHUB_CLIENT_SECRET);
}

/**
 * 256-bit AES encryption key for GitHub access tokens.
 * Must be exactly 64 lowercase hex characters (32 bytes).
 *
 * Generate a key:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * If this value changes, all stored tokens become unreadable.
 * Users will need to reconnect GitHub.
 */
export function getGitHubEncryptionKey(): string {
  const key = assertEnv(
    "GITHUB_TOKEN_ENCRYPTION_KEY",
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY
  );
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error(
      `[Vibe Code Market] GITHUB_TOKEN_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).\n` +
        `→ Got a value of length ${key.length}.\n` +
        `→ Generate a valid key:\n` +
        `    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"\n` +
        `→ Set it in .env.local and restart with: npm run dev`
    );
  }
  return key;
}

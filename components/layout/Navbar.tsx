import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/layout/UserMenu";

/**
 * Navbar — Server Component.
 * Taller rail (h-16) with gradient-fill pill CTA for premium feel.
 */
export async function Navbar() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const profile = user
    ? await supabase
        .from("profiles")
        .select("username, display_name, avatar_url, role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => data)
    : null;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080808]/92 backdrop-blur-md">

      {/* Gradient bottom border — centered violet bloom, fades at edges */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, hsl(256 60% 52% / 0.22) 25%, hsl(256 60% 52% / 0.22) 75%, transparent 100%)",
        }}
      />

      <div className="container relative flex h-16 items-center justify-between">

        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold text-white/90">
          {/* Bordered badge glyph */}
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded border font-mono text-[10px] font-bold leading-none select-none"
            style={{
              borderColor: "hsl(256 60% 52% / 0.35)",
              background: "hsl(256 60% 52% / 0.1)",
              color: "hsl(256 85% 72%)",
            }}
          >
            ▸
          </span>
          <span className="tracking-[-0.01em]">Vibe Code Market</span>
        </Link>

        {/* Primary nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/browse"
            className="px-4 py-2 rounded-md text-sm text-white/60 transition-colors hover:text-white/90"
          >
            Browse
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-md text-sm text-white/60 transition-colors hover:text-white/90"
          >
            Sell
          </Link>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {user && profile ? (
            <UserMenu
              displayName={profile.display_name ?? profile.username}
              username={profile.username}
              avatarUrl={profile.avatar_url}
              role={profile.role}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm text-white/60 transition-colors hover:text-white/80"
              >
                Sign in
              </Link>

              {/* Gradient-fill pill CTA */}
              <Link
                href="/signup"
                className="inline-flex h-9 items-center justify-center rounded-full px-5 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-85 focus-visible:outline-none"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(256 72% 56%), hsl(280 62% 50%))",
                  boxShadow:
                    "0 0 0 1px hsl(256 60% 52% / 0.35), 0 0 20px hsl(256 72% 58% / 0.22)",
                }}
              >
                Get started
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}

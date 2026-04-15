import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/layout/UserMenu";

// Explicit type to work around postgrest-js v2 column inference returning never
type ProfileRow = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
};

/**
 * Navbar — Server Component.
 * Glassmorphism rail with Stitch neon-dark design system:
 *   • Frosted glass bg + cyan bottom glow
 *   • Space Grotesk wordmark with cyan→violet gradient
 *   • JetBrains Mono nav links
 *   • Cyan→violet gradient CTA pill with glow
 */
export async function Navbar() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const profile: ProfileRow | null = user
    ? ((await supabase
        .from("profiles")
        .select("username, display_name, avatar_url, role")
        .eq("id", user.id)
        .single()) as unknown as { data: ProfileRow | null; error: unknown }).data
    : null;

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: "rgba(14, 14, 16, 0.80)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0, 255, 255, 0.10)",
        boxShadow: "0 0 40px rgba(0, 255, 255, 0.06), 0 1px 0 rgba(0,255,255,0.06)",
      }}
    >
      <div className="container relative flex h-16 items-center justify-between">

        {/* ── Wordmark ── */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Glyph badge */}
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-lg font-mono text-[11px] font-bold leading-none select-none transition-all duration-300 group-hover:shadow-[0_0_12px_rgba(0,255,255,0.4)]"
            style={{
              border: "1px solid rgba(0, 255, 255, 0.30)",
              background: "rgba(0, 255, 255, 0.08)",
              color: "#00e6e6",
            }}
          >
            ▸
          </span>
          <span
            className="font-headline text-sm font-bold tracking-tight bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #c1fffe 0%, #bf81ff 100%)",
            }}
          >
            Vibe Code Market
          </span>
        </Link>

        {/* ── Primary nav ── */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/browse"
            className="font-mono px-4 py-2 rounded-lg text-sm text-on-surface-variant transition-all duration-200 hover:text-cyan-400 hover:bg-cyan-400/5"
          >
            Browse
          </Link>
          <Link
            href="/signup"
            className="font-mono px-4 py-2 rounded-lg text-sm text-on-surface-variant transition-all duration-200 hover:text-cyan-400 hover:bg-cyan-400/5"
          >
            Sell
          </Link>
        </nav>

        {/* ── Auth ── */}
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
                className="font-mono px-3 py-1.5 text-sm text-on-surface-variant transition-colors hover:text-cyan-400"
              >
                Sign in
              </Link>

              {/* Cyan→violet gradient CTA pill */}
              <Link
                href="/signup"
                className="inline-flex h-9 items-center justify-center rounded-full px-5 font-headline text-sm font-bold tracking-tight text-[#0e0e10] transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none"
                style={{
                  background: "linear-gradient(135deg, #00e6e6, #9c42f4)",
                  boxShadow: "0 0 20px rgba(0, 230, 230, 0.30)",
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

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/layout/UserMenu";

type ProfileRow = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
};

/**
 * Navbar — Editorial luxury navigation.
 * Clean white bar, hairline border, terracotta CTA.
 * No glow, no gradients, no neon.
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
      className="sticky top-0 z-50 w-full bg-[#FDFCFB]"
      style={{ borderBottom: "0.5px solid rgba(15,15,15,0.09)" }}
    >
      <div className="container flex h-15 items-center justify-between" style={{ height: "3.75rem" }}>

        {/* ── Wordmark ── */}
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded font-mono text-[11px] font-bold leading-none select-none"
            style={{
              background: "#C05A44",
              color: "#FFFFFF",
            }}
          >
            ▸
          </span>
          <span className="font-headline text-sm font-semibold tracking-tight text-[#0F0F0F]">
            Vibe Code Market
          </span>
        </Link>

        {/* ── Primary nav ── */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/browse"
            className="text-sm text-[#6B6860] transition-colors duration-150 hover:text-[#0F0F0F]"
          >
            Browse
          </Link>
          <Link
            href="/signup"
            className="text-sm text-[#6B6860] transition-colors duration-150 hover:text-[#0F0F0F]"
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
                className="text-sm text-[#6B6860] transition-colors duration-150 hover:text-[#0F0F0F]"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-9 items-center justify-center rounded-md px-5 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#A84D39] active:scale-[0.98] focus-visible:outline-none"
                style={{ background: "#C05A44" }}
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

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
 * Navbar — Dark Cyber-Tech navigation.
 * Pure black background, sharp lines, indigo CTA.
 * No warmth, no gradients — built for the future.
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
        background: "#000000",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="container flex h-14 items-center justify-between">

        {/* ── Wordmark ── */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded font-mono text-[11px] font-bold leading-none select-none transition-shadow duration-200 group-hover:shadow-glow-sm"
            style={{
              background: "#6366F1",
              color: "#FFFFFF",
            }}
          >
            ▸
          </span>
          <span className="font-headline text-sm font-semibold tracking-tight text-white">
            Vibe Code Market
          </span>
        </Link>

        {/* ── Primary nav ── */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/browse"
            className="text-sm transition-colors duration-150 hover:text-white"
            style={{ color: "#71717A" }}
          >
            Browse
          </Link>
          <Link
            href="/signup"
            className="text-sm transition-colors duration-150 hover:text-white"
            style={{ color: "#71717A" }}
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
                className="text-sm transition-colors duration-150 hover:text-white"
                style={{ color: "#71717A" }}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-9 items-center justify-center rounded-md px-5 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#4F46E5] hover:shadow-glow-sm active:scale-[0.98] focus-visible:outline-none"
                style={{ background: "#6366F1" }}
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

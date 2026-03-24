import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/layout/UserMenu";

/**
 * Navbar — Server Component.
 * Dark glass surface anchored to the hero's #080808 background.
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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">

        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-white/90">
          <span className="font-mono text-xs font-bold text-primary select-none leading-none">▸</span>
          <span>Vibe Code Market</span>
        </Link>

        {/* Primary nav */}
        <nav className="hidden md:flex items-center">
          <Link
            href="/browse"
            className="px-3 py-1.5 rounded-md text-sm text-white/45 transition-colors hover:text-white hover:bg-white/[0.05]"
          >
            Browse
          </Link>
          <Link
            href="/signup"
            className="px-3 py-1.5 rounded-md text-sm text-white/45 transition-colors hover:text-white hover:bg-white/[0.05]"
          >
            Sell
          </Link>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2">
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
                className="px-3 py-1.5 rounded-md text-sm text-white/45 transition-colors hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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

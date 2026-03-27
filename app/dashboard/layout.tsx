import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart3,
  Settings,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/layout/UserMenu";

// Explicit type to work around postgrest-js v2 column inference returning never
type ProfileRow = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
};

const NAV_ITEMS = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "Overview"                    },
  { href: "/dashboard/listings",  icon: Package,         label: "Listings",  creatorOnly: true },
  { href: "/dashboard/purchases", icon: ShoppingBag,     label: "Purchases"                   },
  { href: "/dashboard/earnings",  icon: BarChart3,       label: "Earnings",  creatorOnly: true },
  { href: "/dashboard/settings",  icon: Settings,        label: "Settings"                    },
  { href: "/dashboard/admin",     icon: Shield,          label: "Admin",     adminOnly: true   },
];

/**
 * /dashboard/* layout — server-side protected.
 * Stitch glassmorphism design: frosted glass sidebar, cyan active rail,
 * JetBrains Mono labels, neon role badge.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const { data: profile } = (await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, role")
    .eq("id", user.id)
    .single()) as unknown as { data: ProfileRow | null; error: unknown };

  if (!profile) {
    redirect("/");
  }

  const isCreator = profile.role === "creator" || profile.role === "admin";
  const isAdmin   = profile.role === "admin";

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.adminOnly   && !isAdmin)   return false;
    if (item.creatorOnly && !isCreator) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#0e0e10" }}>

      {/* ── Top bar ── */}
      <header
        className="sticky top-0 z-40 flex h-14 items-center gap-4 px-4"
        style={{
          background: "rgba(14, 14, 16, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,255,255,0.10)",
          boxShadow: "0 0 30px rgba(0,255,255,0.05)",
        }}
      >
        <Link href="/" className="flex items-center gap-2 group mr-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-md font-mono text-[10px] font-bold leading-none select-none transition-all duration-300 group-hover:shadow-[0_0_10px_rgba(0,255,255,0.4)]"
            style={{
              border: "1px solid rgba(0,255,255,0.25)",
              background: "rgba(0,255,255,0.07)",
              color: "#00e6e6",
            }}
          >
            ▸
          </span>
          <span
            className="hidden sm:inline font-headline text-sm font-bold tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #c1fffe 0%, #bf81ff 100%)" }}
          >
            Vibe Code Market
          </span>
        </Link>

        <div className="flex-1" />

        <UserMenu
          displayName={profile.display_name ?? profile.username}
          username={profile.username}
          avatarUrl={profile.avatar_url}
          role={profile.role}
        />
      </header>

      <div className="flex flex-1">

        {/* ── Sidebar ── */}
        <aside
          className="hidden w-52 shrink-0 md:flex md:flex-col"
          style={{
            background: "rgba(19, 19, 21, 0.90)",
            backdropFilter: "blur(12px)",
            borderRight: "1px solid rgba(0,255,255,0.08)",
          }}
        >
          <nav className="flex flex-col gap-0.5 p-3 pt-4">
            {visibleNav.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="group/nav flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-mono text-sm text-on-surface-variant/60 transition-all duration-200 hover:bg-cyan-400/5 hover:text-cyan-400"
              >
                <Icon className="h-4 w-4 shrink-0 transition-colors group-hover/nav:text-cyan-400" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Role badge */}
          <div className="mt-auto p-3" style={{ borderTop: "1px solid rgba(0,255,255,0.06)" }}>
            <div
              className="rounded-xl px-3 py-3"
              style={{
                background: "rgba(0,255,255,0.04)",
                border: "1px solid rgba(0,255,255,0.12)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ background: "#00e6e6", boxShadow: "0 0 6px rgba(0,230,230,0.6)" }}
                />
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400/80">
                  {profile.role}
                </p>
              </div>
              <p className="truncate font-mono text-[11px] text-on-surface-variant/50">
                @{profile.username}
              </p>
            </div>
          </div>
        </aside>

        {/* ── Page content ── */}
        <main
          className="flex-1 overflow-auto"
          style={{ background: "#0e0e10" }}
        >
          {/* Subtle light-leak behind content */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0"
            style={{
              background:
                "radial-gradient(ellipse 50% 40% at 80% 10%, rgba(0,255,255,0.04) 0%, transparent 60%), " +
                "radial-gradient(ellipse 40% 30% at 10% 90%, rgba(119,1,208,0.04) 0%, transparent 60%)",
            }}
          />
          <div className="relative z-10 p-6 md:p-8">{children}</div>
        </main>

      </div>
    </div>
  );
}

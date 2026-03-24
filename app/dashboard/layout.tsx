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
 * Dark glass shell matching the homepage visual system.
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, role")
    .eq("id", user.id)
    .single();

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
    <div className="flex min-h-screen flex-col bg-[#080808]">

      {/* ── Top bar — identical chrome to marketing Navbar ── */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur px-4">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-white/80 mr-2">
          <span className="font-mono text-xs font-bold text-primary select-none leading-none">▸</span>
          <span className="hidden sm:inline">Vibe Code Market</span>
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
        <aside className="hidden w-52 shrink-0 border-r border-white/[0.06] bg-[#080808] md:flex md:flex-col">
          <nav className="flex flex-col gap-0.5 p-3 pt-4">
            {visibleNav.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-white/40 transition-colors hover:bg-white/[0.05] hover:text-white/80"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Role badge */}
          <div className="mt-auto border-t border-white/[0.05] p-3">
            <div className="rounded-md border border-primary/15 bg-primary/[0.06] px-3 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary/70">
                {profile.role}
              </p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-white/30">
                @{profile.username}
              </p>
            </div>
          </div>
        </aside>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-auto bg-[#0a0a0a]">
          <div className="p-6 md:p-8">{children}</div>
        </main>

      </div>
    </div>
  );
}

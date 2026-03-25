import Link from "next/link";
import { ArrowRight, Package, ShoppingBag, Star, User, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";

// Explicit type to work around postgrest-js v2 column inference returning never
type ProfileRow = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
};

/**
 * /dashboard — Authenticated home page.
 * Dark, premium — matches the homepage visual system.
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = (await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()) as unknown as { data: ProfileRow | null; error: unknown };

  if (!profile) redirect("/");

  const isCreator = profile.role === "creator" || profile.role === "admin";
  const firstName = profile.display_name?.split(" ")[0] ?? profile.username;
  const joinedDate = formatDate(profile.created_at);

  return (
    <div className="space-y-10 max-w-3xl">

      {/* ── Welcome ── */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25 mb-2">
          Dashboard
        </p>
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-white">
          Welcome back, {firstName}.
        </h1>
        <p className="mt-1.5 font-mono text-xs text-white/30">
          @{profile.username} · since {joinedDate}
        </p>
      </div>

      {/* ── Role upgrade prompt (buyers only) ── */}
      {profile.role === "buyer" && (
        <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02] p-6 pl-7">
          {/* Left accent */}
          <div
            className="absolute left-0 top-0 h-full w-0.5 rounded-l-lg"
            style={{
              background: "linear-gradient(to bottom, hsl(256 90% 82% / 0.7), hsl(270 80% 70% / 0.2))",
            }}
          />
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/[0.08] text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-white/85">Start selling your AI-built products</h2>
              <p className="mt-1.5 text-sm text-white/35 leading-relaxed">
                Upgrade to a Creator account to publish listings, earn revenue, and join the community
                of builders shipping real products.
              </p>
              <Link
                href="/dashboard/settings"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary/80 transition-colors hover:text-primary"
              >
                Become a creator
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick actions ── */}
      <div>
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">
          Quick actions
        </p>
        <div className="grid grid-cols-1 gap-px bg-white/[0.06] sm:grid-cols-2">

          {isCreator && (
            <Link
              href="/dashboard/listings/new"
              className="group flex items-center gap-3.5 bg-[#0a0a0a] px-5 py-5 transition-colors hover:bg-white/[0.03]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/[0.08] text-primary transition-colors group-hover:bg-primary/15">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                  New listing
                </p>
                <p className="font-mono text-[10px] text-white/25 mt-0.5">Publish a product</p>
              </div>
            </Link>
          )}

          <Link
            href="/dashboard/purchases"
            className="group flex items-center gap-3.5 bg-[#0a0a0a] px-5 py-5 transition-colors hover:bg-white/[0.03]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04] text-white/40 transition-colors group-hover:border-white/[0.14] group-hover:text-white/65">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                My purchases
              </p>
              <p className="font-mono text-[10px] text-white/25 mt-0.5">Access what you&apos;ve bought</p>
            </div>
          </Link>

          <Link
            href="/browse"
            className="group flex items-center gap-3.5 bg-[#0a0a0a] px-5 py-5 transition-colors hover:bg-white/[0.03]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04] text-white/40 transition-colors group-hover:border-white/[0.14] group-hover:text-white/65">
              <Star className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                Browse products
              </p>
              <p className="font-mono text-[10px] text-white/25 mt-0.5">Discover AI-built tools</p>
            </div>
          </Link>

          <Link
            href="/dashboard/settings"
            className="group flex items-center gap-3.5 bg-[#0a0a0a] px-5 py-5 transition-colors hover:bg-white/[0.03]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.04] text-white/40 transition-colors group-hover:border-white/[0.14] group-hover:text-white/65">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                Edit profile
              </p>
              <p className="font-mono text-[10px] text-white/25 mt-0.5">Bio, links, avatar</p>
            </div>
          </Link>

        </div>
      </div>

      {/* ── Stats strip ── */}
      <div>
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">
          Activity
        </p>
        <div className="flex gap-px bg-white/[0.06]">
          {[
            { label: "Listings",  value: "—", sub: isCreator ? "Post your first" : "Upgrade to list" },
            { label: "Purchases", value: "—", sub: "Browse the market"   },
            { label: "Reviews",   value: "—", sub: "Share your feedback" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="flex-1 bg-[#0a0a0a] px-5 py-5">
              <p className="font-mono text-2xl font-bold text-white/50">{value}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 mt-1.5">{label}</p>
              <p className="font-mono text-[10px] text-white/20 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

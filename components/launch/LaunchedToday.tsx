import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UpvoteButton } from "@/components/launch/UpvoteButton";
import { formatPrice } from "@/lib/utils";

interface LaunchEntry {
  listing_id: string;
  upvote_count: number;
  listing: {
    id: string;
    slug: string;
    title: string;
    tagline: string;
    price_type: "free" | "paid" | "contact";
    price_cents: number;
    currency: string;
    thumbnail_url: string | null;
  };
}

export async function LaunchedToday() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: { user } } = await supabase.auth.getUser();

  // Get today's upvote counts by listing, descending
  const { data: upvoteData } = await (supabase as any)
    .from("launch_upvotes")
    .select("listing_id, listing:listings!listing_id(id, slug, title, tagline, price_type, price_cents, currency, thumbnail_url, status)")
    .eq("date", today)
    .order("created_at", { ascending: false });

  // Deduplicate: group by listing_id and count
  const countMap = new Map<string, number>();
  const listingMap = new Map<string, LaunchEntry["listing"]>();

  for (const row of (upvoteData ?? [])) {
    if (!row.listing || row.listing.status !== "published") continue;
    const id = row.listing_id as string;
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
    if (!listingMap.has(id)) {
      listingMap.set(id, row.listing as LaunchEntry["listing"]);
    }
  }

  // Convert to sorted array
  const entries: LaunchEntry[] = Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([listing_id, upvote_count]) => ({
      listing_id,
      upvote_count,
      listing: listingMap.get(listing_id)!,
    }));

  // Get the current user's votes today for these listings
  const userVotedIds = new Set<string>();
  if (user && entries.length > 0) {
    const listingIds = entries.map((e) => e.listing_id);
    const { data: userVotes } = await (supabase as any)
      .from("launch_upvotes")
      .select("listing_id")
      .eq("user_id", user.id)
      .eq("date", today)
      .in("listing_id", listingIds);
    for (const v of (userVotes ?? [])) {
      userVotedIds.add(v.listing_id as string);
    }
  }

  if (entries.length === 0) return null;

  return (
    <section className="border-b border-cyan-400/10 bg-[#0e0e10]">
      <div className="container py-16 md:py-20">

        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ background: "#00e6e6", boxShadow: "0 0 6px rgba(0,230,230,0.6)" }}
              />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-400/80">
                Live today
              </p>
            </div>
            <h2 className="font-headline text-[1.875rem] font-bold tracking-[-0.03em] text-white md:text-[2.5rem]">
              Launched Today
            </h2>
          </div>
          <Link
            href="/browse"
            className="text-sm text-on-surface-variant transition-colors hover:text-cyan-400"
          >
            All products →
          </Link>
        </div>

        {/* Ranked list */}
        <div className="flex flex-col gap-3">
          {entries.map((entry, idx) => {
            const priceLabel = formatPrice(entry.listing.price_cents, entry.listing.currency);
            return (
              <div
                key={entry.listing_id}
                className="flex items-center gap-4 rounded-xl px-5 py-4 transition-all duration-200 hover:border-cyan-400/25"
                style={{
                  background: "rgba(25,25,28,0.60)",
                  border: "1px solid rgba(72,71,74,0.30)",
                }}
              >
                {/* Rank */}
                <span
                  className="w-6 shrink-0 font-mono text-sm font-bold"
                  style={{ color: idx === 0 ? "#c1fffe" : "rgba(173,170,173,0.45)" }}
                >
                  {idx + 1}
                </span>

                {/* Thumbnail */}
                {entry.listing.thumbnail_url ? (
                  <div
                    className="h-10 w-10 shrink-0 rounded-lg overflow-hidden"
                    style={{ border: "1px solid rgba(72,71,74,0.30)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.listing.thumbnail_url}
                      alt={entry.listing.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center"
                    style={{
                      background: "rgba(0,255,255,0.05)",
                      border: "1px solid rgba(0,255,255,0.12)",
                    }}
                  >
                    <span className="font-mono text-[10px] text-cyan-400/40">
                      {entry.listing.title.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Title + tagline */}
                <Link
                  href={`/listing/${entry.listing.slug}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate font-headline text-sm font-semibold text-white hover:text-cyan-400 transition-colors">
                    {entry.listing.title}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-on-surface-variant/60">
                    {entry.listing.tagline}
                  </p>
                </Link>

                {/* Price */}
                <span
                  className="hidden shrink-0 font-mono text-xs sm:block"
                  style={{ color: "rgba(193,255,254,0.55)" }}
                >
                  {entry.listing.price_type === "free" ? "Free" : priceLabel}
                </span>

                {/* Upvote button */}
                <div className="shrink-0">
                  <UpvoteButton
                    listingId={entry.listing_id}
                    initialCount={entry.upvote_count}
                    initialHasVoted={userVotedIds.has(entry.listing_id)}
                    isAuthenticated={!!user}
                  />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

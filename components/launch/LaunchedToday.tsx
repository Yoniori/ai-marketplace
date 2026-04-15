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

  const { data: upvoteData } = await (supabase as any)
    .from("launch_upvotes")
    .select("listing_id, listing:listings!listing_id(id, slug, title, tagline, price_type, price_cents, currency, thumbnail_url, status)")
    .eq("date", today)
    .order("created_at", { ascending: false });

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

  const entries: LaunchEntry[] = Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([listing_id, upvote_count]) => ({
      listing_id,
      upvote_count,
      listing: listingMap.get(listing_id)!,
    }));

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
    <section
      style={{
        background: "#050505",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="container py-16 md:py-20">

        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              {/* Live pulsing indicator */}
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: "#6366F1",
                  boxShadow: "0 0 6px rgba(99,102,241,0.8)",
                  animation: "pulse-dot 1.8s ease-in-out infinite",
                }}
              />
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.14em] font-mono"
                style={{ color: "#71717A" }}
              >
                Live today
              </p>
            </div>
            <h2 className="font-headline text-[1.75rem] font-bold tracking-tight text-white md:text-[2.25rem]">
              Launched Today
            </h2>
          </div>
          <Link
            href="/browse"
            className="text-sm transition-colors duration-150 hover:text-white font-mono"
            style={{ color: "#71717A" }}
          >
            All products →
          </Link>
        </div>

        {/* Ranked list */}
        <div className="flex flex-col gap-2">
          {entries.map((entry, idx) => {
            const priceLabel = formatPrice(entry.listing.price_cents, entry.listing.currency);
            return (
              <div
                key={entry.listing_id}
                className="flex items-center gap-4 rounded-xl px-5 py-4 card-glow"
                style={{
                  background: "#0A0A0A",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {/* Rank */}
                <span
                  className="w-5 shrink-0 text-right text-sm font-bold font-mono"
                  style={{
                    color: idx === 0 ? "#6366F1" : "rgba(255,255,255,0.15)",
                  }}
                >
                  {idx + 1}
                </span>

                {/* Thumbnail */}
                {entry.listing.thumbnail_url ? (
                  <div
                    className="h-10 w-10 shrink-0 rounded-lg overflow-hidden"
                    style={{ border: "1px solid rgba(255,255,255,0.07)" }}
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
                      background: "rgba(99,102,241,0.08)",
                      border: "1px solid rgba(99,102,241,0.20)",
                    }}
                  >
                    <span className="text-[10px] font-bold font-mono" style={{ color: "rgba(99,102,241,0.6)" }}>
                      {entry.listing.title.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Title + tagline */}
                <Link href={`/listing/${entry.listing.slug}`} className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-semibold transition-colors duration-150 hover:text-[#818CF8]"
                    style={{ color: "#FFFFFF" }}
                  >
                    {entry.listing.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs" style={{ color: "#3F3F46" }}>
                    {entry.listing.tagline}
                  </p>
                </Link>

                {/* Price */}
                <span
                  className="hidden shrink-0 text-xs sm:block font-mono"
                  style={{ color: "#71717A" }}
                >
                  {entry.listing.price_type === "free" ? "Free" : priceLabel}
                </span>

                {/* Upvote */}
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

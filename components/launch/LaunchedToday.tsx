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
    <section className="bg-[#F5F3F0]" style={{ borderBottom: "0.5px solid rgba(15,15,15,0.09)" }}>
      <div className="container py-16 md:py-20">

        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              {/* Live indicator — ink dot, no glow */}
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "#C05A44" }}
              />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B6860]">
                Live today
              </p>
            </div>
            <h2 className="font-headline text-[1.75rem] font-bold tracking-tight text-[#0F0F0F] md:text-[2.25rem]">
              Launched Today
            </h2>
          </div>
          <Link
            href="/browse"
            className="text-sm text-[#6B6860] transition-colors duration-150 hover:text-[#0F0F0F]"
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
                className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 transition-all duration-150 hover:shadow-card"
                style={{ border: "0.5px solid rgba(15,15,15,0.09)" }}
              >
                {/* Rank */}
                <span
                  className="w-5 shrink-0 text-right text-sm font-bold"
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    color: idx === 0 ? "#C05A44" : "rgba(15,15,15,0.25)",
                  }}
                >
                  {idx + 1}
                </span>

                {/* Thumbnail */}
                {entry.listing.thumbnail_url ? (
                  <div
                    className="h-10 w-10 shrink-0 rounded-lg overflow-hidden"
                    style={{ border: "0.5px solid rgba(15,15,15,0.09)" }}
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
                      background: "rgba(192,90,68,0.06)",
                      border: "0.5px solid rgba(192,90,68,0.15)",
                    }}
                  >
                    <span className="text-[10px] font-bold text-[#C05A44]/50">
                      {entry.listing.title.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Title + tagline */}
                <Link href={`/listing/${entry.listing.slug}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#0F0F0F] transition-colors duration-150 hover:text-[#C05A44]">
                    {entry.listing.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#9B9690]">
                    {entry.listing.tagline}
                  </p>
                </Link>

                {/* Price */}
                <span className="hidden shrink-0 text-xs text-[#6B6860] sm:block">
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

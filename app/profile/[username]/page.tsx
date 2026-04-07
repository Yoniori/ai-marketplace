import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Globe, Github, Twitter, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listing/ListingCard";
import { getInitials, formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import type { Tables } from "@/types/supabase";

type PublicProfile = Pick<
  Tables<"profiles">,
  | "id" | "username" | "display_name" | "bio" | "avatar_url"
  | "website_url" | "twitter_url" | "github_url" | "role" | "created_at"
>;

interface Props {
  params: { username: string };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("profiles")
    .select("display_name, username, bio")
    .eq("username", params.username)
    .single();
  const profile = data as Pick<PublicProfile, "display_name" | "username" | "bio"> | null;

  if (!profile) return { title: "Profile not found" };

  const name = profile.display_name ?? `@${profile.username}`;
  return {
    title: `${name} — Vibe Code Market`,
    description: profile.bio ?? `${name}'s profile on Vibe Code Market.`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicProfilePage({ params }: Props) {
  const supabase = await createClient();

  // Fetch the public profile (cast to typed shape due to SDK/type mismatch)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawProfile } = await (supabase as any)
    .from("profiles")
    .select(
      "id, username, display_name, bio, avatar_url, website_url, twitter_url, github_url, role, created_at"
    )
    .eq("username", params.username)
    .single();

  const profile = rawProfile as PublicProfile | null;
  if (!profile) notFound();

  // Check if viewer is the profile owner
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.id === profile.id;

  // Fetch published listings for this creator
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listingsData } = await (supabase as any)
    .from("listings")
    .select(
      "id, slug, title, tagline, price_type, price_cents, currency, thumbnail_url, review_count, avg_rating, purchase_count, categories ( name )"
    )
    .eq("creator_id", profile.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(24);

  const listings = (listingsData ?? []) as Array<{
    id: string; slug: string; title: string; tagline: string;
    price_type: "free" | "paid" | "contact"; price_cents: number; currency: string;
    thumbnail_url: string | null; review_count: number; avg_rating: number;
    purchase_count: number; categories: { name: string } | null;
  }>;

  const displayName = profile.display_name ?? `@${profile.username}`;
  const initials    = getInitials(displayName);
  const joinedDate  = formatDate(profile.created_at);

  const links = [
    profile.website_url && { href: profile.website_url, icon: Globe,   label: "Website" },
    profile.twitter_url && { href: profile.twitter_url, icon: Twitter,  label: "Twitter" },
    profile.github_url  && { href: profile.github_url,  icon: Github,   label: "GitHub"  },
  ].filter(Boolean) as { href: string; icon: React.ElementType; label: string }[];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Narrow top bar ── */}
      <header className="border-b border-border">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold">
            <span className="font-mono text-xs font-bold text-primary select-none leading-none">▸</span>
            <span>Vibe Code Market</span>
          </Link>
          {isOwner ? (
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
              Edit profile
            </Link>
          ) : (
            <Link href="/browse" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Browse products
            </Link>
          )}
        </div>
      </header>

      <main className="container py-16 md:py-24">
        <div className="max-w-2xl">

          {/* ── Avatar + name ── */}
          <div className="flex items-start gap-5">
            <span className="relative flex h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-primary/10 text-xl font-semibold text-primary">
                  {initials}
                </span>
              )}
            </span>

            <div className="pt-1">
              <h1 className="text-2xl font-semibold tracking-tight">{displayName}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">@{profile.username}</p>

              <div className="mt-2 flex items-center gap-3">
                {profile.role === "creator" && (
                  <span className="inline-flex h-5 items-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
                    Creator
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  Member since {joinedDate}
                </span>
              </div>
            </div>
          </div>

          {/* ── Bio ── */}
          {profile.bio && (
            <p className="mt-7 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          )}

          {/* ── Social links ── */}
          {links.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              {links.map(({ href, icon: Icon, label }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </a>
              ))}
            </div>
          )}

          {/* ── Divider ── */}
          <div className="mt-10 border-t border-border" />

          {/* ── Listings ── */}
          <div className="mt-10">
            <p className="overline mb-5">
              Products
              {listings.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({listings.length})
                </span>
              )}
            </p>
            {listings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-14 text-center">
                <p className="text-sm font-medium">No products yet.</p>
                {isOwner ? (
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    <Link href="/dashboard/listings/new" className="text-primary hover:underline">
                      Publish your first product
                    </Link>{" "}
                    to showcase it here.
                  </p>
                ) : (
                  <p className="mt-1.5 text-sm text-muted-foreground">Check back later.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    slug={listing.slug}
                    title={listing.title}
                    tagline={listing.tagline}
                    price_type={listing.price_type}
                    price_cents={listing.price_cents}
                    currency={listing.currency}
                    thumbnail_url={listing.thumbnail_url}
                    review_count={listing.review_count}
                    avg_rating={Number(listing.avg_rating)}
                    purchase_count={listing.purchase_count}
                    category={listing.categories?.name}
                    creator_display_name={displayName}
                    creator_username={profile.username}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

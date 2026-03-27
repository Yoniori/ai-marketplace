import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { ListingCheckCard } from "@/components/listing-check/ListingCheckCard";

/**
 * /dashboard/listings/[id] — Listing detail page for creators.
 *
 * Shows listing metadata and the AI quality check panel.
 * The check card handles all check state client-side.
 *
 * Edit functionality is tracked as a future step (Step 5).
 */

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) redirect("/login");

  // Use admin client to read draft listings + new columns.
  // Falls back to user client if SUPABASE_SERVICE_ROLE_KEY is absent.
  let adminClient: Awaited<ReturnType<typeof createAdminClient>>;
  try {
    adminClient = await createAdminClient();
  } catch {
    adminClient = userClient as unknown as Awaited<ReturnType<typeof createAdminClient>>;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminClient as any;

  const { data: listing, error } = await db
    .from("listings")
    .select(
      `
      id,
      creator_id,
      title,
      tagline,
      description,
      status,
      review_status,
      price_type,
      price_cents,
      demo_url,
      files_path,
      created_at,
      updated_at,
      categories ( name )
    `
    )
    .eq("id", id)
    .single();

  if (error || !listing) notFound();

  // Ownership guard
  if (listing.creator_id !== user.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (userClient as any)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") redirect("/dashboard/listings");
  }

  const priceLabel =
    listing.price_type === "paid"
      ? `$${(listing.price_cents / 100).toFixed(2)} USD`
      : listing.price_type === "free"
      ? "Free"
      : "Contact seller";

  return (
    <div className="space-y-8 max-w-2xl">

      {/* ── Back link ── */}
      <div>
        <Link
          href="/dashboard/listings"
          className="inline-flex items-center gap-1.5 font-mono text-xs text-white/30 transition-colors hover:text-white/60"
        >
          <ArrowLeft className="h-3 w-3" />
          All listings
        </Link>
      </div>

      {/* ── Listing header ── */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25 mb-1.5">
              {(listing.categories as { name: string } | null)?.name ?? "Uncategorized"}
            </p>
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-white">
              {listing.title}
            </h1>
            {listing.tagline && (
              <p className="mt-2 text-sm text-white/50">{listing.tagline}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <span
              className={`inline-block rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider ${
                listing.status === "published"
                  ? "border-emerald-500/20 text-emerald-400/70"
                  : listing.status === "archived"
                  ? "border-white/[0.06] text-white/20"
                  : "border-white/[0.08] text-white/30"
              }`}
            >
              {listing.status}
            </span>
          </div>
        </div>
      </div>

      {/* ── Listing meta ── */}
      <div className="grid grid-cols-2 gap-px bg-white/[0.05] sm:grid-cols-4">
        {[
          { label: "Price",   value: priceLabel },
          { label: "Created", value: formatDate(listing.created_at) },
          { label: "Updated", value: formatDate(listing.updated_at) },
          {
            label: "Files",
            value: listing.files_path ? "Uploaded" : "None",
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#0a0a0a] px-4 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/25">
              {label}
            </p>
            <p className="mt-1 font-mono text-sm text-white/60">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Description preview ── */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-5">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">
          Description
        </p>
        <p className="text-sm leading-relaxed text-white/50 line-clamp-6">
          {listing.description}
        </p>
      </div>

      {/* ── Demo link ── */}
      {listing.demo_url && (
        <a
          href={listing.demo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-mono text-xs text-white/30 transition-colors hover:text-white/60"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View demo
        </a>
      )}

      {/* ── AI Quality Check ── */}
      <div className="space-y-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25 mb-0.5">
            Quality
          </p>
          <p className="text-xs text-white/30">
            Run a check before requesting to publish. Results are for your eyes only.
          </p>
        </div>
        <ListingCheckCard listingId={id} />
      </div>

    </div>
  );
}

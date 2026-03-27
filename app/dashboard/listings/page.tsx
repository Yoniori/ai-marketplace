import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Package, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

/**
 * /dashboard/listings — Creator listings index.
 * Lists all the creator's listings with status, review_status, and actions.
 */

// ── Review status badge ───────────────────────────────────────

function ReviewBadge({ status }: { status: string | null }) {
  if (!status) return null;
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white/30">
        <Clock className="h-2.5 w-2.5" />
        Checking
      </span>
    );
  }
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald-400">
        <CheckCircle className="h-2.5 w-2.5" />
        Ready
      </span>
    );
  }
  if (status === "needs_revision") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-400">
        <AlertTriangle className="h-2.5 w-2.5" />
        Revision
      </span>
    );
  }
  if (status === "flagged") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/[0.08] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-red-400">
        <XCircle className="h-2.5 w-2.5" />
        Flagged
      </span>
    );
  }
  return null;
}

export default async function ListingsPage() {
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) redirect("/login");

  // Verify creator role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (userClient as any)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "creator" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  // Fetch listings using admin client so we can read all statuses
  // and the new review_status column (added in 011_listing_checks.sql).
  // Wrapped in try/catch: createAdminClient() throws if SUPABASE_SERVICE_ROLE_KEY
  // is absent, which would otherwise crash the server component.
  let db: Awaited<ReturnType<typeof createAdminClient>>;
  try {
    db = await createAdminClient();
  } catch {
    // Service key unavailable — fall back to user client.
    // The user can only see their own listings through RLS.
    db = userClient as unknown as Awaited<ReturnType<typeof createAdminClient>>;
  }

  const { data: listings } = await (db as any)
    .from("listings")
    .select(
      `
      id,
      title,
      status,
      review_status,
      price_type,
      price_cents,
      created_at,
      categories ( name )
    `
    )
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  const rows = (listings ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    review_status: string | null;
    price_type: string;
    price_cents: number;
    created_at: string;
    categories: { name: string } | null;
  }>;

  return (
    <div className="space-y-8 max-w-3xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25 mb-1.5">
            Dashboard
          </p>
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-white">
            Listings
          </h1>
        </div>
        <Link
          href="/dashboard/listings/new"
          className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/[0.08] px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
        >
          <Plus className="h-4 w-4" />
          New listing
        </Link>
      </div>

      {/* ── Empty state ── */}
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.01] py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/25">
            <Package className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-white/50">No listings yet</p>
          <p className="mt-1 font-mono text-xs text-white/25">
            Create your first listing to start selling.
          </p>
          <Link
            href="/dashboard/listings/new"
            className="mt-5 inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/[0.07] px-4 py-2 text-sm font-medium text-primary/80 transition-colors hover:bg-primary/12 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            Create listing
          </Link>
        </div>
      )}

      {/* ── Listings list ── */}
      {rows.length > 0 && (
        <div className="divide-y divide-white/[0.04] rounded-lg border border-white/[0.06] bg-white/[0.01]">
          {rows.map((listing) => {
            const priceLabel =
              listing.price_type === "paid"
                ? `$${(listing.price_cents / 100).toFixed(2)}`
                : listing.price_type === "free"
                ? "Free"
                : "Contact";

            return (
              <Link
                key={listing.id}
                href={`/dashboard/listings/${listing.id}`}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]"
              >
                {/* Icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.03] text-white/30 transition-colors group-hover:border-white/[0.12] group-hover:text-white/50">
                  <Package className="h-4 w-4" />
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                    {listing.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {listing.categories?.name && (
                      <span className="font-mono text-[10px] text-white/25">
                        {listing.categories.name}
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-white/20">
                      {formatDate(listing.created_at)}
                    </span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <ReviewBadge status={listing.review_status} />
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                      listing.status === "published"
                        ? "border-emerald-500/20 text-emerald-400/70"
                        : listing.status === "archived"
                        ? "border-white/[0.06] text-white/20"
                        : "border-white/[0.08] text-white/30"
                    }`}
                  >
                    {listing.status}
                  </span>
                  <span className="font-mono text-xs text-white/30">
                    {priceLabel}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
}

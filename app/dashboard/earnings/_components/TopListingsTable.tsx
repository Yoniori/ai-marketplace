import Link from "next/link";
import type { TopListing } from "@/lib/analytics";
import { formatPrice } from "@/lib/utils";

interface TopListingsTableProps {
  listings: TopListing[];
}

export function TopListingsTable({ listings }: TopListingsTableProps) {
  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No listings yet. Publish your first product to see stats here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Top Listings
        </p>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-5 py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Title
            </th>
            <th className="px-5 py-2.5 text-right font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Sales
            </th>
            <th className="px-5 py-2.5 text-right font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Views
            </th>
            <th className="px-5 py-2.5 text-right font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Revenue
            </th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing, i) => (
            <tr
              key={listing.id}
              className={
                i < listings.length - 1 ? "border-b border-border" : ""
              }
            >
              <td className="px-5 py-3">
                <Link
                  href={`/dashboard/listings/${listing.id}`}
                  className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                >
                  {listing.title}
                </Link>
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-foreground">
                {listing.sales}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                {listing.views}
              </td>
              <td className="px-5 py-3 text-right tabular-nums font-medium text-foreground">
                {formatPrice(listing.revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

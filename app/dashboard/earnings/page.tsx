import { DollarSign, ShoppingBag, Eye, Star } from "lucide-react";
import { getCreatorAnalytics } from "@/lib/analytics";
import { KpiCard } from "./_components/KpiCard";
import { RevenueChart } from "./_components/RevenueChart";
import { TopListingsTable } from "./_components/TopListingsTable";

function formatRevenue(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default async function EarningsPage() {
  const analytics = await getCreatorAnalytics();

  const data = analytics ?? {
    totalRevenueCents: 0,
    totalSales: 0,
    totalViews: 0,
    avgRatingWeighted: 0,
    dailyRevenue: [],
    topListings: [],
  };

  const avgRating =
    data.avgRatingWeighted > 0 ? data.avgRatingWeighted.toFixed(1) : "—";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
          Dashboard
        </p>
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">
          Earnings
        </h1>
        <p className="mt-1.5 font-mono text-xs text-muted-foreground">
          Creator analytics — last 30 days
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={formatRevenue(data.totalRevenueCents)}
          sub="after platform fee"
          icon={DollarSign}
        />
        <KpiCard
          label="Total Sales"
          value={String(data.totalSales)}
          sub={data.totalSales === 1 ? "purchase" : "purchases"}
          icon={ShoppingBag}
        />
        <KpiCard
          label="Total Views"
          value={String(data.totalViews)}
          sub="listing page views"
          icon={Eye}
        />
        <KpiCard
          label="Avg Rating"
          value={avgRating}
          sub="across all listings"
          icon={Star}
        />
      </div>

      {/* Revenue Chart */}
      {data.dailyRevenue.length > 0 && (
        <RevenueChart data={data.dailyRevenue} />
      )}

      {/* Top Listings */}
      <TopListingsTable listings={data.topListings} />
    </div>
  );
}

import { ShoppingBag } from "lucide-react";

export const metadata = {
  title: "Purchases — Vibe Code Market",
};

/**
 * /dashboard/purchases — stub page.
 *
 * Shows a placeholder until real purchase history is implemented.
 * The route must exist to avoid the 404 produced by the nav link
 * and the "My purchases" quick-action on the dashboard overview.
 */
export default function PurchasesPage() {
  return (
    <div className="max-w-2xl space-y-8">

      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25 mb-2">
          Purchases
        </p>
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-white">
          My purchases
        </h1>
        <p className="mt-1.5 font-mono text-xs text-white/30">
          Products you&apos;ve bought on Vibe Code Market
        </p>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] mb-4">
          <ShoppingBag className="h-5 w-5 text-white/30" />
        </div>
        <p className="text-sm font-medium text-white/50">No purchases yet</p>
        <p className="mt-1 font-mono text-xs text-white/25">
          Products you buy will appear here
        </p>
      </div>

    </div>
  );
}

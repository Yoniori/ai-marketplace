import { ShieldCheck } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
          Dashboard
        </p>
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">
          Admin
        </h1>
        <p className="mt-1.5 font-mono text-xs text-muted-foreground">
          Platform management and moderation tools will appear here.
        </p>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/30 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background mb-4">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Admin panel</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          This section is under construction.
        </p>
      </div>
    </div>
  );
}

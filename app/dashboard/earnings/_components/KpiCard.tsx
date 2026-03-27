import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
}

export function KpiCard({ label, value, sub, icon: Icon }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      {sub && (
        <p className="mt-1 font-mono text-xs text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

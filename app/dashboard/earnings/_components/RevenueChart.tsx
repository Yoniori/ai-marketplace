"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailyRevenue } from "@/lib/analytics";

interface RevenueChartProps {
  data: DailyRevenue[];
}

function shortDate(label: unknown): string {
  // "2025-03-15" → "Mar 15"
  const dateStr = String(label ?? "");
  const [, month, day] = dateStr.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (isNaN(m) || isNaN(d)) return dateStr;
  return `${months[m - 1]} ${d}`;
}

function formatTooltipValue(value: number): string {
  return `$${(value / 100).toFixed(2)}`;
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Show every 5th label so the axis isn't crowded
  const tickIndices = new Set([0, 6, 13, 20, 27, data.length - 1]);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Revenue — last 30 days
        </p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.25} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v, i) => (tickIndices.has(i) ? shortDate(v) : "")}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `$${(v / 100).toFixed(0)}`}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: unknown) => [formatTooltipValue(Number(value ?? 0)), "Revenue"]}
            labelFormatter={shortDate}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
              color: "hsl(var(--foreground))",
            }}
            cursor={{ stroke: "hsl(var(--border))" }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            fill="url(#revenueGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

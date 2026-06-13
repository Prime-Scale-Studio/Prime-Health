"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipProps,
} from "recharts";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  date: string;  // "YYYY-MM-DD"
  count: number;
}

interface AppointmentChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const count = payload[0]?.value ?? 0;

  let formattedDate = label;
  try {
    formattedDate = format(parseISO(label), "EEEE, MMM d");
  } catch { /* noop */ }

  return (
    <div className="rounded-xl border border-border bg-card shadow-lg px-4 py-3 space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground">{formattedDate}</p>
      <p className="text-2xl font-bold text-foreground">
        {count}
        <span className="text-sm font-medium text-muted-foreground ml-1">
          appointment{count !== 1 ? "s" : ""}
        </span>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function AppointmentChart({ data, loading, className }: AppointmentChartProps) {
  const gradientId = "appointmentGradient";

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const avg   = data.length > 0 ? Math.round(total / data.length) : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-foreground">Appointment Trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 30 days · {total} total</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full px-2.5 py-1">
          <TrendingUp className="h-3 w-3" />
          {avg}/day avg
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="hsl(var(--primary))" stopOpacity={0.25} />
              <stop offset="80%"  stopColor="hsl(var(--primary))" stopOpacity={0.04} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tickFormatter={(v) => {
              try { return format(parseISO(v), "MMM d"); } catch { return v; }
            }}
          />

          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1.5, strokeDasharray: "4 2" }} />

          <Area
            type="monotone"
            dataKey="count"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  type TooltipProps,
} from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/types/supabase";

type Status = Database["public"]["Enums"]["appointment_status"];

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending",   color: "#f59e0b", bg: "bg-amber-500"   },
  confirmed: { label: "Confirmed", color: "#3b82f6", bg: "bg-blue-500"    },
  completed: { label: "Completed", color: "#10b981", bg: "bg-emerald-500" },
  cancelled: { label: "Cancelled", color: "#94a3b8", bg: "bg-slate-400"   },
  no_show:   { label: "No-show",   color: "#ef4444", bg: "bg-red-500"     },
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface StatusCount {
  status: Status;
  count: number;
}

interface StatusDistributionProps {
  data: StatusCount[];
  loading?: boolean;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const status = entry?.payload?.status as Status;
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="rounded-xl border border-border bg-card shadow-lg px-4 py-2.5 space-y-0.5">
      <p className="text-xs font-semibold text-muted-foreground">{cfg?.label}</p>
      <p className="text-xl font-bold text-foreground">{entry?.value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function StatusDistribution({ data, loading, className }: StatusDistributionProps) {
  const total = data.reduce((s, d) => s + d.count, 0);

  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({ ...d, color: STATUS_CONFIG[d.status].color }));

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="flex gap-6">
          <Skeleton className="h-48 w-48 rounded-full" />
          <div className="flex-1 space-y-2.5 pt-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-5 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-48 text-center space-y-2", className)}>
        <p className="text-muted-foreground text-sm font-medium">No appointment data yet</p>
        <p className="text-xs text-muted-foreground">Data will appear once appointments are created</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div>
        <h3 className="font-bold text-foreground">Status Breakdown</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{total} total appointments</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Donut */}
        <div className="relative shrink-0">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={74}
                dataKey="count"
                strokeWidth={2}
                stroke="hsl(var(--background))"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.status} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-foreground">{total}</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-2.5">
          {(Object.keys(STATUS_CONFIG) as Status[]).map((status) => {
            const entry = data.find((d) => d.status === status);
            const count = entry?.count ?? 0;
            const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
            const cfg   = STATUS_CONFIG[status];

            return (
              <div key={status} className="flex items-center gap-3">
                <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", cfg.bg)} />
                <span className="text-sm text-foreground/80 flex-1 font-medium">{cfg.label}</span>
                <span className="text-sm font-bold text-foreground">{count}</span>
                <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Count-up animation hook
// ─────────────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1.2) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) =>
    Number.isInteger(target) ? Math.round(v) : v.toFixed(1)
  );

  useEffect(() => {
    const controls = animate(count, target, {
      duration,
      ease: "easeOut",
    });
    return controls.stop;
  }, [target, duration, count]);

  return rounded;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;          // e.g. "%" or " visits"
  prefix?: string;          // e.g. "₹"
  change?: number;          // percentage change — positive or negative
  changeLabel?: string;     // e.g. "vs yesterday"
  icon: React.ReactNode;
  iconColor?: string;       // Tailwind bg class e.g. "bg-blue-500/10"
  iconTextColor?: string;   // Tailwind text class e.g. "text-blue-600"
  loading?: boolean;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="h-11 w-11 rounded-xl bg-muted" />
      </div>
      <div className="h-9 w-24 rounded bg-muted" />
      <div className="h-3 w-36 rounded bg-muted" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  suffix,
  prefix,
  change,
  changeLabel = "vs last period",
  icon,
  iconColor = "bg-primary/10",
  iconTextColor = "text-primary",
  loading,
  className,
}: StatCardProps) {
  const animated = useCountUp(value);

  if (loading) return <StatCardSkeleton />;

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral  = change !== undefined && change === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative rounded-2xl border border-border bg-card p-6",
        "shadow-[0_1px_4px_hsl(var(--foreground)/0.04),0_4px_16px_hsl(var(--foreground)/0.04)]",
        "hover:-translate-y-0.5 hover:shadow-[0_4px_24px_hsl(var(--foreground)/0.08)]",
        "transition-all duration-200 overflow-hidden",
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative space-y-4">
        {/* Label + Icon */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-muted-foreground tracking-wide">
            {label}
          </p>
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl shrink-0",
              "transition-transform duration-200 group-hover:scale-110",
              iconColor
            )}
          >
            <span className={cn("h-5 w-5 [&>svg]:h-5 [&>svg]:w-5", iconTextColor)}>
              {icon}
            </span>
          </div>
        </div>

        {/* Animated value */}
        <div className="flex items-baseline gap-1">
          {prefix && (
            <span className="text-xl font-bold text-foreground/70">{prefix}</span>
          )}
          <motion.span className="text-4xl font-extrabold tracking-tight text-foreground">
            {animated as any}
          </motion.span>
          {suffix && (
            <span className="text-xl font-bold text-foreground/70">{suffix}</span>
          )}
        </div>

        {/* Change badge */}
        {change !== undefined && (
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                isPositive && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                isNegative && "bg-destructive/10 text-destructive",
                isNeutral  && "bg-muted text-muted-foreground"
              )}
            >
              {isPositive && <TrendingUp className="h-3 w-3" />}
              {isNegative && <TrendingDown className="h-3 w-3" />}
              {isNeutral  && <Minus className="h-3 w-3" />}
              {isPositive ? "+" : ""}{change}%
            </span>
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
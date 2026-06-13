import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Badge variants
// ─────────────────────────────────────────────

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5",
    "text-xs font-semibold tracking-wide leading-none",
    "border transition-colors select-none whitespace-nowrap",
  ],
  {
    variants: {
      variant: {
        // Generic
        default:
          "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:border-primary/30",
        secondary:
          "bg-secondary text-secondary-foreground border-secondary-foreground/10",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:border-destructive/30",
        outline:
          "bg-transparent text-foreground border-border",
        success:
          "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/25 dark:text-green-400 dark:border-green-800/50",
        warning:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-400 dark:border-amber-800/50",
        info:
          "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/25 dark:text-sky-400 dark:border-sky-800/50",
        // ── Appointment status variants ──────────────────
        pending:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-400 dark:border-amber-800/50",
        confirmed:
          "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/25 dark:text-blue-400 dark:border-blue-800/50",
        completed:
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-400 dark:border-emerald-800/50",
        cancelled:
          "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
        no_show:
          "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/25 dark:text-red-400 dark:border-red-800/50",
      },
      dot: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      dot: false,
    },
  }
);

// Dot colour map
const dotColourMap: Record<string, string> = {
  default:    "bg-primary",
  secondary:  "bg-secondary-foreground",
  destructive:"bg-destructive",
  outline:    "bg-foreground",
  success:    "bg-emerald-500",
  warning:    "bg-amber-500",
  info:       "bg-sky-500",
  pending:    "bg-amber-500",
  confirmed:  "bg-blue-500",
  completed:  "bg-emerald-500",
  cancelled:  "bg-slate-400",
  no_show:    "bg-red-500",
};

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  const resolvedVariant = (variant ?? "default") as string;

  return (
    <span
      className={cn(badgeVariants({ variant, dot }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full shrink-0",
            dotColourMap[resolvedVariant] ?? "bg-foreground"
          )}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };

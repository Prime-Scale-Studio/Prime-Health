import * as React from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Progress — animated fill bar
// ─────────────────────────────────────────────

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;         // 0–100
  max?: number;
  variant?: "default" | "success" | "warning" | "danger";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

const variantMap = {
  default: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger:  "bg-destructive",
};

const sizeMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      variant = "default",
      showLabel = false,
      size = "md",
      animated = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
      <div className={cn("w-full space-y-1", className)}>
        {showLabel && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-semibold text-foreground">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          ref={ref}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          className={cn(
            "relative w-full overflow-hidden rounded-full bg-secondary",
            sizeMap[size]
          )}
          {...props}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              variantMap[variant],
              animated && "animate-pulse"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);
Progress.displayName = "Progress";

// ─────────────────────────────────────────────
// CircleProgress — SVG circular progress
// ─────────────────────────────────────────────

function CircleProgress({
  value = 0,
  size = 48,
  strokeWidth = 5,
  className,
  variant = "default",
}: {
  value?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  variant?: ProgressProps["variant"];
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const colourMap = {
    default: "stroke-primary",
    success: "stroke-emerald-500",
    warning: "stroke-amber-500",
    danger:  "stroke-destructive",
  };

  return (
    <svg
      width={size}
      height={size}
      className={cn("rotate-[-90deg]", className)}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-secondary"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={cn("transition-all duration-700 ease-out", colourMap[variant ?? "default"])}
      />
    </svg>
  );
}

export { Progress, CircleProgress };

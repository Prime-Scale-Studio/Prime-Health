import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Skeleton — shimmer loading placeholder
// ─────────────────────────────────────────────

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r",
        "before:from-transparent before:via-muted-foreground/10 before:to-transparent",
        "before:-translate-x-full before:animate-[shimmer_1.6s_ease-in-out_infinite]",
        className
      )}
      aria-hidden
      {...props}
    />
  );
}

// ─────────────────────────────────────────────
// SkeletonText — paragraph-like skeleton
// ─────────────────────────────────────────────

function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// SkeletonCard — full card skeleton
// ─────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCard };

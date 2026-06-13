import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-border p-12 text-center flex flex-col items-center justify-center bg-card/50", className)}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-5">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto mb-6">
        {description}
      </p>
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <Link href={actionHref}>
            <Button>
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button onClick={onAction}>
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}

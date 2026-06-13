"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// SlideOver — right-edge sliding panel
// ─────────────────────────────────────────────────────────────────────────────

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function SlideOver({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  className,
}: SlideOverProps) {
  // Body scroll lock
  React.useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // Escape key close
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-end",
        !open && "pointer-events-none"
      )}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={cn(
          "relative flex flex-col w-full h-full bg-card border-l border-border",
          "shadow-[-24px_0_64px_hsl(var(--foreground)/0.08)]",
          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open ? "translate-x-0" : "translate-x-full",
          sizeMap[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-border shrink-0">
          <div className="space-y-0.5 flex-1 min-w-0">
            {title && (
              <h2 className="text-xl font-bold text-foreground leading-tight truncate">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SlideOverSection — semantic section inside slide-over body
// ─────────────────────────────────────────────────────────────────────────────

export function SlideOverSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-5 border-b border-border last:border-0", className)}>
      {title && (
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

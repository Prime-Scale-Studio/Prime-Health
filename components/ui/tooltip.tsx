"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Tooltip — hover tooltip with smart positioning
// ─────────────────────────────────────────────

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  delayMs?: number;
  disabled?: boolean;
}

const sideClasses = {
  top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left:   "right-full top-1/2 -translate-y-1/2 mr-2",
  right:  "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowClasses = {
  top:    "absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground",
  bottom: "absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-foreground",
  left:   "absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-foreground",
  right:  "absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-foreground",
};

const Tooltip = ({
  content,
  children,
  side = "top",
  className,
  delayMs = 300,
  disabled,
}: TooltipProps) => {
  const [visible, setVisible] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (disabled) return;
    timerRef.current = setTimeout(() => setVisible(true), delayMs);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  // Clean up on unmount
  React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && !disabled && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-[200] pointer-events-none w-max max-w-[220px]",
            "rounded-lg bg-foreground px-2.5 py-1.5",
            "text-xs font-medium text-background leading-snug",
            "shadow-lg",
            "animate-in fade-in zoom-in-95 duration-100",
            sideClasses[side],
            className
          )}
        >
          {content}
          <div className={arrowClasses[side]} aria-hidden />
        </div>
      )}
    </div>
  );
};

export { Tooltip };

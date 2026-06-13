"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

// ─────────────────────────────────────────────
// Switch — accessible animated toggle
// ─────────────────────────────────────────────

export interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const switchSizeMap = {
  sm: {
    track: "h-5 w-9",
    thumb: "h-4 w-4",
    translate: "translate-x-4",
    icon: "h-2 w-2",
  },
  md: {
    track: "h-6 w-11",
    thumb: "h-5 w-5",
    translate: "translate-x-5",
    icon: "h-2.5 w-2.5",
  },
  lg: {
    track: "h-7 w-14",
    thumb: "h-6 w-6",
    translate: "translate-x-7",
    icon: "h-3 w-3",
  },
};

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked = false,
      onCheckedChange,
      disabled,
      id,
      label,
      description,
      size = "md",
      className,
    },
    ref
  ) => {
    const switchId = id ?? React.useId();
    const sizes = switchSizeMap[size];

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onCheckedChange?.(!checked);
      }
    };

    return (
      <div className={cn("flex items-center gap-3", className)}>
        <button
          ref={ref}
          id={switchId}
          role="switch"
          type="button"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onCheckedChange?.(!checked)}
          onKeyDown={handleKeyDown}
          className={cn(
            "relative inline-flex shrink-0 cursor-pointer rounded-full",
            "border-2 border-transparent outline-none",
            "transition-all duration-200 ease-in-out",
            "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-50",
            checked
              ? "bg-primary shadow-[0_2px_8px_hsl(var(--primary)/0.4)]"
              : "bg-muted hover:bg-muted-foreground/30",
            sizes.track
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-flex items-center justify-center rounded-full",
              "bg-white shadow-sm",
              "transition-transform duration-200 ease-in-out",
              "translate-x-0",
              sizes.thumb,
              checked && sizes.translate
            )}
          >
            {checked && (
              <Check
                className={cn("text-primary animate-in zoom-in-50 duration-100", sizes.icon)}
                strokeWidth={3}
              />
            )}
          </span>
        </button>

        {(label || description) && (
          <label htmlFor={switchId} className="cursor-pointer select-none">
            {label && (
              <p className="text-sm font-medium text-foreground leading-none">
                {label}
              </p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </label>
        )}
      </div>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({
  value: "",
  onValueChange: () => {},
});

// ─────────────────────────────────────────────
// Tabs root
// ─────────────────────────────────────────────

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  defaultValue?: string;
}

const Tabs = ({
  value,
  onValueChange,
  children,
  className,
  ...props
}: TabsProps) => (
  <TabsContext.Provider value={{ value, onValueChange }}>
    <div className={cn("w-full", className)} {...props}>
      {children}
    </div>
  </TabsContext.Provider>
);

// ─────────────────────────────────────────────
// TabsList — pill style container
// ─────────────────────────────────────────────

const TabsList = ({
  children,
  className,
  variant = "pill",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "pill" | "underline";
}) => (
  <div
    role="tablist"
    className={cn(
      variant === "pill"
        ? "inline-flex h-11 items-center justify-start rounded-xl bg-muted p-1 gap-0.5"
        : "flex items-center gap-0 border-b border-border",
      className
    )}
    data-variant={variant}
  >
    {children}
  </div>
);

// ─────────────────────────────────────────────
// TabsTrigger
// ─────────────────────────────────────────────

const TabsTrigger = ({
  value,
  children,
  className,
  icon,
  badge,
  disabled,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}) => {
  const { value: activeValue, onValueChange } = React.useContext(TabsContext);
  const isActive = activeValue === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "whitespace-nowrap rounded-lg px-3.5 py-2",
        "text-sm font-medium",
        "ring-offset-background transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-40",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-background/50",
        className
      )}
    >
      {icon && (
        <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      )}
      {children}
      {badge !== undefined && (
        <span
          className={cn(
            "ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1",
            "text-[10px] font-bold leading-none",
            isActive
              ? "bg-primary text-primary-foreground"
              : "bg-muted-foreground/20 text-muted-foreground"
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
};

// ─────────────────────────────────────────────
// TabsContent
// ─────────────────────────────────────────────

const TabsContent = ({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const { value: activeValue } = React.useContext(TabsContext);
  if (activeValue !== value) return null;

  return (
    <div
      role="tabpanel"
      tabIndex={0}
      className={cn(
        "mt-4 animate-fade-in",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };

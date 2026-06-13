"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// DropdownMenu — fully accessible state-driven menu
// ─────────────────────────────────────────────

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  open: false,
  setOpen: () => {},
});

// ── Root ─────────────────────────────────────

const DropdownMenu = ({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-flex">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

// ── Trigger ──────────────────────────────────

const DropdownMenuTrigger = ({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(!open);
        const originalOnClick = (children as React.ReactElement<React.HTMLAttributes<HTMLElement>>).props.onClick;
        if (originalOnClick) originalOnClick(e as React.MouseEvent<HTMLElement>);
      },
      "aria-expanded": open,
      "aria-haspopup": "menu",
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="menu"
      onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
    >
      {children}
    </button>
  );
};

// ── Content ───────────────────────────────────

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end" | "center";
  sideOffset?: number;
  minWidth?: string;
}

const DropdownMenuContent = ({
  children,
  className,
  align = "end",
  minWidth = "min-w-[180px]",
}: DropdownMenuContentProps) => {
  const { open } = React.useContext(DropdownMenuContext);
  if (!open) return null;

  const alignClass = {
    start: "left-0",
    end: "right-0",
    center: "left-1/2 -translate-x-1/2",
  }[align];

  return (
    <div
      role="menu"
      aria-orientation="vertical"
      className={cn(
        "absolute top-[calc(100%+6px)] z-50",
        "overflow-hidden rounded-xl border border-border",
        "bg-card text-card-foreground shadow-lg",
        "p-1.5 space-y-0.5",
        "animate-in fade-in zoom-in-95 duration-150",
        alignClass,
        minWidth,
        className
      )}
    >
      {children}
    </div>
  );
};

// ── Item ──────────────────────────────────────

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  destructive?: boolean;
  shortcut?: string;
}

const DropdownMenuItem = ({
  children,
  className,
  icon,
  destructive,
  shortcut,
  onClick,
  disabled,
  ...props
}: DropdownMenuItemProps) => {
  const { setOpen } = React.useContext(DropdownMenuContext);

  return (
    <button
      role="menuitem"
      type="button"
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2",
        "text-sm font-medium transition-colors duration-100",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-40",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    >
      {icon && (
        <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4 text-muted-foreground">
          {icon}
        </span>
      )}
      <span className="flex-1 text-left">{children}</span>
      {shortcut && (
        <kbd className="ml-auto text-xs text-muted-foreground font-mono">
          {shortcut}
        </kbd>
      )}
    </button>
  );
};

// ── Label ─────────────────────────────────────

const DropdownMenuLabel = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
      className
    )}
  >
    {children}
  </div>
);

// ── Separator ─────────────────────────────────

const DropdownMenuSeparator = ({ className }: { className?: string }) => (
  <div className={cn("my-1 h-px bg-border", className)} />
);

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};

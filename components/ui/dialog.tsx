"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

interface DialogContextValue {
  open: boolean;
  onClose: () => void;
}

const DialogContext = React.createContext<DialogContextValue>({
  open: false,
  onClose: () => {},
});

// ─────────────────────────────────────────────
// Dialog root
// ─────────────────────────────────────────────

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  const onClose = () => onOpenChange(false);

  // Lock body scroll
  React.useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <DialogContext.Provider value={{ open, onClose }}>
      {children}
    </DialogContext.Provider>,
    document.body
  );
};

// ─────────────────────────────────────────────
// DialogOverlay
// ─────────────────────────────────────────────

const DialogOverlay = ({ className }: { className?: string }) => {
  const { onClose } = React.useContext(DialogContext);
  return (
    <div
      className={cn(
        "fixed inset-0 z-40",
        "bg-black/40 backdrop-blur-[2px]",
        "animate-in fade-in duration-200",
        className
      )}
      onClick={onClose}
      aria-hidden
    />
  );
};

// ─────────────────────────────────────────────
// DialogContent
// ─────────────────────────────────────────────

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showClose?: boolean;
}

const sizeMap = {
  sm:   "max-w-sm",
  md:   "max-w-lg",
  lg:   "max-w-2xl",
  xl:   "max-w-4xl",
  full: "max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]",
};

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, size = "md", showClose = true, ...props }, ref) => {
    const { onClose } = React.useContext(DialogContext);

    return (
      <>
        <DialogOverlay />
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center sm:p-4",
            "pointer-events-none"
          )}
        >
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative w-full pointer-events-auto",
              "flex flex-col gap-0",
              "bg-card text-card-foreground",
              "shadow-[0_24px_64px_hsl(var(--foreground)/0.12)]",
              "animate-in fade-in zoom-in-95 sm:zoom-in-95 duration-200 ease-out",
              // Mobile styles: Full screen, no rounding
              "h-full sm:h-auto sm:max-h-[calc(100vh-2rem)] sm:rounded-2xl sm:border sm:border-border",
              sizeMap[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className={cn(
                  "absolute right-4 top-4 z-10",
                  "rounded-lg p-1.5",
                  "text-muted-foreground transition-all",
                  "hover:bg-muted hover:text-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                )}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {children}
          </div>
        </div>
      </>
    );
  }
);
DialogContent.displayName = "DialogContent";

// ─────────────────────────────────────────────
// DialogHeader / Footer / Title / Description
// ─────────────────────────────────────────────

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col gap-1.5 p-6 pb-0 pr-12", className)}
    {...props}
  />
);

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-3 p-6 pt-4 border-t border-border mt-4",
      className
    )}
    {...props}
  />
);

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-xl font-semibold tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground mt-1 leading-relaxed", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-6 py-4 flex-1 overflow-y-auto", className)} {...props} />
);

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
};

import * as React from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Card (container)
// ─────────────────────────────────────────────

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }
>(({ className, hover, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-border bg-card text-card-foreground",
      "shadow-[0_1px_4px_hsl(var(--foreground)/0.04),0_4px_16px_hsl(var(--foreground)/0.04)]",
      "overflow-hidden",
      hover &&
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_hsl(var(--foreground)/0.08)] cursor-pointer",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

// ─────────────────────────────────────────────
// CardHeader
// ─────────────────────────────────────────────

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1 p-6 pb-4",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

// ─────────────────────────────────────────────
// CardTitle
// ─────────────────────────────────────────────

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight text-foreground",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

// ─────────────────────────────────────────────
// CardDescription
// ─────────────────────────────────────────────

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

// ─────────────────────────────────────────────
// CardContent
// ─────────────────────────────────────────────

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// ─────────────────────────────────────────────
// CardFooter
// ─────────────────────────────────────────────

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0 gap-3",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// ─────────────────────────────────────────────
// CardSection — divider-separated sub-section inside card
// ─────────────────────────────────────────────

const CardSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-6 py-4 border-t border-border first:border-0",
      className
    )}
    {...props}
  />
));
CardSection.displayName = "CardSection";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardSection,
};

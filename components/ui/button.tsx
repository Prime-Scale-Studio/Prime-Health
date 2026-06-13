import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// ─────────────────────────────────────────────
// Variants
// ─────────────────────────────────────────────

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-xl text-sm font-semibold tracking-wide",
    "ring-offset-background transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.97] select-none",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-primary text-primary-foreground",
          "shadow-[0_1px_2px_hsl(var(--primary)/0.2),0_4px_12px_hsl(var(--primary)/0.18)]",
          "hover:brightness-110 hover:shadow-[0_4px_16px_hsl(var(--primary)/0.35)]",
        ],
        secondary: [
          "border border-border bg-background text-foreground",
          "hover:bg-muted hover:border-border/80",
          "shadow-sm",
        ],
        ghost: [
          "bg-transparent text-foreground",
          "hover:bg-accent hover:text-accent-foreground",
        ],
        danger: [
          "bg-destructive text-destructive-foreground",
          "shadow-[0_1px_2px_hsl(var(--destructive)/0.2),0_4px_12px_hsl(var(--destructive)/0.18)]",
          "hover:brightness-110 hover:shadow-[0_4px_16px_hsl(var(--destructive)/0.35)]",
        ],
        outline: [
          "border-2 border-primary/30 bg-transparent text-primary",
          "hover:bg-primary/8 hover:border-primary/50",
        ],
        link: [
          "text-primary underline-offset-4 hover:underline",
          "h-auto! px-0! py-0!",
        ],
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base rounded-xl",
        xl: "h-14 px-8 text-base rounded-2xl",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isLoading ?? disabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          leftIcon && (
            <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">
              {leftIcon}
            </span>
          )
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

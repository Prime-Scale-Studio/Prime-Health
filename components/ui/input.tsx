import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | boolean | null;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
  wrapperClassName?: string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      required,
      id,
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? React.useId();
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const hasError = Boolean(error);

    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}

        <div className="relative group">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground [&>svg]:h-4 [&>svg]:w-4 transition-colors group-focus-within:text-primary">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              // Layout
              "flex h-11 w-full rounded-xl",
              // Colours & borders
              "border border-input bg-background",
              "px-4 py-2.5 text-sm text-foreground",
              "placeholder:text-muted-foreground/60",
              // Shadow & inner shadow (Apple‑style depth)
              "shadow-sm inner-shadow",
              // Transitions
              "transition-all duration-150",
              // Focus
              "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
              // Hover
              "hover:border-border/80",
              // Disabled
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40",
              // File input
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              // Left icon padding
              leftIcon && "pl-10",
              // Right icon padding
              rightIcon && "pr-10",
              // Error state
              hasError &&
                "border-destructive/60 focus:ring-destructive/40 focus:border-destructive bg-destructive/5",
              className
            )}
            {...props}
          />

          {rightIcon && !hasError && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">
              {rightIcon}
            </div>
          )}

          {hasError && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-destructive">
              <AlertCircle className="h-4 w-4" />
            </div>
          )}
        </div>

        {hasError && typeof error === "string" && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-xs font-medium text-destructive pl-0.5 animate-fade-in"
          >
            {error}
          </p>
        )}
        {!hasError && helperText && (
          <p id={helperId} className="text-xs text-muted-foreground pl-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };

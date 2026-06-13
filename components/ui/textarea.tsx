import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | boolean | null;
  helperText?: string;
  required?: boolean;
  wrapperClassName?: string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      required,
      id,
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const textareaId = id ?? React.useId();
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const hasError = Boolean(error);

    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <Label htmlFor={textareaId} required={required}>
            {label}
          </Label>
        )}

        <div className="relative">
          <textarea
            id={textareaId}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              "flex min-h-[100px] w-full rounded-xl",
              "border border-input bg-background",
              "px-4 py-3 text-sm text-foreground",
              "placeholder:text-muted-foreground/60",
              "shadow-sm inner-shadow resize-y",
              "transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
              "hover:border-border/80",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40",
              hasError &&
                "border-destructive/60 focus:ring-destructive/40 focus:border-destructive bg-destructive/5",
              className
            )}
            {...props}
          />
          {hasError && (
            <div className="pointer-events-none absolute top-3 right-3 text-destructive">
              <AlertCircle className="h-4 w-4" />
            </div>
          )}
        </div>

        {hasError && typeof error === "string" && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-destructive pl-0.5 animate-fade-in"
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
Textarea.displayName = "Textarea";

export { Textarea };

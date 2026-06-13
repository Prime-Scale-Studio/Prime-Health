"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { ChevronDown, Check, AlertCircle } from "lucide-react";

// ─────────────────────────────────────────────
// Native select wrapper — consistent with Input/Textarea API
// ─────────────────────────────────────────────

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string | boolean | null;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  wrapperClassName?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options,
      placeholder,
      required,
      id,
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const selectId = id ?? React.useId();
    const errorId = `${selectId}-error`;
    const hasError = Boolean(error);

    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <Label htmlFor={selectId} required={required}>
            {label}
          </Label>
        )}

        <div className="relative group">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            className={cn(
              "flex h-11 w-full appearance-none rounded-xl",
              "border border-input bg-background",
              "px-4 py-2.5 pr-10 text-sm text-foreground",
              "shadow-sm inner-shadow",
              "transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
              "hover:border-border/80",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40",
              hasError &&
                "border-destructive/60 focus:ring-destructive/40 focus:border-destructive bg-destructive/5",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Chevron icon */}
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground group-focus-within:text-primary transition-colors">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>

        {hasError && typeof error === "string" && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-xs font-medium text-destructive pl-0.5 animate-fade-in"
          >
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error}
          </p>
        )}
        {!hasError && helperText && (
          <p className="text-xs text-muted-foreground pl-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

// ─────────────────────────────────────────────
// Custom Listbox — for cases needing full control
// ─────────────────────────────────────────────

export interface ListboxOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface ListboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ListboxOption[];
  label?: string;
  error?: string | null;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  wrapperClassName?: string;
}

function Listbox({
  value,
  onChange,
  options,
  label,
  error,
  placeholder = "Select an option",
  required,
  disabled,
  wrapperClassName,
}: ListboxProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listboxId = React.useId();
  const hasError = Boolean(error);

  const selected = options.find((o) => o.value === value);

  // Close on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown" && !open) setOpen(true);
  };

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      {label && (
        <Label required={required}>{label}</Label>
      )}

      <div ref={containerRef} className="relative">
        <button
          type="button"
          id={listboxId}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => setOpen((p) => !p)}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl",
            "border border-input bg-background",
            "px-4 py-2.5 text-sm",
            "shadow-sm inner-shadow",
            "transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary",
            "hover:border-border/80",
            "disabled:cursor-not-allowed disabled:opacity-50",
            open && "ring-2 ring-primary/40 border-primary",
            hasError && "border-destructive/60 focus:ring-destructive/40",
            !selected && "text-muted-foreground/60"
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selected?.icon}
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <ul
            role="listbox"
            aria-labelledby={listboxId}
            className={cn(
              "absolute z-50 mt-1.5 w-full overflow-hidden",
              "rounded-xl border border-border bg-card shadow-lg",
              "py-1.5",
              "animate-in fade-in zoom-in-95 duration-150"
            )}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onClick={() => {
                    if (!opt.disabled) {
                      onChange(opt.value);
                      setOpen(false);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg",
                    "text-sm cursor-pointer select-none",
                    "transition-colors duration-100",
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-accent",
                    opt.disabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {opt.icon && (
                    <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                      {opt.icon}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{opt.label}</p>
                    {opt.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {opt.description}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {hasError && error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-destructive pl-0.5 animate-fade-in">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export { Select, Listbox };

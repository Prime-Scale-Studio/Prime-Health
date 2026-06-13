"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, defaultChecked, onChange, onCheckedChange, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked || false);
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : internalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      onChange?.(e);
      onCheckedChange?.(newChecked);
    };

    return (
      <div className={cn("relative flex items-center justify-center h-5 w-5 shrink-0", className)}>
        <input
          type="checkbox"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          className={cn(
            "peer h-5 w-5 shrink-0 appearance-none rounded border-2 border-primary/50 bg-background ring-offset-background transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "checked:bg-primary checked:border-primary",
            "hover:border-primary cursor-pointer"
          )}
          {...props}
        />
        <Check 
          className={cn(
            "pointer-events-none absolute h-3.5 w-3.5 text-primary-foreground transition-opacity",
            isChecked ? "opacity-100" : "opacity-0"
          )} 
          strokeWidth={3} 
        />
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <button
        type="button"
        ref={ref}
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "h-4 w-4 shrink-0 rounded border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center",
          checked && "bg-primary text-primary-foreground",
          className
        )}
        {...props}
      >
        {checked && (
          <Check className="h-3 w-3" />
        )}
      </button>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };

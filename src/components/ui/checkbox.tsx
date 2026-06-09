// src/components/ui/checkbox.tsx
"use client";

import { forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: string | undefined;
  description?: string | undefined;
  error?: string | undefined;
};

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className={cn(
              "peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-300 bg-white",
              "checked:border-brand-600 checked:bg-brand-600",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500",
              className
            )}
            {...props}
          />
          <Check className="pointer-events-none absolute left-0.5 top-0.5 h-3 w-3 text-white opacity-0 peer-checked:opacity-100" />
        </div>
        {(label ?? description) && (
          <div>
            {label && (
              <label
                htmlFor={id}
                className="cursor-pointer text-sm font-medium text-slate-700"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-slate-500">{description}</p>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };

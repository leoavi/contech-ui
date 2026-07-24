import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Aplica borda/foco de erro (tom negative). */
  invalid?: boolean;
}

const baseClasses =
  "w-full rounded-lg border border-chumbo-100 bg-white px-3 py-2 text-sm text-chumbo-950 focus:border-bordo-700 focus:outline-none focus:ring-1 focus:ring-bordo-700/20 disabled:cursor-not-allowed disabled:opacity-60";

const invalidClasses =
  "border-negative focus:border-negative focus:ring-negative/20";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid = false, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(baseClasses, invalid && invalidClasses, className)}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = "Select";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

export type CardPadding = "none" | "sm" | "md";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Padding interno. Default `md`. */
  padding?: CardPadding;
  children?: ReactNode;
}

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
};

/**
 * Superfície padrão do app — o combo repetido em dezenas de telas:
 * `rounded-xl border border-chumbo-100 bg-white`
 * (`bg-white` é token Contech sobrescrito em contech.css, não branco literal).
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padding = "md", className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-chumbo-100 bg-white",
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";

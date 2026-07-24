import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Mostra spinner inline e desabilita o botão. */
  loading?: boolean;
  /**
   * Quando true, renderiza o único filho (ex.: `<Link>`) com as classes do botão
   * mescladas via `cn`. Não injeta spinner de loading no filho.
   */
  asChild?: boolean;
  children?: ReactNode;
}

const baseClasses =
  "inline-flex items-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-60";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-bordo-700 text-chumbo-950 hover:bg-bordo-600",
  secondary:
    "border border-chumbo-100 bg-transparent text-chumbo-700 hover:bg-chumbo-100/40",
  ghost: "bg-transparent text-chumbo-700 hover:bg-chumbo-100/40",
  danger: "bg-negative text-chumbo-950 hover:opacity-90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
};

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    asChild = false,
    className,
    disabled,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
  const isDisabled = Boolean(disabled || loading);

  if (asChild && isValidElement(children)) {
    const child = Children.only(children) as ReactElement<{
      className?: string;
    }>;
    return cloneElement(child, {
      className: cn(classes, child.props.className),
    });
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
});

Button.displayName = "Button";

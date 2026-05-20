import { cn } from "../lib/cn";

/**
 * Barra vertical bordô — assinatura visual da Contech.
 * Use à esquerda de headers de seção e títulos principais.
 *
 * Props:
 * - height: "sm" (h-6), "md" (h-8), "lg" (h-12), "full" (default)
 */
export function BordoBar({
  className,
  height = "full",
}: {
  className?: string;
  height?: "sm" | "md" | "lg" | "full";
}) {
  const heightClass =
    height === "sm" ? "h-6" : height === "md" ? "h-8" : height === "lg" ? "h-12" : "h-full";
  return <div className={cn("w-[3px] bg-bordo-700", heightClass, className)} aria-hidden />;
}

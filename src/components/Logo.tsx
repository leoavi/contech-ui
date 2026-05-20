import { cn } from "../lib/cn";

/**
 * Logotipo Contech — barra vertical bordô + nome em chumbo.
 * Construído em SVG/CSS para escalar sem perder peso visual.
 *
 * Movido do ContransBI em 2026-05-20 — o BI era o canon visual.
 */
export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const fontSize = size === "sm" ? "text-base" : size === "lg" ? "text-3xl" : "text-xl";
  const barW = size === "sm" ? "w-[2px]" : size === "lg" ? "w-[4px]" : "w-[3px]";
  const barH = size === "sm" ? "h-5" : size === "lg" ? "h-10" : "h-7";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 font-display font-extrabold tracking-tight",
        className,
      )}
    >
      <div className={cn(barW, barH, "bg-bordo-700")} aria-hidden />
      <span className={cn(fontSize, "leading-none text-chumbo-950")}>CONTECH</span>
    </div>
  );
}

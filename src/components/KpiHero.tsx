import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface KpiHeroProps {
  label: string;
  value: string;
  context?: string;
  delta?: { label: string; sign: "up" | "down" | "flat"; tone?: "good" | "bad" | "neutral" };
  accent?: ReactNode;
}

export function KpiHero({ label, value, context, delta, accent }: KpiHeroProps) {
  return (
    <div className="relative flex flex-col gap-3 overflow-hidden rounded-lg border border-chumbo-100 bg-white p-6">
      <div className="absolute left-0 top-0 h-full w-1 bg-bordo-700" aria-hidden />
      <div className="pl-3">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-chumbo-500">
          {label}
        </div>
        <div className="mt-3 flex items-baseline gap-3 tabular">
          <span className="min-w-0 whitespace-nowrap font-display text-5xl font-extrabold leading-none text-chumbo-950">
            {value}
          </span>
          {delta && <DeltaBadge {...delta} />}
        </div>
        {context && <div className="mt-2 text-sm text-chumbo-500">{context}</div>}
        {accent && <div className="mt-4">{accent}</div>}
      </div>
    </div>
  );
}

function DeltaBadge({ label, sign, tone = "neutral" }: NonNullable<KpiHeroProps["delta"]>) {
  const cls = cn(
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular",
    tone === "good" && "bg-positive/20 text-positive",
    tone === "bad" && "bg-bordo-50 text-bordo-700",
    tone === "neutral" && "bg-chumbo-100 text-chumbo-700",
    sign === "flat" && "opacity-60",
  );
  return <span className={cls}>{label}</span>;
}

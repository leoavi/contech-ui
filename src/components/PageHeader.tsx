import type { ReactNode } from "react";
import { BordoBar } from "./BordoBar";

interface Props {
  area: string;
  title: string;
  description?: string;
  extra?: ReactNode;
}

export function PageHeader({ area, title, description, extra }: Props) {
  return (
    <header className="relative flex items-end justify-between gap-6 border-b border-chumbo-100 pb-6">
      <div className="relative flex gap-3">
        <BordoBar className="mt-1" />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-bordo-700">
            {area}
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-chumbo-950">{title}</h1>
          {description && <p className="mt-1 text-sm text-chumbo-500">{description}</p>}
        </div>
      </div>
      {extra && <div className="flex-shrink-0">{extra}</div>}
    </header>
  );
}

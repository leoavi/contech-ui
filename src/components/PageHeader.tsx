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
    <header className="relative flex min-w-0 flex-col items-stretch gap-4 border-b border-chumbo-100 pb-6 md:flex-row md:items-end md:justify-between md:gap-6">
      <div className="relative flex min-w-0 gap-3">
        <BordoBar className="mt-1" />
        <div className="min-w-0">
          <p className="break-words text-[11px] font-semibold uppercase tracking-[0.18em] text-bordo-700">
            {area}
          </p>
          <h1 className="mt-1 break-words font-display text-3xl font-extrabold text-chumbo-950">{title}</h1>
          {description && <p className="mt-1 break-words text-sm text-chumbo-500">{description}</p>}
        </div>
      </div>
      {extra && (
        <div className="min-w-0 w-full [&>*]:min-w-0 [&>*]:max-w-full max-md:[&>*]:flex-wrap md:w-auto md:flex-shrink-0">
          {extra}
        </div>
      )}
    </header>
  );
}

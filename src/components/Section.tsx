import type { ReactNode } from "react";
import { BordoBar } from "./BordoBar";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Section({ title, description, action, children }: Props) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div className="flex gap-3">
          <BordoBar className="mt-0.5" />
          <div>
            <h2 className="font-display text-base font-bold uppercase tracking-wide text-chumbo-950">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-xs text-chumbo-500">{description}</p>}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}

import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface SectionProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ title, description, action, children, className }: SectionProps) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {(title || action) && (
        <div className="flex items-end justify-between gap-4">
          <div className="flex items-start gap-2">
            {title && (
              <div
                className="mt-1 w-[3px] self-stretch rounded-full bg-bordo-700"
                aria-hidden
              />
            )}
            <div>
              {title && (
                <h2 className="font-display text-lg font-bold uppercase tracking-wide text-chumbo-800">
                  {title}
                </h2>
              )}
              {description && <p className="mt-1 text-sm text-chumbo-500">{description}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

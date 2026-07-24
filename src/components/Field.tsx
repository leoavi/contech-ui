"use client";

import { useId, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface FieldControlProps {
  /** id do controle (pra `htmlFor` / `id` do input). */
  id: string;
  /** id do parágrafo de erro (pra `aria-describedby`). */
  errorId: string;
  /** id do parágrafo de hint (pra `aria-describedby`). */
  hintId: string;
  /** Valor pronto de `aria-describedby` (erro tem prioridade sobre hint). */
  describedBy?: string;
  /** `true` quando há `error`. */
  invalid: boolean;
}

export interface FieldProps {
  label?: string;
  /**
   * id do controle associado. Se omitido, gera via `useId`.
   * O consumidor deve passar o mesmo id no input (`id={...}`) ou usar
   * children como função pra receber o id gerado.
   */
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  /**
   * Conteúdo do campo. Pode ser nó React ou render-prop que recebe
   * `{ id, errorId, hintId, describedBy, invalid }` pra ligar a11y.
   */
  children: ReactNode | ((props: FieldControlProps) => ReactNode);
}

/**
 * Wrapper de formulário: label + children + erro (tom negative) ou hint.
 * Espelha o padrão FormField já copiado nas telas do Gestão.
 */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FieldProps) {
  const autoId = useId();
  const id = htmlFor ?? autoId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const control: FieldControlProps = {
    id,
    errorId,
    hintId,
    describedBy,
    invalid: Boolean(error),
  };

  const content = typeof children === "function" ? children(control) : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wide text-chumbo-700"
        >
          {label}
          {required ? (
            <span className="ml-1 text-bordo-700" aria-hidden>
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {content}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-negative">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-chumbo-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

Field.displayName = "Field";

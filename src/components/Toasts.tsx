"use client";

import { useEffect, useRef, type MouseEventHandler } from "react";
import {
  TOAST_DURATION_MS,
  useToastState,
  type ToastItem,
  type ToastType,
} from "../lib/toast-context";
import { cn } from "../lib/cn";

const typeClasses: Record<ToastType, string> = {
  success: "border-l-positive",
  error: "border-l-negative",
  info: "border-l-neutral",
};

/**
 * Item individual — auto-dismiss com pausa no hover.
 * success/info = 5s, error = 8s.
 */
function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const remainingRef = useRef<number>(TOAST_DURATION_MS[item.type]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss(item.id);
    }, remainingRef.current);
  };

  useEffect(() => {
    remainingRef.current = TOAST_DURATION_MS[item.type];
    startTimer();
    return clearTimer;
  }, [item.id, item.type, onDismiss]);

  const onMouseEnter: MouseEventHandler = () => {
    clearTimer();
    const elapsed = Date.now() - startedAtRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
  };

  const onMouseLeave: MouseEventHandler = () => {
    if (remainingRef.current > 0) startTimer();
    else onDismiss(item.id);
  };

  return (
    <div
      role={item.type === "error" ? "alert" : undefined}
      className={cn(
        "pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3",
        "rounded-lg border border-chumbo-100 border-l-4 bg-white px-4 py-3 shadow-lg",
        "text-sm text-chumbo-950",
        typeClasses[item.type],
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <p className="min-w-0 flex-1 leading-snug">{item.message}</p>
      <button
        type="button"
        className="shrink-0 rounded px-1.5 py-0.5 text-chumbo-500 transition-colors hover:bg-chumbo-100/40 hover:text-chumbo-950"
        aria-label="Fechar"
        onClick={() => onDismiss(item.id)}
      >
        ×
      </button>
    </div>
  );
}

/**
 * Viewport de toasts — canto inferior direito.
 *
 * z-[200]: o ChatWidget do Gestão usa `fixed inset-0 z-[100]`; o toast precisa
 * ficar ACIMA desse overlay (e de dialogs z-50).
 *
 * Empilha verticalmente; mais novo embaixo (append na lista + flex-col).
 */
export function Toasts() {
  const { toasts, dismiss } = useToastState();

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[200] flex flex-col gap-2"
      aria-live="polite"
      aria-relevant="additions text"
      data-contech-toasts
    >
      {toasts.map((item: ToastItem) => (
        <ToastCard key={item.id} item={item} onDismiss={dismiss} />
      ))}
    </div>
  );
}

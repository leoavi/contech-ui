"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export interface ToastHandle {
  /** Remove este toast imediatamente. */
  dismiss: () => void;
}

export interface ToastApi {
  success: (message: string) => ToastHandle;
  error: (message: string) => ToastHandle;
  info: (message: string) => ToastHandle;
}

/** Durações de auto-dismiss (ms). */
export const TOAST_DURATION_MS = {
  success: 5000,
  info: 5000,
  error: 8000,
} as const;

interface ToastContextValue {
  toasts: ToastItem[];
  toast: ToastApi;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function newId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Provider do sistema de toasts. Monte no root do app e renderize `<Toasts />`
 * como irmão do conteúdo (ou no final do provider).
 *
 * ```tsx
 * <ToastProvider>
 *   <App />
 *   <Toasts />
 * </ToastProvider>
 * ```
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string): ToastHandle => {
      const id = newId();
      setToasts((prev) => [...prev, { id, type, message }]);
      return { dismiss: () => dismiss(id) };
    },
    [dismiss],
  );

  const toast = useMemo<ToastApi>(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
      info: (message) => push("info", message),
    }),
    [push],
  );

  const value = useMemo(
    () => ({ toasts, toast, dismiss }),
    [toasts, toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

/**
 * API imperativa de toast. Deve ser chamado sob `<ToastProvider>`.
 *
 * ```ts
 * const toast = useToast();
 * toast.success("Salvo");
 * toast.error("Falhou");
 * const { dismiss } = toast.info("Processando…");
 * ```
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  }
  return ctx.toast;
}

/** Hook interno do viewport `<Toasts />` — lista + dismiss. */
export function useToastState(): {
  toasts: ToastItem[];
  dismiss: (id: string) => void;
} {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("<Toasts /> deve ser usado dentro de <ToastProvider>");
  }
  return { toasts: ctx.toasts, dismiss: ctx.dismiss };
}

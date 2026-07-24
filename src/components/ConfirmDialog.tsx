"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

export type ConfirmDialogTone = "default" | "danger";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: ReactNode;
  /** Default `"Confirmar"`. */
  confirmLabel?: string;
  /** Default `"Cancelar"`. */
  cancelLabel?: string;
  /** `danger` usa `Button variant="danger"`. Default `"default"`. */
  tone?: ConfirmDialogTone;
  /**
   * Pode ser sync ou async. Enquanto a Promise estiver pendente, o confirmar
   * fica em loading e ambos os botões desabilitados. Resolve → fecha; rejeita
   * → NÃO fecha (reabilita botões; erro propaga pro chamador).
   */
  onConfirm: () => void | Promise<void>;
}

/**
 * Diálogo de confirmação em cima do Dialog — cancelar + confirmar com
 * loading assíncrono e tom de perigo opcional.
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  // Reabre limpo se o pai fechar por outro caminho.
  useEffect(() => {
    if (!open) setPending(false);
  }, [open]);

  const handleConfirm = async () => {
    setPending(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setPending(false);
      // Propaga pro chamador (onConfirm / boundary) tratar o erro.
      throw err;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={pending ? () => {} : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
            loading={pending}
            disabled={pending}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-chumbo-800">{message}</div>
    </Dialog>
  );
}

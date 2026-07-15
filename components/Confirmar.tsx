"use client";

import { AlertTriangle, ShieldQuestion } from "lucide-react";

/**
 * Confirmación ESTÁNDAR para procesos sensibles (norma UX):
 * toda acción irreversible o de impacto (activar versiones, aprobar/rechazar,
 * validar, eliminar, cambiar roles) pasa por aquí antes de ejecutarse.
 */
export default function Confirmar({
  abierto,
  titulo,
  mensaje,
  confirmLabel = "Confirmar",
  tono = "brand",
  cargando,
  onCancelar,
  onConfirmar,
}: {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  confirmLabel?: string;
  tono?: "brand" | "peligro";
  cargando?: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 px-4 backdrop-blur-sm">
      <div className="step-enter w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
        <div className="flex items-start gap-3 p-5">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              tono === "peligro" ? "bg-danger-100" : "bg-brand-100"
            }`}
          >
            {tono === "peligro" ? (
              <AlertTriangle className="h-5 w-5 text-danger-600" />
            ) : (
              <ShieldQuestion className="h-5 w-5 text-brand-900" />
            )}
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-[15px] font-bold tracking-[-0.3px]">
              {titulo}
            </h3>
            <p className="mt-1 text-[12.5px] leading-5 text-ink-600">
              {mensaje}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 bg-ink-950 px-5 py-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={cargando}
            className="inline-flex min-h-[36px] items-center rounded-xl border border-white/25 px-4 text-[13px] font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
            className={`inline-flex min-h-[36px] items-center rounded-xl px-5 text-[13px] font-bold transition disabled:opacity-50 ${
              tono === "peligro"
                ? "bg-danger-600 text-white hover:bg-danger-600/85"
                : "bg-white text-ink-950 hover:bg-brand-100"
            }`}
          >
            {cargando ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

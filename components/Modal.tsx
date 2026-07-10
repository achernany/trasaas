"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Modal one-view: el overlay NUNCA scrollea. El modal ocupa hasta
 * (100vh - 80px) y el scroll vive en .modal-body. Footer opcional fijo.
 */
export default function Modal({
  titulo,
  subtitulo,
  onClose,
  children,
  footer,
  ancho = "max-w-2xl",
}: {
  titulo: string;
  subtitulo?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  ancho?: string;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex justify-center bg-ink-900/45 px-4 py-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`step-enter flex max-h-full w-full ${ancho} flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <div className="flex shrink-0 items-center justify-between bg-ink-950 px-5 py-3">
          <div>
            <h2 className="text-base font-semibold leading-6 text-white">{titulo}</h2>
            {subtitulo && (
              <p className="text-[11px] leading-4 text-white/50">{subtitulo}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
        <div className="modal-body min-h-0 flex-1 overflow-y-auto p-5">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-line bg-white px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  titulo,
  onClose,
  children,
  ancho = "max-w-2xl",
}: {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
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
    <div className="overlay flex items-start justify-center overflow-y-auto p-4 py-10" onClick={onClose}>
      <div
        className={`step-enter w-full ${ancho} rounded-2xl border border-line bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition hover:bg-page hover:text-ink-900"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

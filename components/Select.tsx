"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type Opcion = { value: string; label: string };

/** Dropdown propio del sistema (reemplaza <select> nativo) */
export default function Select({
  value,
  onChange,
  opciones,
  placeholder = "Seleccione…",
  className = "",
  compacto,
}: {
  value: string;
  onChange: (v: string) => void;
  opciones: Opcion[];
  placeholder?: string;
  className?: string;
  compacto?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sel = opciones.find((o) => o.value === value);

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setAbierto(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  const h = compacto ? "h-8 text-[11px]" : "h-9 text-[13px]";

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className={`${h} flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left shadow-card transition ${
          abierto
            ? "border-brand-900 ring-2 ring-brand-900/15"
            : "border-line hover:border-ink-400/50"
        }`}
      >
        <span className={`truncate ${sel ? "" : "text-ink-400"}`}>
          {sel?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink-400 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}
        />
      </button>
      {abierto && (
        <ul
          role="listbox"
          className="step-enter absolute z-30 mt-1 max-h-56 w-full min-w-max overflow-auto rounded-xl border border-line bg-white py-1 shadow-lg"
        >
          {opciones.map((o) => {
            const activo = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={activo}
                  onClick={() => {
                    onChange(o.value);
                    setAbierto(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[12px] transition ${
                    activo
                      ? "bg-brand-100 font-bold text-brand-900"
                      : "hover:bg-page"
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {activo && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

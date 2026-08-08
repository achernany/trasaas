"use client";

import { useEffect, useState } from "react";

const TIPS = [
  "Las compras rutinarias requieren mínimo 3 cotizaciones",
  "Solo proveedores clasificados (críticos y no críticos) participan en comparativos",
  "La matriz LOG-GN-A-P02-02 guía la clasificación crítico / no crítico",
  "Un “No cumple” en documentos de legalidad es eliminatorio",
  "La encuesta del área usuaria queda como evidencia en el acta",
  "Cada cambio de matriz crea una versión auditable",
  "Exporta cualquier módulo a Excel desde su cabecera",
  "La campana te avisa cuando llega un registro nuevo",
];

/** Loader de marca: chevrones en avance + loop de tips del proceso */
export default function CargandoTrasaas({
  pantallaCompleta,
}: {
  pantallaCompleta?: boolean;
}) {
  const [i, setI] = useState(() => Math.floor(Math.random() * TIPS.length));

  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % TIPS.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 ${
        pantallaCompleta ? "min-h-screen bg-page" : "min-h-[60vh]"
      }`}
      role="status"
      aria-label="Cargando"
    >
      <svg viewBox="0 0 120 120" width={52} height={52} aria-hidden="true">
        <defs>
          <linearGradient
            id="carga-g"
            x1="24"
            y1="20"
            x2="98"
            y2="102"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#2743C0" />
            <stop offset="0.52" stopColor="#7A2FB0" />
            <stop offset="1" stopColor="#E23A5E" />
          </linearGradient>
        </defs>
        <path
          className="chev-anim-1"
          d="M38 34 L66 62 L38 90"
          fill="none"
          stroke="url(#carga-g)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="chev-anim-2"
          d="M64 34 L92 62 L64 90"
          fill="none"
          stroke="url(#carga-g)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="h-5 overflow-hidden text-center">
        <p key={i} className="tip-loop text-[13px] font-semibold text-ink-400">
          {TIPS[i]}
        </p>
      </div>
    </div>
  );
}

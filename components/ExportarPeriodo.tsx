"use client";

import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";

/** Botón de exportación membretada con selector de periodo */
export default function ExportarPeriodo({ tipo }: { tipo: string }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const inicioAnio = `${new Date().getFullYear()}-01-01`;
  const [abierto, setAbierto] = useState(false);
  const [desde, setDesde] = useState(inicioAnio);
  const [hasta, setHasta] = useState(hoy);

  function descargar(conPeriodo: boolean) {
    const qs = new URLSearchParams({ tipo });
    if (conPeriodo) {
      if (desde) qs.set("desde", desde);
      if (hasta) qs.set("hasta", hasta);
    }
    window.location.href = `/api/export?${qs.toString()}`;
    setAbierto(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        className="btn-secondary min-h-[40px] px-4 text-[13px]"
      >
        <Download className="h-4 w-4" /> Exportar
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${abierto ? "rotate-180" : ""}`}
        />
      </button>
      {abierto && (
        <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-xl border border-line bg-white p-3 shadow-xl">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            Excel membretado
          </p>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <div>
              <label className="label text-[11px]">Desde</label>
              <input
                type="date"
                className="input h-8 text-[12px]"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </div>
            <div>
              <label className="label text-[11px]">Hasta</label>
              <input
                type="date"
                className="input h-8 text-[12px]"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            className="btn min-h-[34px] w-full text-[12px]"
            onClick={() => descargar(true)}
          >
            Descargar periodo
          </button>
          <button
            type="button"
            className="mt-1.5 w-full text-center text-[11px] font-semibold text-brand-900 hover:underline"
            onClick={() => descargar(false)}
          >
            o descargar histórico completo
          </button>
        </div>
      )}
    </div>
  );
}

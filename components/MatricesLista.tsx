"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Shield, ShieldAlert, Pencil, Printer } from "lucide-react";
import Stepper from "@/components/Stepper";

type Opcion = {
  id: string;
  orden: number;
  etiqueta: string;
  descripcion: string | null;
  puntos: number;
};
type Criterio = {
  id: string;
  orden: number;
  nombre: string;
  peso_max: number;
  criterio_opciones: Opcion[];
};
type Matriz = {
  id: string;
  nombre: string;
  tipo: string;
  clasificacion: string;
  version: number;
  estado: string;
  creado_en: string;
  umbral_confiable: number;
  umbral_medianamente: number;
  meses_reeval_confiable: number;
  meses_reeval_medianamente: number;
  meses_reeval_no_confiable: number;
  criterios: Criterio[];
  matriz_documentos: { id: string; descripcion: string }[];
};

const ESTADO: Record<string, string> = {
  vigente: "badge-confiable",
  archivada:
    "inline-flex items-center gap-1 rounded-full bg-page px-2.5 py-0.5 text-[11px] font-bold text-ink-400",
  borrador: "badge-medianamente",
};

const PASOS = ["Resumen", "Criterios", "Documentos"];

export default function MatricesLista({ rows }: { rows: Matriz[] }) {
  const [abierta, setAbierta] = useState<Matriz | null>(null);
  const [paso, setPaso] = useState(0);

  function abrir(m: Matriz) {
    setAbierta(m);
    setPaso(0);
  }

  const criterios = abierta
    ? [...abierta.criterios].sort((a, b) => a.orden - b.orden)
    : [];
  const totalPeso = criterios.reduce((s, c) => s + Number(c.peso_max), 0);

  return (
    <>
      <div className="card overflow-hidden p-0">
        <div className="h-[calc(100vh-350px)] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-[5] border-b border-line bg-page">
              <tr>
                <th className="th">Matriz</th>
                <th className="th">Proceso</th>
                <th className="th">Aplica a</th>
                <th className="th">Versión</th>
                <th className="th">Criterios</th>
                <th className="th">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => abrir(m)}
                  className="cursor-pointer transition hover:bg-brand-100/40"
                >
                  <td className="td py-3 font-sans text-[12px] font-bold text-brand-900">
                    {m.nombre}
                  </td>
                  <td className="td py-3 capitalize text-ink-600">
                    {m.tipo === "seleccion" ? "Selección" : "Evaluación"}
                  </td>
                  <td className="td py-3">
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-600">
                      {m.clasificacion === "critico" ? (
                        <>
                          <ShieldAlert className="h-3.5 w-3.5 text-alfa-red" />
                          Crítico
                        </>
                      ) : (
                        <>
                          <Shield className="h-3.5 w-3.5 text-brand-700" />
                          No crítico
                        </>
                      )}
                    </span>
                  </td>
                  <td className="td py-3 font-mono text-[11px]">v{m.version}</td>
                  <td className="td py-3 text-ink-600">{m.criterios.length}</td>
                  <td className="td py-3">
                    <span className={ESTADO[m.estado] ?? ""}>{m.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal wizard de CONSULTA (solo lectura) */}
      {abierta && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/45 px-4 py-10 backdrop-blur-sm">
          <div className="step-enter flex h-full max-h-[720px] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between bg-ink-950 px-5 py-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold leading-6 tracking-tight text-white">
                  {abierta.nombre}
                </h2>
                <p className="text-[11px] leading-4 text-white/50">
                  v{abierta.version} · {abierta.estado} ·{" "}
                  {abierta.tipo === "seleccion" ? "Selección" : "Evaluación"} ·
                  proveedores{" "}
                  {abierta.clasificacion === "critico" ? "críticos" : "no críticos"}{" "}
                  · solo consulta
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAbierta(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            <div className="shrink-0 px-5 pt-4">
              <Stepper
                pasos={PASOS}
                paso={paso}
                alcanzable={() => true}
                onIr={(i) => setPaso(i)}
              />
            </div>

            <div className="modal-body min-h-0 flex-1 overflow-y-auto p-5">
              <div key={paso} className="step-enter space-y-4">
                {paso === 0 && (
                  <>
                    <div className="grid grid-cols-3 gap-3 text-center text-sm">
                      <div className="rounded-xl border border-ok-600/30 bg-ok-100/50 p-3">
                        <div className="font-bold">Confiable</div>
                        <div className="text-xs text-ink-600">
                          ≥ {abierta.umbral_confiable} pts · re-eval.{" "}
                          {abierta.meses_reeval_confiable} meses
                        </div>
                      </div>
                      <div className="rounded-xl border border-warn-700/30 bg-warn-100/50 p-3">
                        <div className="font-bold">Medianamente</div>
                        <div className="text-xs text-ink-600">
                          {abierta.umbral_medianamente}–
                          {abierta.umbral_confiable - 1} pts · re-eval.{" "}
                          {abierta.meses_reeval_medianamente} meses
                        </div>
                      </div>
                      <div className="rounded-xl border border-danger-600/30 bg-danger-100/50 p-3">
                        <div className="font-bold">No confiable</div>
                        <div className="text-xs text-ink-600">
                          ≤ {abierta.umbral_medianamente - 1} pts · re-eval.{" "}
                          {abierta.meses_reeval_no_confiable} mes(es)
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <Dato k="Criterios" v={String(abierta.criterios.length)} />
                      <Dato k="Puntaje total" v={`${totalPeso} pts`} />
                      <Dato
                        k="Docs. eliminatorios"
                        v={String(abierta.matriz_documentos.length)}
                      />
                      <Dato k="Creada" v={abierta.creado_en?.slice(0, 10)} />
                    </div>
                  </>
                )}

                {paso === 1 && (
                  <div className="space-y-3">
                    {criterios.map((c) => (
                      <div key={c.id} className="rounded-xl border border-line p-4">
                        <div className="mb-2 flex items-baseline justify-between gap-3">
                          <h3 className="text-[13px] font-bold">{c.nombre}</h3>
                          <span className="shrink-0 rounded-full bg-brand-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-brand-900">
                            {Number(c.peso_max)} pts
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {[...c.criterio_opciones]
                            .sort((a, b) => a.orden - b.orden)
                            .map((o) => (
                              <li
                                key={o.id}
                                className="flex items-baseline justify-between gap-4 text-[12.5px]"
                              >
                                <span className="text-ink-600">
                                  <b className="text-ink-950">{o.etiqueta}</b>
                                  {o.descripcion && ` — ${o.descripcion}`}
                                </span>
                                <span className="shrink-0 font-mono text-[11px] font-bold">
                                  {Number(o.puntos)}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {paso === 2 &&
                  (abierta.matriz_documentos.length > 0 ? (
                    <ul className="space-y-2">
                      {abierta.matriz_documentos.map((d) => (
                        <li
                          key={d.id}
                          className="flex items-center justify-between rounded-xl border border-line p-3 text-[13px]"
                        >
                          <span className="font-semibold">{d.descripcion}</span>
                          <span className="badge-no-confiable">Eliminatorio</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-10 text-center text-sm text-ink-400">
                      Esta matriz no tiene documentos eliminatorios
                    </p>
                  ))}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2 bg-ink-950 px-5 py-3">
              <Link
                href={`/panel/configuracion/matrices/${abierta.id}`}
                className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-white/25 px-4 text-[13px] font-bold text-white transition hover:bg-white/10"
              >
                <Printer className="h-4 w-4" /> Versión imprimible
              </Link>
              {abierta.estado === "vigente" && (
                <Link
                  href={`/panel/configuracion/matrices/${abierta.id}/editar`}
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-xl bg-white px-5 text-[13px] font-bold text-ink-950 transition hover:bg-brand-100"
                >
                  <Pencil className="h-4 w-4" /> Editar (nueva versión)
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Dato({ k, v }: { k: string; v?: string }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
        {k}
      </div>
      <div className="mt-0.5 text-[15px] font-bold">{v ?? "—"}</div>
    </div>
  );
}

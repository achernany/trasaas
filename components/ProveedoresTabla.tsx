"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlarmClock,
  ExternalLink,
  ClipboardList,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Modal from "@/components/Modal";

export type PcRow = {
  id: string;
  suministro: string | null;
  calificacion_actual: string | null;
  nota_actual: number | null;
  proxima_evaluacion: string | null;
  proveedores: {
    id: string;
    ruc: string;
    razon_social: string;
    distrito: string | null;
  } | null;
  categorias: { id: string; nombre: string } | null;
};

const BADGE: Record<string, { cls: string; label: string; Icon: any }> = {
  confiable: { cls: "badge-confiable", label: "Confiable", Icon: CheckCircle2 },
  medianamente_confiable: {
    cls: "badge-medianamente",
    label: "Medianam.",
    Icon: AlertTriangle,
  },
  no_confiable: { cls: "badge-no-confiable", label: "No conf.", Icon: XCircle },
};

function NotaBar({ nota }: { nota: number | null }) {
  if (nota == null) return <span className="text-ink-400">—</span>;
  const color =
    nota >= 71 ? "bg-ok-600" : nota >= 31 ? "bg-warn-700" : "bg-danger-600";
  return (
    <span
      className="inline-flex items-center gap-2"
      title={`Nota ${nota} de 100`}
    >
      <span className="h-2 w-16 overflow-hidden rounded-full border border-line bg-page">
        <span
          className={`block h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.min(100, nota)}%` }}
        />
      </span>
      <span className="font-bold tabular-nums">{nota}</span>
    </span>
  );
}

function Badge({ cal }: { cal: string | null }) {
  const b = cal ? BADGE[cal] : null;
  if (!b) return <span className="text-ink-400">—</span>;
  return (
    <span className={b.cls}>
      <b.Icon className="h-3.5 w-3.5" /> {b.label}
    </span>
  );
}

export default function ProveedoresTabla({
  rows,
  hoy,
}: {
  rows: PcRow[];
  hoy: string;
}) {
  const [sel, setSel] = useState<PcRow | null>(null);

  return (
    <>
      {/* Desktop: scroll interno, el paginador queda fijo abajo */}
      <div className="hidden max-h-[calc(100vh-380px)] overflow-y-auto md:block">
        <table className="w-full">
          <thead className="sticky top-0 z-[5] border-b border-line bg-page">
            <tr>
              <th className="th">Proveedor</th>
              <th className="th">Categoría</th>
              <th className="th">Calificación</th>
              <th className="th">Nota</th>
              <th className="th">Próx. eval.</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => {
              const vencida =
                r.proxima_evaluacion && r.proxima_evaluacion < hoy;
              return (
                <tr key={r.id} className="row-click" onClick={() => setSel(r)}>
                  <td className="td py-3">
                    <span
                      className="block max-w-[260px] truncate font-sans text-[12px] font-bold leading-[14px]"
                      title={`${r.proveedores?.razon_social} · RUC ${r.proveedores?.ruc}`}
                    >
                      {r.proveedores?.razon_social}
                    </span>
                    <span className="text-[10.5px] text-ink-400">
                      {r.proveedores?.ruc}
                    </span>
                  </td>
                  <td className="td max-w-[160px] truncate py-3 text-ink-600">
                    {r.categorias?.nombre}
                  </td>
                  <td className="td py-3">
                    <Badge cal={r.calificacion_actual} />
                  </td>
                  <td className="td py-3">
                    <NotaBar nota={r.nota_actual} />
                  </td>
                  <td className="td py-3">
                    <span
                      className={
                        vencida
                          ? "inline-flex items-center gap-1 font-bold text-danger-600"
                          : "text-ink-600"
                      }
                    >
                      {vencida && <AlarmClock className="h-3 w-3" />}
                      {r.proxima_evaluacion ?? "—"}
                    </span>
                  </td>
                  <td className="td py-3 text-right">
                    <Link
                      href={`/panel/evaluaciones/nueva?pc=${r.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-md bg-brand-100 px-2.5 py-1.5 text-[11px] font-bold text-brand-900 transition hover:bg-brand-900 hover:text-white"
                    >
                      Evaluar
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="td py-10 text-center text-ink-400" colSpan={6}>
                  Sin resultados para esta búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 p-3 md:hidden">
        {rows.map((r) => {
          const vencida = r.proxima_evaluacion && r.proxima_evaluacion < hoy;
          return (
            <button
              key={r.id}
              className="card w-full space-y-2 p-4 text-left"
              onClick={() => setSel(r)}
            >
              <div className="text-sm font-bold">
                {r.proveedores?.razon_social}
              </div>
              <div className="text-xs text-ink-400">
                RUC {r.proveedores?.ruc} · {r.categorias?.nombre}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Badge cal={r.calificacion_actual} />
                <NotaBar nota={r.nota_actual} />
                {vencida && (
                  <span className="badge bg-danger-100 text-danger-600">
                    <AlarmClock className="h-3 w-3" /> Vencida
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {sel && <DetalleProveedor pc={sel} onClose={() => setSel(null)} />}
    </>
  );
}

function DetalleProveedor({
  pc,
  onClose,
}: {
  pc: PcRow;
  onClose: () => void;
}) {
  const [historial, setHistorial] = useState<any[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("evaluaciones")
      .select("id, codigo, fecha, nota, calificacion, proceso")
      .eq("proveedor_categoria_id", pc.id)
      .order("fecha", { ascending: false })
      .limit(12)
      .then(({ data }) => setHistorial(data ?? []));
  }, [pc.id]);

  const maxNota = 100;

  return (
    <Modal titulo={pc.proveedores?.razon_social ?? "Proveedor"} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge cal={pc.calificacion_actual} />
          <NotaBar nota={pc.nota_actual} />
          <span className="text-xs text-ink-400">
            RUC {pc.proveedores?.ruc} · {pc.categorias?.nombre}
            {pc.suministro ? ` · ${pc.suministro}` : ""}
          </span>
        </div>

        {pc.proxima_evaluacion && (
          <div className="rounded-lg bg-page px-4 py-2.5 text-sm">
            Próxima re-evaluación:{" "}
            <span className="font-bold">{pc.proxima_evaluacion}</span>
          </div>
        )}

        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
            <ClipboardList className="h-4 w-4 text-brand-700" />
            Historial de evaluaciones en esta categoría
          </h3>
          {historial === null ? (
            <p className="py-4 text-center text-sm text-ink-400">Cargando…</p>
          ) : historial.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-400">
              Sin evaluaciones registradas aún
            </p>
          ) : (
            <>
              {/* mini gráfico de notas */}
              <div className="mb-3 flex h-16 items-end gap-1.5 rounded-lg bg-page p-2">
                {[...historial].reverse().map((h) => (
                  <div
                    key={h.id}
                    className="group relative flex-1"
                    title={`${h.fecha} · ${h.nota}`}
                  >
                    <div
                      className={`w-full rounded-sm ${
                        h.nota >= 71
                          ? "bg-ok-600"
                          : h.nota >= 31
                            ? "bg-warn-700"
                            : "bg-danger-600"
                      }`}
                      style={{ height: `${Math.max(8, (h.nota / maxNota) * 48)}px` }}
                    />
                  </div>
                ))}
              </div>
              <ul className="divide-y divide-line">
                {historial.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-2 py-2 text-[12px]">
                    <Link
                      href={`/panel/evaluaciones/${h.id}`}
                      className="font-mono text-[11px] font-bold text-brand-900 hover:underline"
                    >
                      {h.codigo}
                    </Link>
                    <span className="capitalize text-ink-400">{h.proceso}</span>
                    <span className="text-ink-600">{h.fecha}</span>
                    <span className="font-bold tabular-nums">{h.nota}</span>
                    <Badge cal={h.calificacion} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          <Link
            href={`/panel/evaluaciones?q=${encodeURIComponent(pc.proveedores?.ruc ?? "")}`}
            className="btn-secondary min-h-[40px] px-4 text-[13px]"
          >
            <ExternalLink className="h-4 w-4" /> Ver en historial
          </Link>
          <Link
            href={`/panel/evaluaciones/nueva?pc=${pc.id}`}
            className="btn min-h-[40px] px-4 text-[13px]"
          >
            Evaluar ahora
          </Link>
        </div>
      </div>
    </Modal>
  );
}

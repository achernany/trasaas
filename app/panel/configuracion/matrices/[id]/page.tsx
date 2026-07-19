import Link from "next/link";
import { notFound } from "next/navigation";
import {ArrowLeft, Pencil} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function MatrizDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: m } = await supabase
    .from("matrices")
    .select(
      `id, nombre, tipo, clasificacion, version, estado, creado_en,
       umbral_confiable, umbral_medianamente,
       meses_reeval_confiable, meses_reeval_medianamente, meses_reeval_no_confiable,
       criterios(id, orden, nombre, peso_max, criterio_opciones(id, orden, etiqueta, descripcion, puntos)),
       matriz_documentos(id, descripcion, eliminatorio)`
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!m) notFound();
  const mx = m as any;
  const criterios = [...(mx.criterios ?? [])].sort(
    (a: any, b: any) => a.orden - b.orden
  );
  const totalPeso = criterios.reduce(
    (s: number, c: any) => s + Number(c.peso_max),
    0
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="no-print flex items-center justify-between">
        <Link
          href="/panel/configuracion/matrices"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-400 transition hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" /> Matrices
        </Link>
        <div className="flex items-center gap-2">
          {mx.estado === "vigente" && (
            <Link
              href={`/panel/configuracion/matrices/${mx.id}/editar`}
              className="btn-secondary min-h-[40px] text-[13px]"
            >
              <Pencil className="h-4 w-4" /> Editar (nueva versión)
            </Link>
          )}
          <PrintButton />
        </div>
      </div>

      <div className="card p-8">
        <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Alfa Co S.A.C. · Matriz de puntuación
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              {mx.nombre}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Proceso: {mx.tipo === "seleccion" ? "Selección" : "Evaluación"} ·
              Aplica a proveedores{" "}
              {mx.clasificacion === "critico" ? "críticos" : "no críticos"}
            </p>
          </div>
          <div className="text-right text-sm">
            <div className="font-mono text-xs text-slate-500">
              v{mx.version} · {mx.estado.toUpperCase()}
            </div>
            <div className="text-xs text-slate-500">
              {mx.creado_en?.slice(0, 10)}
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3 text-center text-sm">
          <div className="rounded-xl border border-ok-600/30 bg-ok-100/50 p-3">
            <div className="font-bold">Confiable</div>
            <div className="text-xs text-slate-500">
              ≥ {mx.umbral_confiable} pts · re-eval. {mx.meses_reeval_confiable}{" "}
              meses
            </div>
          </div>
          <div className="rounded-xl border border-warn-700/30 bg-warn-100/50 p-3">
            <div className="font-bold">Medianamente</div>
            <div className="text-xs text-slate-500">
              {mx.umbral_medianamente}–{mx.umbral_confiable - 1} pts · re-eval.{" "}
              {mx.meses_reeval_medianamente} meses
            </div>
          </div>
          <div className="rounded-xl border border-danger-600/30 bg-danger-100/50 p-3">
            <div className="font-bold">No confiable</div>
            <div className="text-xs text-slate-500">
              ≤ {mx.umbral_medianamente - 1} pts · re-eval.{" "}
              {mx.meses_reeval_no_confiable} mes(es)
            </div>
          </div>
        </div>

        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Criterios y ponderaciones ({totalPeso} pts)
        </h2>
        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <th className="py-2">Criterio</th>
              <th className="py-2">Niveles</th>
              <th className="py-2 text-right">Peso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {criterios.map((c: any) => (
              <tr key={c.id}>
                <td className="py-2 align-top font-medium">{c.nombre}</td>
                <td className="py-2 text-slate-600">
                  {[...(c.criterio_opciones ?? [])]
                    .sort((a: any, b: any) => a.orden - b.orden)
                    .map((o: any) => (
                      <div key={o.id} className="flex justify-between gap-4">
                        <span>
                          <span className="font-semibold">{o.etiqueta}</span>
                          {o.descripcion && (
                            <span className="text-xs"> — {o.descripcion}</span>
                          )}
                        </span>
                        <span className="font-mono text-xs">
                          {Number(o.puntos)}
                        </span>
                      </div>
                    ))}
                </td>
                <td className="py-2 text-right align-top font-semibold">
                  {Number(c.peso_max)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(mx.matriz_documentos ?? []).length > 0 && (
          <>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Documentos de legalidad (eliminatorios)
            </h2>
            <ul className="mb-6 list-inside list-disc space-y-1 text-sm text-slate-600">
              {mx.matriz_documentos.map((d: any) => (
                <li key={d.id}>{d.descripcion}</li>
              ))}
            </ul>
          </>
        )}

        <p className="border-t border-slate-200 pt-4 text-xs text-slate-400">
          Documento de referencia para auditorías · generado por AlfaSource ·
          matriz {mx.id.slice(0, 8).toUpperCase()} v{mx.version}
        </p>
      </div>
    </div>
  );
}

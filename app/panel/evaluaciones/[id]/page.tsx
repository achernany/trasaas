import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

const CAL: Record<string, { cls: string; label: string; nota: string }> = {
  confiable: {
    cls: "badge-confiable",
    label: "CONFIABLE",
    nota: "Aprobado. Realizar seguimiento, se asumen riesgos despreciables. Vigencia 6 meses.",
  },
  medianamente_confiable: {
    cls: "badge-medianamente",
    label: "MEDIANAMENTE CONFIABLE",
    nota: "Aprobado con reserva. Seguimiento para verificar cumplimiento de requisitos. Vigencia 3 meses.",
  },
  no_confiable: {
    cls: "badge-no-confiable",
    label: "NO CONFIABLE",
    nota: "No aprobado. De usarse por seguridad/localización u otro motivo, seguimiento exhaustivo y re-evaluación al mes.",
  },
};

export default async function FichaEvaluacionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: ev } = await supabase
    .from("evaluaciones")
    .select(
      `id, codigo, proceso, fecha, nota, calificacion, observacion, creado_en,
       proveedor_categorias(suministro, proxima_evaluacion, proveedores(ruc, razon_social, direccion, distrito), categorias(nombre)),
       matrices(nombre),
       proyectos(nombre),
       usuarios(nombre, rol),
       evaluacion_respuestas(puntos, criterios(orden, nombre, peso_max), criterio_opciones(etiqueta, descripcion)),
       evaluacion_documentos(cumple, matriz_documentos(descripcion))`
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!ev) notFound();
  const e = ev as any;
  const cal = CAL[e.calificacion];
  const pc = e.proveedor_categorias;
  const respuestas = [...(e.evaluacion_respuestas ?? [])].sort(
    (a: any, b: any) => a.criterios.orden - b.criterios.orden
  );
  const sello = `${e.id.slice(0, 8).toUpperCase()}·${new Date(e.creado_en).toISOString()}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="no-print flex items-center justify-between">
        <Link
          href="/panel/evaluaciones"
          className="text-sm text-slate-500 hover:underline"
        >
          ← Evaluaciones
        </Link>
        <PrintButton />
      </div>

      <div className="card p-8">
        <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Alfa Co S.A.C. · Formato LOG-F-P03-01
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              {e.proceso === "seleccion"
                ? "Selección de Proveedores"
                : "Evaluación de Proveedores"}
            </h1>
          </div>
          <div className="text-right text-sm">
            <div className="font-mono text-xs text-slate-500">{e.codigo}</div>
            <div className="text-slate-500">{e.fecha}</div>
          </div>
        </div>

        <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Dato k="Razón social" v={pc?.proveedores?.razon_social} />
          <Dato k="RUC" v={pc?.proveedores?.ruc} />
          <Dato k="Dirección" v={pc?.proveedores?.direccion} />
          <Dato k="Distrito" v={pc?.proveedores?.distrito} />
          <Dato k="Categoría" v={pc?.categorias?.nombre} />
          <Dato k="Suministro" v={pc?.suministro} />
          <Dato k="Proyecto" v={e.proyectos?.nombre} />
          <Dato k="Matriz aplicada" v={e.matrices?.nombre} />
        </dl>

        <div className="mb-6 flex items-center justify-between rounded-xl border-2 border-slate-900 p-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Resultado
            </div>
            <span className={`mt-1 ${cal.cls}`}>{cal.label}</span>
            <p className="mt-2 max-w-md text-xs text-slate-500">{cal.nota}</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold tracking-tight">{e.nota}</div>
            <div className="text-xs text-slate-400">de 100 puntos</div>
            {pc?.proxima_evaluacion && (
              <div className="mt-1 text-xs text-slate-500">
                Próxima eval.: {pc.proxima_evaluacion}
              </div>
            )}
          </div>
        </div>

        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Criterios evaluados
        </h2>
        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
              <th className="py-2">Criterio</th>
              <th className="py-2">Calificación</th>
              <th className="py-2 text-right">Puntos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {respuestas.map((r: any, i: number) => (
              <tr key={i}>
                <td className="py-2 font-medium">{r.criterios.nombre}</td>
                <td className="py-2 text-slate-600">
                  <span className="font-semibold">
                    {r.criterio_opciones.etiqueta}
                  </span>
                  {r.criterio_opciones.descripcion &&
                    ` — ${r.criterio_opciones.descripcion}`}
                </td>
                <td className="py-2 text-right font-semibold">
                  {Number(r.puntos)} / {Number(r.criterios.peso_max)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(e.evaluacion_documentos ?? []).length > 0 && (
          <>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Documentos de legalidad (eliminatorios)
            </h2>
            <ul className="mb-6 space-y-1 text-sm">
              {e.evaluacion_documentos.map((d: any, i: number) => (
                <li key={i} className="flex items-center justify-between">
                  <span>{d.matriz_documentos.descripcion}</span>
                  <span
                    className={
                      d.cumple
                        ? "font-semibold text-emerald-700"
                        : "font-semibold text-red-600"
                    }
                  >
                    {d.cumple ? "Cumple" : "No cumple"}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {e.observacion && (
          <p className="mb-6 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            <span className="font-semibold">Observaciones: </span>
            {e.observacion}
          </p>
        )}

        <div className="flex items-end justify-between border-t border-slate-200 pt-4 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Evaluador
            </div>
            <div className="font-medium">
              {e.usuarios?.nombre ?? "Migración histórica"}
            </div>
            {e.usuarios?.rol && (
              <div className="text-xs capitalize text-slate-500">
                {e.usuarios.rol}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Firma digital del sistema
            </div>
            <div className="font-mono text-xs text-slate-500">{sello}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dato({ k, v }: { k: string; v?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{k}</dt>
      <dd className="font-medium">{v ?? "—"}</dd>
    </div>
  );
}

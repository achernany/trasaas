import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BADGE: Record<string, { cls: string; label: string }> = {
  confiable: { cls: "badge-confiable", label: "Confiable" },
  medianamente_confiable: {
    cls: "badge-medianamente",
    label: "Medianamente confiable",
  },
  no_confiable: { cls: "badge-no-confiable", label: "No confiable" },
};

export default async function EvaluacionesPage() {
  const supabase = createClient();
  const { data: evals } = await supabase
    .from("evaluaciones")
    .select(
      "id, codigo, proceso, fecha, nota, calificacion, proveedor_categorias(suministro, proveedores(razon_social, ruc), categorias(nombre))"
    )
    .order("fecha", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Evaluaciones
          </h1>
          <p className="text-sm text-slate-500">
            Últimas 100 · selección y evaluación periódica
          </p>
        </div>
        <Link href="/panel/evaluaciones/nueva" className="btn">
          + Nueva evaluación
        </Link>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th">Código</th>
              <th className="th">Proveedor</th>
              <th className="th">Categoría</th>
              <th className="th">Proceso</th>
              <th className="th">Fecha</th>
              <th className="th">Nota</th>
              <th className="th">Calificación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(evals ?? []).map((e: any) => {
              const b = BADGE[e.calificacion];
              return (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="td">
                    <Link
                      href={`/panel/evaluaciones/${e.id}`}
                      className="font-mono text-xs font-medium text-emerald-700 hover:underline"
                    >
                      {e.codigo}
                    </Link>
                  </td>
                  <td className="td">
                    <div className="font-medium">
                      {e.proveedor_categorias?.proveedores?.razon_social}
                    </div>
                  </td>
                  <td className="td text-slate-600">
                    {e.proveedor_categorias?.categorias?.nombre}
                  </td>
                  <td className="td capitalize text-slate-600">{e.proceso}</td>
                  <td className="td">{e.fecha}</td>
                  <td className="td font-semibold">{e.nota}</td>
                  <td className="td">
                    {b ? <span className={b.cls}>{b.label}</span> : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

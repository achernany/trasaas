import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Paginator from "@/components/Paginator";

export const dynamic = "force-dynamic";

const BADGE: Record<string, { cls: string; label: string; icon: string }> = {
  confiable: { cls: "badge-confiable", label: "Confiable", icon: "✓" },
  medianamente_confiable: {
    cls: "badge-medianamente",
    label: "Medianam.",
    icon: "!",
  },
  no_confiable: { cls: "badge-no-confiable", label: "No conf.", icon: "✕" },
};

export default async function EvaluacionesPage({
  searchParams,
}: {
  searchParams: { page?: string; per?: string };
}) {
  const supabase = createClient();
  const per = Math.min(50, Math.max(10, Number(searchParams.per) || 10));
  const pageReq = Math.max(1, Number(searchParams.page) || 1);

  const { data: evals, count } = await supabase
    .from("evaluaciones")
    .select(
      "id, codigo, proceso, fecha, nota, calificacion, proveedor_categorias(suministro, proveedores(razon_social, ruc), categorias(nombre))",
      { count: "exact" }
    )
    .order("fecha", { ascending: false })
    .range((pageReq - 1) * per, pageReq * per - 1);

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / per));
  const page = Math.min(pages, pageReq);

  return (
    <div>
      <div className="page-head flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Evaluaciones
          </h1>
          <p className="text-[12px] text-ink-400">
            {total} registradas · selección y evaluación periódica
          </p>
        </div>
        <Link href="/panel/evaluaciones/nueva" className="btn">
          + Nueva evaluación
        </Link>
      </div>

      <div className="card mt-4 overflow-hidden p-0">
        <div className="max-h-[62vh] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-[5] border-b border-line bg-page">
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
            <tbody className="divide-y divide-line">
              {(evals ?? []).map((e: any) => {
                const b = BADGE[e.calificacion];
                return (
                  <tr key={e.id} className="transition hover:bg-page">
                    <td className="td">
                      <Link
                        href={`/panel/evaluaciones/${e.id}`}
                        className="font-mono text-[11px] font-bold text-brand-900 hover:underline"
                      >
                        {e.codigo}
                      </Link>
                    </td>
                    <td className="td">
                      <span
                        className="block max-w-[240px] truncate font-sans text-[12px] font-bold leading-[14px]"
                        title={
                          e.proveedor_categorias?.proveedores?.razon_social
                        }
                      >
                        {e.proveedor_categorias?.proveedores?.razon_social}
                      </span>
                    </td>
                    <td className="td max-w-[150px] truncate text-ink-600">
                      {e.proveedor_categorias?.categorias?.nombre}
                    </td>
                    <td className="td capitalize text-ink-600">{e.proceso}</td>
                    <td className="td text-ink-600">{e.fecha}</td>
                    <td className="td font-bold">{e.nota}</td>
                    <td className="td">
                      {b ? (
                        <span className={b.cls}>
                          {b.icon} {b.label}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
              {(evals ?? []).length === 0 && (
                <tr>
                  <td className="td py-10 text-center text-ink-400" colSpan={7}>
                    Sin evaluaciones aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Paginator
          total={total}
          page={page}
          per={per}
          basePath="/panel/evaluaciones"
          params={{ per: String(per) }}
        />
      </div>
    </div>
  );
}

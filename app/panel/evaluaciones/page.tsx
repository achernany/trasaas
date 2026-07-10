import Link from "next/link";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Paginator from "@/components/Paginator";

export const dynamic = "force-dynamic";

const BADGE: Record<string, { cls: string; label: string; Icon: any }> = {
  confiable: { cls: "badge-confiable", label: "Confiable", Icon: CheckCircle2 },
  medianamente_confiable: {
    cls: "badge-medianamente",
    label: "Medianam.",
    Icon: AlertTriangle,
  },
  no_confiable: { cls: "badge-no-confiable", label: "No conf.", Icon: XCircle },
};

export default async function EvaluacionesPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; per?: string };
}) {
  const supabase = createClient();
  const q = (searchParams.q ?? "").trim();
  const per = Math.min(50, Math.max(8, Number(searchParams.per) || 8));

  const { data: evals } = await supabase
    .from("evaluaciones")
    .select(
      "id, codigo, proceso, fecha, nota, calificacion, proveedor_categorias(suministro, proveedores(razon_social, ruc), categorias(nombre))"
    )
    .order("fecha", { ascending: false })
    .limit(500);

  let rows = (evals ?? []) as any[];
  if (q) {
    const qq = q.toLowerCase();
    rows = rows.filter(
      (e) =>
        e.proveedor_categorias?.proveedores?.razon_social
          ?.toLowerCase()
          .includes(qq) ||
        e.proveedor_categorias?.proveedores?.ruc?.includes(qq) ||
        e.codigo?.toLowerCase().includes(qq) ||
        e.proveedor_categorias?.categorias?.nombre?.toLowerCase().includes(qq)
    );
  }

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / per));
  const page = Math.min(pages, Math.max(1, Number(searchParams.page) || 1));
  const visibles = rows.slice((page - 1) * per, page * per);

  return (
    <div>
      <div className="page-head space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Evaluaciones
            </h1>
            <p className="text-[12px] text-ink-400">
              {total} registradas · el historial completo de trazabilidad ·
              clic en el código abre la ficha
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/export?tipo=evaluaciones"
              className="btn-secondary min-h-[40px] px-4 text-[13px]"
              title="Descargar como Excel (CSV)"
            >
              Exportar
            </a>
            <Link href="/panel/evaluaciones/nueva" className="btn">
              + Nueva evaluación
            </Link>
          </div>
        </div>
        <form className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Filtrar por proveedor, RUC, código o categoría…"
            className="input h-10 max-w-md text-[13px]"
          />
          <button className="btn-secondary min-h-[40px]" type="submit">
            Buscar
          </button>
          {q && (
            <Link href="/panel/evaluaciones" className="btn-secondary min-h-[40px]">
              Limpiar
            </Link>
          )}
        </form>
      </div>

      <div className="card mt-3 overflow-hidden p-0">
        <div className="max-h-[calc(100vh-330px)] overflow-y-auto">
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
            {visibles.map((e: any) => {
              const b = BADGE[e.calificacion];
              return (
                <tr key={e.id} className="transition hover:bg-brand-100/40">
                  <td className="td py-3">
                    <Link
                      href={`/panel/evaluaciones/${e.id}`}
                      className="font-mono text-[11px] font-bold text-brand-900 hover:underline"
                    >
                      {e.codigo}
                    </Link>
                  </td>
                  <td className="td py-3">
                    <span
                      className="block max-w-[240px] truncate font-sans text-[12px] font-bold leading-[14px]"
                      title={e.proveedor_categorias?.proveedores?.razon_social}
                    >
                      {e.proveedor_categorias?.proveedores?.razon_social}
                    </span>
                  </td>
                  <td className="td max-w-[150px] truncate py-3 text-ink-600">
                    {e.proveedor_categorias?.categorias?.nombre}
                  </td>
                  <td className="td py-3 capitalize text-ink-600">
                    {e.proceso}
                  </td>
                  <td className="td py-3 text-ink-600">{e.fecha}</td>
                  <td className="td py-3 font-bold">{e.nota}</td>
                  <td className="td py-3">
                    {b ? (
                      <span className={b.cls}>
                        <b.Icon className="h-3.5 w-3.5" /> {b.label}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
            {visibles.length === 0 && (
              <tr>
                <td className="td py-10 text-center text-ink-400" colSpan={7}>
                  Sin evaluaciones para esta búsqueda
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
          params={{ q, per: String(per) }}
        />
      </div>
    </div>
  );
}

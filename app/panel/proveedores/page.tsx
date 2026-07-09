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

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: { q?: string; filtro?: string };
}) {
  const supabase = createClient();
  const q = (searchParams.q ?? "").trim();
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: pcs } = await supabase
    .from("proveedor_categorias")
    .select(
      "id, suministro, calificacion_actual, nota_actual, proxima_evaluacion, proveedores(id, ruc, razon_social, distrito), categorias(id, nombre)"
    )
    .order("proxima_evaluacion", { ascending: true })
    .limit(500);

  let rows = (pcs ?? []) as any[];
  if (q) {
    const qq = q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.proveedores?.razon_social?.toLowerCase().includes(qq) ||
        r.proveedores?.ruc?.includes(qq) ||
        r.categorias?.nombre?.toLowerCase().includes(qq)
    );
  }
  if (searchParams.filtro === "vencidas") {
    rows = rows.filter(
      (r) => r.proxima_evaluacion && r.proxima_evaluacion < hoy
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Proveedores</h1>
          <p className="text-sm text-slate-500">
            {rows.length} registros por proveedor-categoría
            {searchParams.filtro === "vencidas" && " · re-evaluación vencida"}
          </p>
        </div>
        <Link href="/panel/evaluaciones/nueva" className="btn">
          + Nueva evaluación
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por razón social, RUC o categoría…"
          className="input max-w-md"
        />
        <button className="btn-secondary" type="submit">
          Buscar
        </button>
        {searchParams.filtro === "vencidas" && (
          <Link href="/panel/proveedores" className="btn-secondary">
            Quitar filtro
          </Link>
        )}
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="th">Proveedor</th>
              <th className="th">Categoría</th>
              <th className="th">Calificación</th>
              <th className="th">Nota</th>
              <th className="th">Próxima evaluación</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const vencida =
                r.proxima_evaluacion && r.proxima_evaluacion < hoy;
              const b = BADGE[r.calificacion_actual];
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="td">
                    <div className="font-medium">
                      {r.proveedores?.razon_social}
                    </div>
                    <div className="text-xs text-slate-400">
                      RUC {r.proveedores?.ruc}
                    </div>
                  </td>
                  <td className="td text-slate-600">{r.categorias?.nombre}</td>
                  <td className="td">
                    {b ? <span className={b.cls}>{b.label}</span> : "—"}
                  </td>
                  <td className="td font-semibold">{r.nota_actual ?? "—"}</td>
                  <td className="td">
                    <span className={vencida ? "font-semibold text-red-600" : ""}>
                      {r.proxima_evaluacion ?? "—"}
                      {vencida && " · vencida"}
                    </span>
                  </td>
                  <td className="td">
                    <Link
                      href={`/panel/evaluaciones/nueva?pc=${r.id}`}
                      className="text-sm font-medium text-emerald-700 hover:underline"
                    >
                      Evaluar
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="td py-10 text-center text-slate-400" colSpan={6}>
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

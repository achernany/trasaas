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

function NotaBar({ nota }: { nota: number | null }) {
  if (nota == null) return <span className="text-ink-400">—</span>;
  const color =
    nota >= 71 ? "bg-ok-600" : nota >= 31 ? "bg-warn-700" : "bg-danger-600";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1 w-10 overflow-hidden rounded-full bg-page">
        <span
          className={`block h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, nota)}%` }}
        />
      </span>
      <span className="font-bold">{nota}</span>
    </span>
  );
}

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: { q?: string; filtro?: string; page?: string; per?: string };
}) {
  const supabase = createClient();
  const q = (searchParams.q ?? "").trim();
  const filtro = searchParams.filtro ?? "todas";
  const per = Math.min(50, Math.max(10, Number(searchParams.per) || 10));
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: pcs } = await supabase
    .from("proveedor_categorias")
    .select(
      "id, suministro, calificacion_actual, nota_actual, proxima_evaluacion, proveedores(id, ruc, razon_social, distrito), categorias(id, nombre)"
    )
    .order("proxima_evaluacion", { ascending: true })
    .limit(500);

  let rows = (pcs ?? []) as any[];
  const conteos = {
    todas: rows.length,
    confiable: rows.filter((r) => r.calificacion_actual === "confiable").length,
    medianamente_confiable: rows.filter(
      (r) => r.calificacion_actual === "medianamente_confiable"
    ).length,
    vencidas: rows.filter(
      (r) => r.proxima_evaluacion && r.proxima_evaluacion < hoy
    ).length,
  };

  if (q) {
    const qq = q.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.proveedores?.razon_social?.toLowerCase().includes(qq) ||
        r.proveedores?.ruc?.includes(qq) ||
        r.categorias?.nombre?.toLowerCase().includes(qq)
    );
  }
  if (filtro === "vencidas")
    rows = rows.filter((r) => r.proxima_evaluacion && r.proxima_evaluacion < hoy);
  else if (filtro !== "todas")
    rows = rows.filter((r) => r.calificacion_actual === filtro);

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / per));
  const page = Math.min(pages, Math.max(1, Number(searchParams.page) || 1));
  const visibles = rows.slice((page - 1) * per, page * per);

  const chips = [
    { key: "todas", label: `Todas (${conteos.todas})` },
    { key: "confiable", label: `✓ Confiables (${conteos.confiable})` },
    {
      key: "medianamente_confiable",
      label: `! Medianamente (${conteos.medianamente_confiable})`,
    },
    { key: "vencidas", label: `⏱ Vencidas (${conteos.vencidas})` },
  ];

  return (
    <div>
      <div className="page-head space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Proveedores
            </h1>
            <p className="text-[12px] text-ink-400">
              {total} registros por proveedor-categoría
            </p>
          </div>
          <Link href="/panel/evaluaciones/nueva" className="btn">
            + Nueva evaluación
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form className="flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar proveedor, RUC o categoría…"
              className="input h-9 w-64 py-1 text-[13px]"
            />
            {filtro !== "todas" && (
              <input type="hidden" name="filtro" value={filtro} />
            )}
          </form>
          {chips.map((c) => (
            <Link
              key={c.key}
              href={`/panel/proveedores?filtro=${c.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`${filtro === c.key ? "chip-active" : "chip"} min-h-[32px] px-3 text-[12px]`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop: tabla compacta */}
      <div className="card mt-4 hidden overflow-hidden p-0 md:block">
        <div className="max-h-[62vh] overflow-auto">
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
              {visibles.map((r) => {
                const vencida =
                  r.proxima_evaluacion && r.proxima_evaluacion < hoy;
                const b = BADGE[r.calificacion_actual];
                return (
                  <tr key={r.id} className="transition hover:bg-page">
                    <td className="td">
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
                    <td className="td max-w-[160px] truncate text-ink-600">
                      {r.categorias?.nombre}
                    </td>
                    <td className="td">
                      {b ? (
                        <span className={b.cls}>
                          {b.icon} {b.label}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="td">
                      <NotaBar nota={r.nota_actual} />
                    </td>
                    <td className="td">
                      <span
                        className={
                          vencida ? "font-bold text-danger-600" : "text-ink-600"
                        }
                      >
                        {vencida ? "⏱ " : ""}
                        {r.proxima_evaluacion ?? "—"}
                      </span>
                    </td>
                    <td className="td text-right">
                      <Link
                        href={`/panel/evaluaciones/nueva?pc=${r.id}`}
                        className="rounded-md bg-brand-100 px-2.5 py-1 text-[11px] font-bold text-brand-900 transition hover:bg-brand-900 hover:text-white"
                      >
                        Evaluar
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {visibles.length === 0 && (
                <tr>
                  <td className="td py-10 text-center text-ink-400" colSpan={6}>
                    Sin resultados para esta búsqueda
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
          basePath="/panel/proveedores"
          params={{ q, filtro: filtro !== "todas" ? filtro : undefined, per: String(per) }}
        />
      </div>

      {/* Mobile: cards */}
      <div className="mt-4 space-y-3 md:hidden">
        {visibles.map((r) => {
          const vencida = r.proxima_evaluacion && r.proxima_evaluacion < hoy;
          const b = BADGE[r.calificacion_actual];
          return (
            <div key={r.id} className="card space-y-3 p-4">
              <div>
                <div className="text-sm font-bold">
                  {r.proveedores?.razon_social}
                </div>
                <div className="text-xs text-ink-400">
                  RUC {r.proveedores?.ruc} · {r.categorias?.nombre}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {b && (
                  <span className={b.cls}>
                    {b.icon} {b.label}
                  </span>
                )}
                <NotaBar nota={r.nota_actual} />
                {vencida && (
                  <span className="badge bg-danger-100 text-danger-600">
                    ⏱ Vencida
                  </span>
                )}
              </div>
              <Link
                href={`/panel/evaluaciones/nueva?pc=${r.id}`}
                className="btn w-full"
              >
                Evaluar
              </Link>
            </div>
          );
        })}
        <div className="card p-0">
          <Paginator
            total={total}
            page={page}
            per={per}
            basePath="/panel/proveedores"
            params={{ q, filtro: filtro !== "todas" ? filtro : undefined, per: String(per) }}
          />
        </div>
      </div>
    </div>
  );
}

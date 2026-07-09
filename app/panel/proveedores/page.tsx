import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BADGE: Record<string, { cls: string; label: string; icon: string }> = {
  confiable: { cls: "badge-confiable", label: "Confiable", icon: "✓" },
  medianamente_confiable: {
    cls: "badge-medianamente",
    label: "Medianamente",
    icon: "!",
  },
  no_confiable: { cls: "badge-no-confiable", label: "No confiable", icon: "✕" },
};

function NotaBar({ nota }: { nota: number | null }) {
  if (nota == null) return <span className="text-ink-400">—</span>;
  const color =
    nota >= 71 ? "bg-ok-600" : nota >= 31 ? "bg-warn-700" : "bg-danger-600";
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-page">
        <span
          className={`block h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, nota)}%` }}
        />
      </span>
      <span className="font-bold tabular-nums">{nota}</span>
    </span>
  );
}

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: { q?: string; filtro?: string };
}) {
  const supabase = createClient();
  const q = (searchParams.q ?? "").trim();
  const filtro = searchParams.filtro ?? "todas";
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Proveedores</h1>
          <p className="mt-1 text-sm text-ink-600">
            {rows.length} registros por proveedor-categoría
          </p>
        </div>
        <Link href="/panel/evaluaciones/nueva" className="btn">
          + Nueva evaluación
        </Link>
      </div>

      <div className="space-y-4">
        <form className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por razón social, RUC o categoría…"
            className="input max-w-md"
          />
          {filtro !== "todas" && (
            <input type="hidden" name="filtro" value={filtro} />
          )}
          <button className="btn-secondary" type="submit">
            Buscar
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <Link
              key={c.key}
              href={`/panel/proveedores?filtro=${c.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={filtro === c.key ? "chip-active" : "chip"}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop: tabla */}
      <div className="card hidden overflow-x-auto p-0 md:block">
        <table className="w-full">
          <thead className="sticky top-0 border-b border-line bg-page">
            <tr>
              <th className="th">Proveedor</th>
              <th className="th">Categoría</th>
              <th className="th">Calificación</th>
              <th className="th">Nota</th>
              <th className="th">Próxima evaluación</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => {
              const vencida = r.proxima_evaluacion && r.proxima_evaluacion < hoy;
              const b = BADGE[r.calificacion_actual];
              return (
                <tr key={r.id} className="transition hover:bg-page">
                  <td className="td">
                    <div className="font-sans text-sm font-bold text-ink-900">
                      {r.proveedores?.razon_social}
                    </div>
                    <div className="text-xs text-ink-400">
                      RUC {r.proveedores?.ruc}
                    </div>
                  </td>
                  <td className="td text-ink-600">{r.categorias?.nombre}</td>
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
                    {vencida ? (
                      <span className="badge bg-danger-100 text-danger-600">
                        ⏱ {r.proxima_evaluacion}
                      </span>
                    ) : (
                      <span className="text-ink-600">
                        {r.proxima_evaluacion ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="td">
                    <Link
                      href={`/panel/evaluaciones/nueva?pc=${r.id}`}
                      className="rounded-lg bg-brand-100 px-3 py-2 text-xs font-bold text-brand-900 transition hover:bg-brand-900 hover:text-white"
                    >
                      Evaluar
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="td py-12 text-center text-ink-400" colSpan={6}>
                  Sin resultados para esta búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((r) => {
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
        {rows.length === 0 && (
          <p className="py-12 text-center text-sm text-ink-400">
            Sin resultados
          </p>
        )}
      </div>
    </div>
  );
}

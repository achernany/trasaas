import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CAL = [
  { key: "confiable", label: "Confiables", badge: "badge-confiable", icon: "✓", bar: "bg-ok-600" },
  { key: "medianamente_confiable", label: "Medianamente", badge: "badge-medianamente", icon: "!", bar: "bg-warn-700" },
  { key: "no_confiable", label: "No confiables", badge: "badge-no-confiable", icon: "✕", bar: "bg-danger-600" },
];

export default async function DashboardPage() {
  const supabase = createClient();
  const hoy = new Date().toISOString().slice(0, 10);
  const en30 = new Date(Date.now() + 30 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  const [
    { count: totalProveedores },
    { data: pcs },
    { count: totalEvals },
    { data: proximas },
  ] = await Promise.all([
    supabase.from("proveedores").select("*", { count: "exact", head: true }),
    supabase
      .from("proveedor_categorias")
      .select("calificacion_actual, proxima_evaluacion"),
    supabase.from("evaluaciones").select("*", { count: "exact", head: true }),
    supabase
      .from("proveedor_categorias")
      .select(
        "id, proxima_evaluacion, calificacion_actual, proveedores(razon_social, ruc), categorias(nombre)"
      )
      .not("proxima_evaluacion", "is", null)
      .order("proxima_evaluacion", { ascending: true })
      .limit(5),
  ]);

  const porCal: Record<string, number> = {};
  let vencidas = 0;
  let proximas30 = 0;
  for (const pc of pcs ?? []) {
    if (pc.calificacion_actual)
      porCal[pc.calificacion_actual] = (porCal[pc.calificacion_actual] ?? 0) + 1;
    if (pc.proxima_evaluacion) {
      if (pc.proxima_evaluacion < hoy) vencidas++;
      else if (pc.proxima_evaluacion <= en30) proximas30++;
    }
  }
  const totalPc = (pcs ?? []).length || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-600">
            Estado general de la base de proveedores
          </p>
        </div>
        <Link href="/panel/evaluaciones/nueva" className="btn">
          + Nueva evaluación
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <Kpi label="Proveedores registrados" value={totalProveedores ?? 0} />
        <Kpi label="Evaluaciones históricas" value={totalEvals ?? 0} />
        <Link
          href="/panel/proveedores?filtro=vencidas"
          className="rounded-2xl border border-danger-600/20 bg-danger-100/60 p-6 shadow-card transition hover:shadow-md"
        >
          <div className="font-display text-[34px] font-semibold leading-10 tabular-nums text-danger-600">
            {vencidas}
          </div>
          <div className="mt-1 text-sm font-semibold text-danger-600">
            Re-evaluaciones vencidas
          </div>
          <div className="mt-2 text-xs font-bold text-danger-600">
            Ver vencidas →
          </div>
        </Link>
        <Kpi label="Vencen en 30 días" value={proximas30} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <h2 className="mb-5 text-xl font-semibold">
            Clasificación vigente
          </h2>
          <div className="mb-5 flex h-4 w-full overflow-hidden rounded-full bg-page">
            {CAL.map((c) => (
              <div
                key={c.key}
                className={c.bar}
                style={{ width: `${((porCal[c.key] ?? 0) / totalPc) * 100}%` }}
                title={`${c.label}: ${porCal[c.key] ?? 0}`}
              />
            ))}
          </div>
          <div className="space-y-3">
            {CAL.map((c) => (
              <div key={c.key} className="flex items-center justify-between">
                <span className={c.badge}>
                  {c.icon} {c.label}
                </span>
                <span className="font-display text-xl font-semibold tabular-nums">
                  {porCal[c.key] ?? 0}
                  <span className="ml-2 text-sm font-normal text-ink-400">
                    {Math.round(((porCal[c.key] ?? 0) / totalPc) * 100)}%
                  </span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-ink-400">
            Umbrales LOG-P-03: Confiable ≥ 71 · Medianamente 31–70 · No
            confiable ≤ 30. Re-evaluación a 6 / 3 / 1 meses.
          </p>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold">Próximas re-evaluaciones</h2>
          <ul className="divide-y divide-line">
            {(proximas ?? []).map((p: any) => {
              const vencida = p.proxima_evaluacion < hoy;
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {p.proveedores?.razon_social}
                    </div>
                    <div className="text-xs text-ink-400">
                      {p.categorias?.nombre} ·{" "}
                      <span className={vencida ? "font-bold text-danger-600" : ""}>
                        {p.proxima_evaluacion}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/panel/evaluaciones/nueva?pc=${p.id}`}
                    className="shrink-0 rounded-lg bg-brand-100 px-3 py-2 text-xs font-bold text-brand-900 transition hover:bg-brand-900 hover:text-white"
                  >
                    Evaluar
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <div className="font-display text-[34px] font-semibold leading-10 tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-sm text-ink-600">{label}</div>
    </div>
  );
}

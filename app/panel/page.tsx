import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const CAL = [
  { key: "confiable", label: "Confiables", badge: "badge-confiable" },
  {
    key: "medianamente_confiable",
    label: "Medianamente confiables",
    badge: "badge-medianamente",
  },
  { key: "no_confiable", label: "No confiables", badge: "badge-no-confiable" },
];

export default async function DashboardPage() {
  const supabase = createClient();
  const hoy = new Date().toISOString().slice(0, 10);
  const en30 = new Date(Date.now() + 30 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  const [{ count: totalProveedores }, { data: pcs }, { count: totalEvals }] =
    await Promise.all([
      supabase.from("proveedores").select("*", { count: "exact", head: true }),
      supabase
        .from("proveedor_categorias")
        .select("calificacion_actual, proxima_evaluacion"),
      supabase.from("evaluaciones").select("*", { count: "exact", head: true }),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Estado general de la base de proveedores
          </p>
        </div>
        <Link href="/panel/evaluaciones/nueva" className="btn">
          + Nueva evaluación
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Proveedores registrados" value={totalProveedores ?? 0} />
        <Kpi label="Evaluaciones históricas" value={totalEvals ?? 0} />
        <Kpi
          label="Re-evaluaciones vencidas"
          value={vencidas}
          alert={vencidas > 0}
          href="/panel/proveedores?filtro=vencidas"
        />
        <Kpi label="Vencen en 30 días" value={proximas30} />
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold">
          Clasificación vigente por proveedor-categoría
        </h2>
        <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="bg-emerald-500"
            style={{ width: `${((porCal["confiable"] ?? 0) / totalPc) * 100}%` }}
          />
          <div
            className="bg-amber-400"
            style={{
              width: `${((porCal["medianamente_confiable"] ?? 0) / totalPc) * 100}%`,
            }}
          />
          <div
            className="bg-red-500"
            style={{
              width: `${((porCal["no_confiable"] ?? 0) / totalPc) * 100}%`,
            }}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CAL.map((c) => (
            <div
              key={c.key}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
            >
              <span className={c.badge}>{c.label}</span>
              <span className="text-2xl font-semibold">
                {porCal[c.key] ?? 0}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Umbrales LOG-P-03: Confiable ≥ 71 · Medianamente confiable 31–70 · No
          confiable ≤ 30. Re-evaluación a 6 / 3 / 1 meses según calificación.
        </p>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  alert,
  href,
}: {
  label: string;
  value: number;
  alert?: boolean;
  href?: string;
}) {
  const inner = (
    <div className="card transition hover:shadow-md">
      <div
        className={`text-3xl font-semibold tracking-tight ${alert ? "text-red-600" : ""}`}
      >
        {value}
      </div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

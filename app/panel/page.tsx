import { createClient } from "@/lib/supabase/server";

const CAL_LABEL: Record<string, string> = {
  confiable: "Confiables",
  medianamente_confiable: "Medianamente confiables",
  no_confiable: "No confiables",
};

export default async function DashboardPage() {
  const supabase = createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const [{ count: totalProveedores }, { data: pcs }, { count: totalEvals }] =
    await Promise.all([
      supabase
        .from("proveedores")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("proveedor_categorias")
        .select("calificacion_actual, proxima_evaluacion"),
      supabase
        .from("evaluaciones")
        .select("*", { count: "exact", head: true }),
    ]);

  const porCalificacion: Record<string, number> = {};
  let vencidas = 0;
  let proximas30 = 0;
  const en30 = new Date(Date.now() + 30 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  for (const pc of pcs ?? []) {
    if (pc.calificacion_actual)
      porCalificacion[pc.calificacion_actual] =
        (porCalificacion[pc.calificacion_actual] ?? 0) + 1;
    if (pc.proxima_evaluacion) {
      if (pc.proxima_evaluacion < hoy) vencidas++;
      else if (pc.proxima_evaluacion <= en30) proximas30++;
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Proveedores" value={totalProveedores ?? 0} />
        <Kpi label="Evaluaciones registradas" value={totalEvals ?? 0} />
        <Kpi
          label="Re-evaluaciones vencidas"
          value={vencidas}
          alert={vencidas > 0}
        />
        <Kpi label="Vencen en 30 días" value={proximas30} />
      </div>

      <div className="card">
        <h2 className="mb-3 font-medium">
          Calificación vigente por proveedor-categoría
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {Object.entries(CAL_LABEL).map(([key, label]) => (
            <div
              key={key}
              className="rounded-lg border border-slate-200 p-4 text-center"
            >
              <div className="text-2xl font-semibold">
                {porCalificacion[key] ?? 0}
              </div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  alert,
}: {
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div className="card">
      <div
        className={`text-2xl font-semibold ${alert ? "text-red-600" : ""}`}
      >
        {value}
      </div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

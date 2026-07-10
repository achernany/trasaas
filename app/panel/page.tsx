import Link from "next/link";
import {
  Users,
  ClipboardList,
  AlarmClock,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

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
    { data: evalsFechas },
  ] = await Promise.all([
    supabase.from("proveedores").select("*", { count: "exact", head: true }),
    supabase
      .from("proveedor_categorias")
      .select("calificacion_actual, proxima_evaluacion, nota_actual, categorias(nombre)"),
    supabase.from("evaluaciones").select("*", { count: "exact", head: true }),
    supabase
      .from("proveedor_categorias")
      .select(
        "id, proxima_evaluacion, calificacion_actual, proveedores(razon_social, ruc), categorias(nombre)"
      )
      .not("proxima_evaluacion", "is", null)
      .order("proxima_evaluacion", { ascending: true })
      .limit(5),
    supabase
      .from("evaluaciones")
      .select("fecha")
      .order("fecha", { ascending: false })
      .limit(1000),
  ]);

  const porCal: Record<string, number> = {};
  let vencidas = 0;
  let proximas30 = 0;
  let conFecha = 0;
  let vigentes = 0;
  const porCat: Record<string, { suma: number; n: number }> = {};

  for (const pc of (pcs ?? []) as any[]) {
    if (pc.calificacion_actual)
      porCal[pc.calificacion_actual] = (porCal[pc.calificacion_actual] ?? 0) + 1;
    if (pc.proxima_evaluacion) {
      conFecha++;
      if (pc.proxima_evaluacion < hoy) vencidas++;
      else {
        vigentes++;
        if (pc.proxima_evaluacion <= en30) proximas30++;
      }
    }
    const cat = pc.categorias?.nombre;
    if (cat && pc.nota_actual != null) {
      porCat[cat] = porCat[cat] ?? { suma: 0, n: 0 };
      porCat[cat].suma += Number(pc.nota_actual);
      porCat[cat].n++;
    }
  }
  const totalPc = (pcs ?? []).length || 1;
  const pctVigente = conFecha ? Math.round((vigentes / conFecha) * 100) : 0;

  // evaluaciones por mes (últimos 6 meses)
  const meses: { label: string; n: number }[] = [];
  const ahora = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const clave = d.toISOString().slice(0, 7);
    const n = (evalsFechas ?? []).filter((e: any) =>
      e.fecha?.startsWith(clave)
    ).length;
    meses.push({ label: MESES[d.getMonth()], n });
  }
  const maxMes = Math.max(1, ...meses.map((m) => m.n));

  // top 5 categorías por nota promedio
  const cats = Object.entries(porCat)
    .map(([nombre, { suma, n }]) => ({ nombre, avg: suma / n, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 5)
    .sort((a, b) => b.avg - a.avg);

  const CAL = [
    {
      key: "confiable",
      label: "Confiables",
      badge: "badge-confiable",
      Icon: CheckCircle2,
      bar: "bg-ok-600",
      tip: "Puntaje ≥ 71. Aprobado, seguimiento normal. Re-evaluación a los 6 meses.",
    },
    {
      key: "medianamente_confiable",
      label: "Medianamente confiables",
      badge: "badge-medianamente",
      Icon: AlertTriangle,
      bar: "bg-warn-700",
      tip: "Puntaje 31–70. Aprobado con reserva. Re-evaluación a los 3 meses.",
    },
    {
      key: "no_confiable",
      label: "No confiables",
      badge: "badge-no-confiable",
      Icon: XCircle,
      bar: "bg-danger-600",
      tip: "Puntaje ≤ 30. No aprobado. Si se usa por excepción, re-evaluación al mes.",
    },
  ];

  // radial
  const R = 42;
  const C = 2 * Math.PI * R;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-400">
            Estado general de la base de proveedores
          </p>
        </div>
        <Link href="/panel/evaluaciones/nueva" className="btn">
          + Nueva evaluación
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <KpiLink
          href="/panel/proveedores"
          Icon={Users}
          value={totalProveedores ?? 0}
          label="Proveedores registrados"
          tip="Empresas con registro en la base. Clic para ver el listado."
        />
        <KpiLink
          href="/panel/evaluaciones"
          Icon={ClipboardList}
          value={totalEvals ?? 0}
          label="Evaluaciones históricas"
          tip="Todas las fichas de selección y evaluación. Clic para ver el historial."
        />
        <Link
          href="/panel/proveedores?filtro=vencidas"
          title="Proveedores cuya re-evaluación ya venció. Clic para verlos."
          className="card card-hover border-danger-600/20 bg-danger-100/60"
        >
          <AlarmClock className="mb-2 h-5 w-5 text-danger-600" />
          <div className="font-display text-[32px] font-semibold leading-9 tabular-nums text-danger-600">
            {vencidas}
          </div>
          <div className="mt-1 text-sm font-semibold text-danger-600">
            Re-evaluaciones vencidas
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold text-danger-600">
            Ver vencidas <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
        <KpiLink
          href="/panel/proveedores?filtro=por_vencer"
          Icon={CalendarClock}
          value={proximas30}
          label="Vencen en 30 días"
          tip="Re-evaluaciones que vencerán en los próximos 30 días."
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Cumplimiento de re-evaluación */}
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-900" />
            <h2 className="text-sm font-bold">Salud de auditoría</h2>
          </div>
          <div className="flex items-center gap-5">
            <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="#E4E7EE"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={pctVigente >= 70 ? "#1F9D63" : pctVigente >= 40 ? "#E0921F" : "#DC3546"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(pctVigente / 100) * C} ${C}`}
                className="transition-all duration-700"
              />
            </svg>
            <div>
              <div className="font-display text-3xl font-bold tabular-nums">
                {pctVigente}%
              </div>
              <p className="text-[12px] leading-4 text-ink-400">
                de proveedores con re-evaluación vigente
              </p>
              <p className="mt-1 text-[11px] text-ink-400">
                {vigentes} al día · {vencidas} vencidas
              </p>
            </div>
          </div>
        </div>

        {/* Evaluaciones por mes */}
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-900" />
            <h2 className="text-sm font-bold">Evaluaciones por mes</h2>
          </div>
          <div className="flex h-28 items-end gap-2">
            {meses.map((m, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-bold tabular-nums text-ink-600">
                  {m.n}
                </span>
                <div
                  className={`w-full rounded-t-md transition-all duration-700 ${
                    i === meses.length - 1 ? "bg-brand-900" : "bg-brand-100"
                  }`}
                  style={{ height: `${Math.max(6, (m.n / maxMes) * 72)}px` }}
                  title={`${m.label}: ${m.n}`}
                />
                <span className="text-[10px] text-ink-400">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nota promedio por categoría */}
        <div className="card">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-900" />
            <h2 className="text-sm font-bold">Nota promedio por categoría</h2>
          </div>
          <div className="space-y-2.5">
            {cats.map((c) => (
              <div key={c.nombre}>
                <div className="mb-0.5 flex justify-between text-[11px]">
                  <span className="max-w-[70%] truncate text-ink-600">
                    {c.nombre}
                  </span>
                  <span className="font-bold tabular-nums">
                    {c.avg.toFixed(1)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-page">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      c.avg >= 71 ? "bg-ok-600" : c.avg >= 31 ? "bg-warn-700" : "bg-danger-600"
                    }`}
                    style={{ width: `${Math.min(100, c.avg)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <h2 className="mb-5 text-xl font-semibold">Clasificación vigente</h2>
          <div className="mb-5 flex h-4 w-full overflow-hidden rounded-full bg-page">
            {CAL.map((c) => (
              <div
                key={c.key}
                className={`${c.bar} transition-all`}
                style={{ width: `${((porCal[c.key] ?? 0) / totalPc) * 100}%` }}
                title={`${c.label}: ${porCal[c.key] ?? 0}`}
              />
            ))}
          </div>
          <div className="space-y-3">
            {CAL.map((c) => (
              <Link
                key={c.key}
                href={`/panel/proveedores?filtro=${c.key}`}
                title={c.tip}
                className="flex cursor-pointer items-center justify-between rounded-xl px-2 py-1.5 transition hover:bg-page"
              >
                <span className={c.badge}>
                  <c.Icon className="h-3.5 w-3.5" /> {c.label}
                </span>
                <span className="font-display text-xl font-semibold tabular-nums">
                  {porCal[c.key] ?? 0}
                  <span className="ml-2 text-sm font-normal text-ink-400">
                    {Math.round(((porCal[c.key] ?? 0) / totalPc) * 100)}%
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <ul className="mt-5 list-disc space-y-1 pl-5 text-xs leading-relaxed text-ink-400">
            <li>Confiable: puntaje ≥ 71 · re-evaluación a los 6 meses</li>
            <li>Medianamente confiable: 31–70 · re-evaluación a los 3 meses</li>
            <li>No confiable: ≤ 30 · re-evaluación al mes (si se usa por excepción)</li>
            <li>Umbrales según procedimiento LOG-P-03 · configurables por matriz</li>
          </ul>
        </div>

        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Próximas re-evaluaciones</h2>
            <Link
              href="/panel/proveedores?filtro=vencidas"
              className="flex items-center gap-1 text-xs font-bold text-brand-900 hover:underline"
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {(proximas ?? []).map((p: any) => {
              const vencida = p.proxima_evaluacion < hoy;
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {p.proveedores?.razon_social}
                    </div>
                    <div className="text-xs text-ink-400">
                      {p.categorias?.nombre} ·{" "}
                      <span
                        className={vencida ? "font-bold text-danger-600" : ""}
                      >
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

function KpiLink({
  href,
  Icon,
  value,
  label,
  tip,
}: {
  href: string;
  Icon: any;
  value: number;
  label: string;
  tip: string;
}) {
  return (
    <Link href={href} title={tip} className="card card-hover">
      <Icon className="mb-2 h-5 w-5 text-brand-700" />
      <div className="font-display text-[32px] font-semibold leading-9 tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-sm text-ink-600">{label}</div>
    </Link>
  );
}

import Link from "next/link";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlarmClock,
  CalendarClock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Paginator from "@/components/Paginator";
import ExportarPeriodo from "@/components/ExportarPeriodo";
import ProveedoresTabla, { type PcRow } from "@/components/ProveedoresTabla";

export const dynamic = "force-dynamic";

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: { q?: string; filtro?: string; page?: string; per?: string };
}) {
  const supabase = createClient();
  const q = (searchParams.q ?? "").trim();
  const filtro = searchParams.filtro ?? "todas";
  const per = Math.min(50, Math.max(8, Number(searchParams.per) || 8));
  const hoy = new Date().toISOString().slice(0, 10);
  const en30 = new Date(Date.now() + 30 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: pcs } = await supabase
    .from("proveedor_categorias")
    .select(
      "id, suministro, calificacion_actual, nota_actual, proxima_evaluacion, proveedores(id, ruc, razon_social, distrito, clasificacion), categorias(id, nombre)"
    )
    .order("proxima_evaluacion", { ascending: true })
    .limit(500);

  let rows = (pcs ?? []) as unknown as PcRow[];
  const conteos = {
    todas: rows.length,
    confiable: rows.filter((r) => r.calificacion_actual === "confiable").length,
    medianamente_confiable: rows.filter(
      (r) => r.calificacion_actual === "medianamente_confiable"
    ).length,
    no_confiable: rows.filter((r) => r.calificacion_actual === "no_confiable")
      .length,
    vencidas: rows.filter(
      (r) => r.proxima_evaluacion && r.proxima_evaluacion < hoy
    ).length,
    por_vencer: rows.filter(
      (r) =>
        r.proxima_evaluacion &&
        r.proxima_evaluacion >= hoy &&
        r.proxima_evaluacion <= en30
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
    rows = rows.filter(
      (r) => r.proxima_evaluacion && r.proxima_evaluacion < hoy
    );
  else if (filtro === "por_vencer")
    rows = rows.filter(
      (r) =>
        r.proxima_evaluacion &&
        r.proxima_evaluacion >= hoy &&
        r.proxima_evaluacion <= en30
    );
  else if (filtro === "criticos")
    rows = rows.filter(
      (r: any) => r.proveedores?.clasificacion === "critico"
    );
  else if (filtro === "regulares" || filtro === "no_criticos")
    rows = rows.filter(
      (r: any) => r.proveedores?.clasificacion !== "critico"
    );
  else if (filtro !== "todas")
    rows = rows.filter((r) => r.calificacion_actual === filtro);

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / per));
  const page = Math.min(pages, Math.max(1, Number(searchParams.page) || 1));
  const visibles = rows.slice((page - 1) * per, page * per);

  const nCriticos = ((pcs ?? []) as any[]).filter(
    (r: any) => r.proveedores?.clasificacion === "critico"
  ).length;
  const chips = [
    { key: "todas", label: `Todas (${conteos.todas})`, Icon: Users },
    {
      key: "criticos",
      label: `Críticos (${nCriticos})`,
      Icon: XCircle,
    },
    {
      key: "no_criticos",
      label: `No críticos (${conteos.todas - nCriticos})`,
      Icon: CheckCircle2,
    },
    {
      key: "vencidas",
      label: `Vencidas (${conteos.vencidas})`,
      Icon: AlarmClock,
    },
    {
      key: "por_vencer",
      label: `Vencen en 30d (${conteos.por_vencer})`,
      Icon: CalendarClock,
    },
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
              {total} registros por proveedor-categoría · clic en una fila para
              ver el detalle
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportarPeriodo tipo="proveedores" />
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
            placeholder="Buscar proveedor, RUC o categoría…"
            className="input h-10 max-w-md text-[13px]"
          />
          {filtro !== "todas" && (
            <input type="hidden" name="filtro" value={filtro} />
          )}
          <button className="btn-secondary min-h-[40px]" type="submit">
            Buscar
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <Link
              key={c.key}
              href={`/panel/proveedores?filtro=${c.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`${filtro === c.key ? "chip-active" : "chip"} min-h-[30px] px-3 text-[12px]`}
            >
              <c.Icon className="h-3.5 w-3.5" /> {c.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="card mt-3 overflow-hidden p-0">
        <ProveedoresTabla rows={visibles} hoy={hoy} />
        <Paginator
          total={total}
          page={page}
          per={per}
          basePath="/panel/proveedores"
          params={{
            q,
            filtro: filtro !== "todas" ? filtro : undefined,
            per: String(per),
          }}
        />
      </div>
    </div>
  );
}

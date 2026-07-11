import Link from "next/link";
import { ShieldAlert, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ESTADO: Record<string, string> = {
  vigente: "badge-confiable",
  archivada:
    "inline-flex items-center gap-1 rounded-full bg-page px-2.5 py-0.5 text-[11px] font-bold text-ink-400",
  borrador: "badge-medianamente",
};

export default async function MatricesPage() {
  const supabase = createClient();
  const { data: matrices } = await supabase
    .from("matrices")
    .select("id, nombre, tipo, clasificacion, version, estado, creado_en, criterios(count)")
    .order("estado", { ascending: false })
    .order("tipo")
    .order("version", { ascending: false });

  const rows = (matrices ?? []) as any[];

  return (
    <div>
      <div className="page-head flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Matrices de evaluación
          </h1>
          <p className="text-[12px] text-ink-400">
            Cada evaluación conserva la versión de matriz con la que fue hecha
            · editar crea una nueva versión y archiva la anterior
          </p>
        </div>
        <Link
          href="/panel/configuracion"
          className="text-sm text-slate-500 hover:underline"
        >
          ← Configuración
        </Link>
      </div>

      <div className="card mt-3 overflow-hidden p-0">
        <table className="w-full">
          <thead className="border-b border-line bg-page">
            <tr>
              <th className="th">Matriz</th>
              <th className="th">Proceso</th>
              <th className="th">Aplica a</th>
              <th className="th">Versión</th>
              <th className="th">Criterios</th>
              <th className="th">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((m) => (
              <tr key={m.id} className="transition hover:bg-brand-100/40">
                <td className="td py-3">
                  <Link
                    href={`/panel/configuracion/matrices/${m.id}`}
                    className="font-sans text-[12px] font-bold text-brand-900 hover:underline"
                  >
                    {m.nombre}
                  </Link>
                </td>
                <td className="td py-3 capitalize text-ink-600">
                  {m.tipo === "seleccion" ? "Selección" : "Evaluación"}
                </td>
                <td className="td py-3">
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-600">
                    {m.clasificacion === "critico" ? (
                      <>
                        <ShieldAlert className="h-3.5 w-3.5 text-alfa-red" />
                        Crítico
                      </>
                    ) : (
                      <>
                        <Shield className="h-3.5 w-3.5 text-brand-700" />
                        Regular
                      </>
                    )}
                  </span>
                </td>
                <td className="td py-3 font-mono text-[11px]">v{m.version}</td>
                <td className="td py-3 text-ink-600">
                  {m.criterios?.[0]?.count ?? 0}
                </td>
                <td className="td py-3">
                  <span className={ESTADO[m.estado] ?? "badge-neutral"}>
                    {m.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

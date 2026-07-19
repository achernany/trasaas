import Link from "next/link";
import { Scale, FileCheck2, Clock3, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ESTADO: Record<string, { cls: string; label: string; Icon: any }> = {
  borrador: { cls: "badge bg-page text-ink-600", label: "Borrador", Icon: Clock3 },
  enviado: { cls: "badge-medianamente", label: "Pend. aprobación", Icon: Clock3 },
  aprobado: { cls: "badge-confiable", label: "Aprobado", Icon: FileCheck2 },
  aprobado_parcial: {
    cls: "badge-medianamente",
    label: "Aprobado parcial",
    Icon: FileCheck2,
  },
  rechazado: { cls: "badge-no-confiable", label: "Rechazado", Icon: XCircle },
  reenviado: { cls: "badge-medianamente", label: "Reenviado", Icon: Clock3 },
};

export default async function CuadrosPage() {
  const supabase = createClient();
  const { data: cuadros } = await supabase
    .from("cuadros")
    .select(
      "id, codigo, estado, enviado_en, moneda, creado_en, requerimientos(ticket_avandesk, tipo, area_solicitante), proveedores(razon_social)"
    )
    .order("creado_en", { ascending: false })
    .limit(100);

  const rows = (cuadros ?? []) as any[];

  return (
    <div>
      <div className="page-head flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Cuadros Comparativos
          </h1>
          <p className="text-[12px] text-ink-400">
            {rows.length} cuadros · del requerimiento a la aprobación, con
            sustento
          </p>
        </div>
        <Link href="/panel/cuadros/nuevo" className="btn">
          + Nuevo cuadro
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="card mt-3 py-14 text-center">
          <Scale className="mx-auto mb-3 h-10 w-10 text-ink-400" />
          <h2 className="text-lg font-semibold">Aún no hay cuadros</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-400">
            Crea el primero: ticket de AvanDesk, ítems, cotizaciones de
            proveedores clasificados y el sistema calcula el recomendado con la
            matriz ponderada.
          </p>
          
        </div>
      ) : (
        <div className="card mt-3 overflow-hidden p-0">
          <div className="h-[calc(100vh-350px)] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-[5] border-b border-line bg-page">
              <tr>
                <th className="th">Código</th>
                <th className="th">Ticket</th>
                <th className="th">Área</th>
                <th className="th">Tipo</th>
                <th className="th">Recomendado</th>
                <th className="th">Estado</th>
                <th className="th">SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => {
                const e = ESTADO[c.estado] ?? ESTADO.borrador;
                return (
                  <tr key={c.id} className="transition hover:bg-brand-100/40">
                    <td className="td py-3">
                      <Link
                        href={`/panel/cuadros/${c.id}`}
                        className="font-mono text-[11px] font-bold text-brand-900 hover:underline"
                      >
                        {c.codigo}
                      </Link>
                    </td>
                    <td className="td py-3 font-bold">
                      {c.requerimientos?.ticket_avandesk}
                    </td>
                    <td className="td py-3 text-ink-600">
                      {c.requerimientos?.area_solicitante ?? "—"}
                    </td>
                    <td className="td py-3 capitalize text-ink-600">
                      {c.requerimientos?.tipo}
                    </td>
                    <td className="td max-w-[220px] truncate py-3 font-semibold">
                      {c.proveedores?.razon_social ?? "—"}
                    </td>
                    <td className="td py-3">
                      <span className={e.cls}>
                        <e.Icon className="h-3.5 w-3.5" /> {e.label}
                      </span>
                    </td>
                    <td className="td py-3">
                      {(c.estado === "enviado" || c.estado === "reenviado") &&
                      c.enviado_en ? (
                        (() => {
                          const dias = Math.floor(
                            (Date.now() - new Date(c.enviado_en).getTime()) /
                              86400000
                          );
                          return (
                            <span
                              className={`font-mono text-[11px] font-bold ${
                                dias >= 3
                                  ? "text-danger-600"
                                  : dias >= 1
                                    ? "text-warn-700"
                                    : "text-ink-400"
                              }`}
                              title={`Enviado hace ${dias} día(s) sin resolución`}
                            >
                              {dias}d
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-[11px] text-ink-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AprobarCuadro from "@/components/AprobarCuadro";
import PrintButton from "@/components/PrintButton";
import ExpedienteCompra from "@/components/ExpedienteCompra";

export const dynamic = "force-dynamic";

const ESTADO: Record<string, { cls: string; label: string }> = {
  borrador: { cls: "badge bg-page text-ink-600", label: "Borrador" },
  enviado: { cls: "badge-medianamente", label: "Pendiente de aprobación" },
  aprobado: { cls: "badge-confiable", label: "Aprobado" },
  rechazado: { cls: "badge-no-confiable", label: "Rechazado" },
  reenviado: { cls: "badge-medianamente", label: "Reenviado" },
};

export default async function CuadroDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: c } = await supabase
    .from("cuadros")
    .select(
      `id, codigo, estado, moneda, matriz_pesos, justificacion, creado_en, alerta_precio, aprobadores(nombre, email, area),
       requerimientos(ticket_avandesk, tipo, area_solicitante, proyectos(nombre)),
       proveedores(id, razon_social),
       usuarios(nombre),
       cuadro_items(id, orden, descripcion, cantidad, unidad),
       cotizaciones(id, proveedor_id, lugar_entrega, tiempo_entrega_dias, condicion_pago, garantia, puntaje_total, proveedores(razon_social, ruc), cotizacion_precios(item_id, precio_unitario)),
       aprobaciones(accion, comentario, resuelto_en, usuarios(nombre)),
       cuadro_documentos(id, tipo, nombre, archivo_url, creado_en)`
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!c) notFound();
  const cu = c as any;
  const items = [...(cu.cuadro_items ?? [])].sort(
    (a: any, b: any) => a.orden - b.orden
  );
  const cots = [...(cu.cotizaciones ?? [])].sort(
    (a: any, b: any) => Number(b.puntaje_total ?? 0) - Number(a.puntaje_total ?? 0)
  );
  const est = ESTADO[cu.estado] ?? ESTADO.borrador;

  const totalDe = (cot: any) =>
    items.reduce((s: number, it: any) => {
      const p = (cot.cotizacion_precios ?? []).find(
        (x: any) => x.item_id === it.id
      );
      return s + Number(p?.precio_unitario ?? 0) * Number(it.cantidad);
    }, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="no-print flex items-center justify-between">
        <Link
          href="/panel/cuadros"
          className="flex items-center gap-1 text-sm text-ink-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Comparativos
        </Link>
        <PrintButton />
      </div>

      <div className="card space-y-5 p-8">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Alfa Co S.A.C. · Cuadro comparativo LOG-GN-F-P02-07
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              Ticket {cu.requerimientos?.ticket_avandesk}
              <span className="ml-2 capitalize text-ink-400">
                · {cu.requerimientos?.tipo}
              </span>
            </h1>
            <p className="text-sm text-ink-600">
              {cu.requerimientos?.area_solicitante ?? ""}
              {cu.requerimientos?.proyectos?.nombre
                ? ` · ${cu.requerimientos.proyectos.nombre}`
                : ""}
            </p>
          </div>
          <div className="text-right">
            <span className={est.cls}>{est.label}</span>
            <div className="mt-1 font-mono text-[11px] text-ink-400">
              {cu.codigo}
            </div>
          </div>
        </div>

        {/* Tabla comparativa */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line text-left text-[10.5px] uppercase text-ink-400">
                <th className="py-2 pr-3">Ítem</th>
                {cots.map((cot: any) => (
                  <th key={cot.id} className="px-3 py-2">
                    <div className="max-w-[140px] truncate font-bold text-ink-900">
                      {cot.proveedores?.razon_social}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-[12px]">
              {items.map((it: any) => (
                <tr key={it.id}>
                  <td className="py-2 pr-3">
                    <span className="font-semibold">{it.descripcion}</span>
                    <span className="text-ink-400">
                      {" "}
                      × {Number(it.cantidad)} {it.unidad}
                    </span>
                  </td>
                  {cots.map((cot: any) => {
                    const p = (cot.cotizacion_precios ?? []).find(
                      (x: any) => x.item_id === it.id
                    );
                    return (
                      <td key={cot.id} className="px-3 py-2 tabular-nums">
                        S/ {Number(p?.precio_unitario ?? 0).toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-page font-bold">
                <td className="py-2 pr-3">TOTAL ({cu.moneda})</td>
                {cots.map((cot: any) => (
                  <td key={cot.id} className="px-3 py-2 tabular-nums">
                    S/ {totalDe(cot).toFixed(2)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 pr-3 text-ink-600">Lugar de entrega</td>
                {cots.map((cot: any) => (
                  <td key={cot.id} className="px-3 py-2 capitalize text-ink-600">
                    {cot.lugar_entrega}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 pr-3 text-ink-600">Tiempo (días)</td>
                {cots.map((cot: any) => (
                  <td key={cot.id} className="px-3 py-2 tabular-nums text-ink-600">
                    {cot.tiempo_entrega_dias ?? "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 pr-3 text-ink-600">Pago</td>
                {cots.map((cot: any) => (
                  <td key={cot.id} className="px-3 py-2 text-ink-600">
                    {cot.condicion_pago ?? "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 pr-3 text-ink-600">Garantía</td>
                {cots.map((cot: any) => (
                  <td key={cot.id} className="px-3 py-2 text-ink-600">
                    {cot.garantia ?? "—"}
                  </td>
                ))}
              </tr>
              <tr className="border-t-2 border-ink-900">
                <td className="py-3 pr-3 font-bold">PUNTAJE (máx. 100)</td>
                {cots.map((cot: any) => {
                  const ganador = cot.proveedor_id === cu.proveedores?.id;
                  return (
                    <td key={cot.id} className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 font-display text-xl font-bold tabular-nums ${ganador ? "text-ok-600" : ""}`}
                      >
                        {ganador && <Trophy className="h-4 w-4" />}
                        {Number(cot.puntaje_total ?? 0)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-ok-600/30 bg-ok-100/40 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-ok-600">
            Proveedor recomendado
          </div>
          <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-ok-600" />
            {cu.proveedores?.razon_social}
          </div>
          {cu.justificacion && (
            <p className="mt-1 text-sm text-ink-600">{cu.justificacion}</p>
          )}
        </div>

        {(cu.aprobaciones ?? []).length > 0 && (
          <div className="border-t border-line pt-4">
            <h3 className="mb-2 text-sm font-bold">Aprobaciones</h3>
            <ul className="space-y-1 text-sm">
              {cu.aprobaciones.map((a: any, i: number) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      a.accion === "aprobado"
                        ? "badge-confiable"
                        : "badge-no-confiable"
                    }
                  >
                    {a.accion}
                  </span>
                  <span className="font-semibold">{a.usuarios?.nombre}</span>
                  <span className="text-ink-400">
                    {a.resuelto_en?.slice(0, 16).replace("T", " ")}
                  </span>
                  {a.comentario && (
                    <span className="text-ink-600">— {a.comentario}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-line pt-3 text-xs text-ink-400">
          <span>Elaborado por {cu.usuarios?.nombre ?? "—"}</span>
          <span className="font-mono">
            {cu.id.slice(0, 8).toUpperCase()}·{cu.creado_en?.slice(0, 10)}
          </span>
        </div>
      </div>

      {cu.estado === "enviado" && (
        <div className="no-print">
          <AprobarCuadro cuadroId={cu.id} ganadorId={cu.proveedores?.id ?? null} />
        </div>
      )}

      <div className="no-print">
        <ExpedienteCompra
          cuadroId={cu.id}
          documentos={(cu.cuadro_documentos ?? []) as any}
          estado={cu.estado}
          cotizaciones={cots.map((c: any) => ({
            proveedor_id: c.proveedor_id,
            razon_social: c.proveedores?.razon_social ?? "—",
          }))}
        />
      </div>
    </div>
  );
}

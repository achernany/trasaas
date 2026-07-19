import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy, ArrowLeft, TriangleAlert, ShieldAlert, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AprobarCuadro from "@/components/AprobarCuadro";
import PrintButton from "@/components/PrintButton";
import ExpedienteCompra from "@/components/ExpedienteCompra";

export const dynamic = "force-dynamic";

const IGV = 0.18;

const ESTADO: Record<string, { cls: string; label: string }> = {
  borrador: { cls: "badge bg-page text-ink-600", label: "Borrador" },
  enviado: { cls: "badge-medianamente", label: "Pendiente de aprobación" },
  aprobado: { cls: "badge-confiable", label: "Aprobado" },
  aprobado_parcial: { cls: "badge-medianamente", label: "Aprobado parcialmente" },
  rechazado: { cls: "badge-no-confiable", label: "Rechazado" },
  reenviado: { cls: "badge-medianamente", label: "Reenviado" },
};

const ITEM_ESTADO: Record<string, { cls: string; label: string }> = {
  pendiente: { cls: "bg-page text-ink-600", label: "Pendiente" },
  aprobado: { cls: "bg-ok-100 text-ok-600", label: "Aprobado" },
  no_aprobado: { cls: "bg-warn-100 text-warn-700", label: "No aprobado" },
  descartado: { cls: "bg-page text-ink-400", label: "Descartado" },
  recomprado: { cls: "bg-brand-100 text-brand-900", label: "En otro comparativo" },
};

const CRITERIOS: { k: string; t: string; max: number }[] = [
  { k: "precio", t: "Precio (ranking)", max: 30 },
  { k: "pago", t: "Condición de pago", max: 20 },
  { k: "lugar", t: "Lugar de entrega", max: 15 },
  { k: "tiempo", t: "Tiempo de entrega", max: 15 },
  { k: "garantia", t: "Garantía", max: 10 },
  { k: "feedback", t: "Feedback / evaluación", max: 10 },
];

const money = (n: number, m = "S/") =>
  `${m} ${n.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default async function CuadroDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: c } = await supabase
    .from("cuadros")
    .select(
      `id, codigo, estado, moneda, matriz_pesos, justificacion, creado_en, alerta_precio,
       tiempo_requerido_dias, enviado_en, resuelto_en, proveedor_ganador_id,
       aprobadores(nombre, email, area),
       requerimientos(ticket_avandesk, tipo, area_solicitante, proyectos(nombre)),
       proveedores(id, razon_social, ruc, clasificacion),
       usuarios(nombre),
       cuadro_items(id, orden, descripcion, cantidad, unidad, codigo_sig, precio_historico, fecha_ultima_compra, estado_aprobacion, observacion_aprobador),
       cotizaciones(id, proveedor_id, lugar_entrega, tiempo_entrega_dias, condicion_pago, garantia, puntaje_total, puntajes, proveedores(razon_social, ruc, clasificacion), cotizacion_precios(item_id, precio_unitario, especificacion)),
       aprobaciones(accion, comentario, resuelto_en, usuarios(nombre)),
       cuadro_documentos(id, tipo, nombre, archivo_url, creado_en)`
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!c) notFound();
  const cu = c as any;
  const moneda = cu.moneda === "USD" ? "US$" : "S/";
  const items = [...(cu.cuadro_items ?? [])].sort(
    (a: any, b: any) => a.orden - b.orden
  );
  const cots = [...(cu.cotizaciones ?? [])].sort(
    (a: any, b: any) =>
      Number(b.puntaje_total ?? 0) - Number(a.puntaje_total ?? 0)
  );
  const est = ESTADO[cu.estado] ?? ESTADO.borrador;

  const pu = (cot: any, itemId: string) =>
    Number(
      (cot.cotizacion_precios ?? []).find((x: any) => x.item_id === itemId)
        ?.precio_unitario ?? 0
    );
  const espec = (cot: any, itemId: string) =>
    (cot.cotizacion_precios ?? []).find((x: any) => x.item_id === itemId)
      ?.especificacion ?? "";

  const subtotalDe = (cot: any) =>
    items.reduce(
      (s: number, it: any) => s + pu(cot, it.id) * Number(it.cantidad),
      0
    );

  const totalHistorico = items.reduce(
    (s: number, it: any) =>
      s + Number(it.precio_historico ?? 0) * Number(it.cantidad),
    0
  );

  const ganador =
    cots.find((x: any) => x.proveedor_id === cu.proveedor_ganador_id) ?? null;
  const subGanador = ganador ? subtotalDe(ganador) : 0;
  const ahorro = totalHistorico > 0 ? totalHistorico - subGanador : 0;
  const pctAhorro =
    totalHistorico > 0 ? Math.round((ahorro / totalHistorico) * 100) : 0;

  const itemsNoAprobados = items.filter(
    (it: any) => it.estado_aprobacion === "no_aprobado"
  );
  const puedeResolver = cu.estado === "enviado" || cu.estado === "reenviado";

  return (
    <div className="mx-auto max-w-6xl space-y-4">
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
        {/* ---------- Membrete ---------- */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Alfa Co S.A.C. · Cuadro comparativo LOG-GN-F-P02-07 (LOGFP0202)
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
              {cu.tiempo_requerido_dias
                ? ` · plazo requerido ${cu.tiempo_requerido_dias} días`
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

        {cu.alerta_precio && (
          <div className="flex items-start gap-2 rounded-xl border border-danger-600/30 bg-danger-100/40 p-3 text-[12px] text-danger-600">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <b>Alerta de precio:</b> al menos un ítem del proveedor
              seleccionado supera el precio histórico del ERP. Requiere
              sustento y aprobación del nivel correspondiente.
            </span>
          </div>
        )}

        {/* ---------- Cuadro oficial ---------- */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-ink-950 text-left text-[9.5px] uppercase tracking-wide text-white">
                <th className="border border-line/20 px-2 py-2">N°</th>
                <th className="border border-line/20 px-2 py-2">Cód. SIG</th>
                <th className="border border-line/20 px-2 py-2">
                  Bien / Servicio
                </th>
                <th className="border border-line/20 px-2 py-2 text-right">
                  Cant.
                </th>
                <th className="border border-line/20 px-2 py-2">Und.</th>
                <th className="border border-line/20 px-2 py-2">
                  Fecha últ. compra
                </th>
                <th className="border border-line/20 px-2 py-2 text-right">
                  Precio histórico
                </th>
                <th className="border border-line/20 px-2 py-2 text-right">
                  Total histórico
                </th>
                {cots.map((cot: any) => (
                  <th
                    key={cot.id}
                    colSpan={3}
                    className="border border-line/20 px-2 py-2 text-center"
                  >
                    <span className="block max-w-[220px] truncate font-bold">
                      {cot.proveedores?.razon_social}
                    </span>
                    <span className="font-mono text-[9px] font-normal text-white/50">
                      RUC {cot.proveedores?.ruc}
                    </span>
                  </th>
                ))}
              </tr>
              <tr className="bg-ink-950/90 text-left text-[9px] uppercase text-white/70">
                <th colSpan={8} className="border border-line/20 px-2 py-1" />
                {cots.map((cot: any) => (
                  <Fragment key={cot.id}>
                    <th className="border border-line/20 px-2 py-1 text-right">
                      P.U.
                    </th>
                    <th className="border border-line/20 px-2 py-1 text-right">
                      Total
                    </th>
                    <th className="border border-line/20 px-2 py-1">
                      Espec. / marca
                    </th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="text-[11.5px]">
              {items.map((it: any, i: number) => {
                const hist = Number(it.precio_historico ?? 0);
                const ie = ITEM_ESTADO[it.estado_aprobacion ?? "pendiente"];
                return (
                  <tr key={it.id} className="odd:bg-page/60">
                    <td className="border border-line px-2 py-1.5 tabular-nums">
                      {i + 1}
                    </td>
                    <td className="border border-line px-2 py-1.5 font-mono text-[10px]">
                      {it.codigo_sig ?? "—"}
                    </td>
                    <td className="border border-line px-2 py-1.5">
                      <span className="font-semibold">{it.descripcion}</span>
                      {it.estado_aprobacion &&
                        it.estado_aprobacion !== "pendiente" && (
                          <span
                            className={`ml-2 rounded-full px-2 py-0.5 text-[9px] font-bold ${ie.cls}`}
                          >
                            {ie.label}
                          </span>
                        )}
                      {it.observacion_aprobador && (
                        <span className="block text-[10px] italic text-ink-400">
                          Obs.: {it.observacion_aprobador}
                        </span>
                      )}
                    </td>
                    <td className="border border-line px-2 py-1.5 text-right tabular-nums">
                      {Number(it.cantidad)}
                    </td>
                    <td className="border border-line px-2 py-1.5">
                      {it.unidad}
                    </td>
                    <td className="border border-line px-2 py-1.5 tabular-nums text-ink-600">
                      {it.fecha_ultima_compra ?? "—"}
                    </td>
                    <td className="border border-line px-2 py-1.5 text-right tabular-nums text-ink-600">
                      {hist > 0 ? money(hist, moneda) : "—"}
                    </td>
                    <td className="border border-line px-2 py-1.5 text-right tabular-nums text-ink-600">
                      {hist > 0
                        ? money(hist * Number(it.cantidad), moneda)
                        : "—"}
                    </td>
                    {cots.map((cot: any) => {
                      const p = pu(cot, it.id);
                      const supera = hist > 0 && p > hist;
                      return (
                        <Fragment key={`${cot.id}-${it.id}`}>
                          <td
                            className={`border border-line px-2 py-1.5 text-right tabular-nums ${
                              supera ? "font-bold text-danger-600" : ""
                            }`}
                            title={
                              supera
                                ? `Supera el precio histórico (${money(hist, moneda)})`
                                : undefined
                            }
                          >
                            {money(p, moneda)}
                          </td>
                          <td className="border border-line px-2 py-1.5 text-right tabular-nums">
                            {money(p * Number(it.cantidad), moneda)}
                          </td>
                          <td className="border border-line px-2 py-1.5 text-[10px] text-ink-600">
                            {espec(cot, it.id) || "—"}
                          </td>
                        </Fragment>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Subtotal / IGV / Total */}
              {[
                { t: "SUBTOTAL", f: (s: number) => s, hist: totalHistorico },
                {
                  t: "IGV (18%)",
                  f: (s: number) => s * IGV,
                  hist: totalHistorico * IGV,
                },
                {
                  t: "TOTAL",
                  f: (s: number) => s * (1 + IGV),
                  hist: totalHistorico * (1 + IGV),
                },
              ].map((fila, k) => (
                <tr
                  key={fila.t}
                  className={k === 2 ? "bg-page font-bold" : "bg-page/80"}
                >
                  <td
                    colSpan={7}
                    className="border border-line px-2 py-1.5 text-right"
                  >
                    {fila.t}
                  </td>
                  <td className="border border-line px-2 py-1.5 text-right tabular-nums text-ink-600">
                    {totalHistorico > 0 ? money(fila.hist, moneda) : "—"}
                  </td>
                  {cots.map((cot: any) => (
                    <Fragment key={`${cot.id}-${fila.t}`}>
                      <td className="border border-line px-2 py-1.5" />
                      <td className="border border-line px-2 py-1.5 text-right tabular-nums">
                        {money(fila.f(subtotalDe(cot)), moneda)}
                      </td>
                      <td className="border border-line px-2 py-1.5" />
                    </Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ---------- Condiciones comerciales y evaluación ---------- */}
        <div>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">
            Condiciones comerciales y evaluación
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-[11.5px]">
              <thead>
                <tr className="bg-page text-left text-[9.5px] uppercase text-ink-400">
                  <th className="border border-line px-2 py-1.5">Criterio</th>
                  <th className="border border-line px-2 py-1.5 text-right">
                    Máx.
                  </th>
                  {cots.map((cot: any) => (
                    <th
                      key={cot.id}
                      className="border border-line px-2 py-1.5 text-center"
                    >
                      <span className="block max-w-[180px] truncate">
                        {cot.proveedores?.razon_social}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-line px-2 py-1.5 text-ink-600">
                    Lugar de entrega
                  </td>
                  <td className="border border-line px-2 py-1.5" />
                  {cots.map((cot: any) => (
                    <td
                      key={cot.id}
                      className="border border-line px-2 py-1.5 text-center capitalize"
                    >
                      {cot.lugar_entrega ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-line px-2 py-1.5 text-ink-600">
                    Tiempo de entrega
                  </td>
                  <td className="border border-line px-2 py-1.5" />
                  {cots.map((cot: any) => (
                    <td
                      key={cot.id}
                      className="border border-line px-2 py-1.5 text-center tabular-nums"
                    >
                      {cot.tiempo_entrega_dias ?? "—"} días
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-line px-2 py-1.5 text-ink-600">
                    Condición de pago
                  </td>
                  <td className="border border-line px-2 py-1.5" />
                  {cots.map((cot: any) => (
                    <td
                      key={cot.id}
                      className="border border-line px-2 py-1.5 text-center"
                    >
                      {cot.condicion_pago ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-line px-2 py-1.5 text-ink-600">
                    Garantía
                  </td>
                  <td className="border border-line px-2 py-1.5" />
                  {cots.map((cot: any) => (
                    <td
                      key={cot.id}
                      className="border border-line px-2 py-1.5 text-center"
                    >
                      {cot.garantia ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-line px-2 py-1.5 text-ink-600">
                    Clasificación del proveedor
                  </td>
                  <td className="border border-line px-2 py-1.5" />
                  {cots.map((cot: any) => (
                    <td
                      key={cot.id}
                      className="border border-line px-2 py-1.5 text-center"
                    >
                      <span className="inline-flex items-center gap-1 font-semibold">
                        {cot.proveedores?.clasificacion === "critico" ? (
                          <>
                            <ShieldAlert className="h-3 w-3 text-alfa-red" />
                            Crítico
                          </>
                        ) : (
                          <>
                            <Shield className="h-3 w-3 text-brand-700" />
                            No crítico
                          </>
                        )}
                      </span>
                    </td>
                  ))}
                </tr>

                {CRITERIOS.map((cr) => (
                  <tr key={cr.k} className="bg-page/50">
                    <td className="border border-line px-2 py-1.5 font-semibold">
                      {cr.t}
                    </td>
                    <td className="border border-line px-2 py-1.5 text-right font-mono text-[10px] text-ink-400">
                      {cr.max}
                    </td>
                    {cots.map((cot: any) => {
                      const v = cot.puntajes?.[cr.k];
                      return (
                        <td
                          key={cot.id}
                          className="border border-line px-2 py-1.5 text-center tabular-nums"
                        >
                          {v == null ? "—" : Number(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                <tr className="border-t-2 border-ink-900 bg-page font-bold">
                  <td className="border border-line px-2 py-2">
                    PUNTAJE TOTAL
                  </td>
                  <td className="border border-line px-2 py-2 text-right font-mono text-[10px]">
                    100
                  </td>
                  {cots.map((cot: any) => {
                    const gana = cot.proveedor_id === cu.proveedor_ganador_id;
                    return (
                      <td
                        key={cot.id}
                        className="border border-line px-2 py-2 text-center"
                      >
                        <span
                          className={`inline-flex items-center gap-1 font-display text-lg font-bold tabular-nums ${
                            gana ? "text-ok-600" : ""
                          }`}
                        >
                          {gana && <Trophy className="h-4 w-4" />}
                          {Number(cot.puntaje_total ?? 0)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          {cots.some((x: any) => !x.puntajes) && (
            <p className="mt-1 text-[10.5px] text-ink-400">
              Los comparativos elaborados antes del 19-jul no guardaban el
              desglose por criterio; se muestra solo el puntaje total con el
              que fueron decididos.
            </p>
          )}
        </div>

        {/* ---------- Dashboard de decisión ---------- */}
        <div className="grid gap-3 sm:grid-cols-4">
          <Dato
            k="Proveedores comparados"
            v={String(cots.length)}
            nota={
              cu.requerimientos?.tipo === "emergencia"
                ? "Emergencia: mínimo 1"
                : "Rutinario: mínimo 3"
            }
          />
          <Dato
            k="Total seleccionado"
            v={money(subGanador * (1 + IGV), moneda)}
            nota="Incluye IGV"
          />
          <Dato
            k="Referencia histórica"
            v={totalHistorico > 0 ? money(totalHistorico, moneda) : "—"}
            nota="Sin IGV, según ERP"
          />
          <Dato
            k={ahorro >= 0 ? "Ahorro vs. histórico" : "Sobrecosto vs. histórico"}
            v={
              totalHistorico > 0
                ? `${money(Math.abs(ahorro), moneda)} (${Math.abs(pctAhorro)}%)`
                : "—"
            }
            nota={ahorro < 0 ? "Requiere sustento" : "Sobre subtotal sin IGV"}
            tono={
              totalHistorico === 0 ? "n" : ahorro >= 0 ? "ok" : "danger"
            }
          />
        </div>

        {/* ---------- Proveedor seleccionado ---------- */}
        <div className="rounded-xl border border-ok-600/30 bg-ok-100/40 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-ok-600">
            Proveedor seleccionado
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-ok-600" />
            {cu.proveedores?.razon_social ?? "—"}
            {cu.proveedores?.ruc && (
              <span className="font-mono text-[11px] font-normal text-ink-400">
                RUC {cu.proveedores.ruc}
              </span>
            )}
          </div>
          <div className="mt-1 text-xs font-bold uppercase tracking-wide text-ink-400">
            Justificación
          </div>
          <p className="text-sm text-ink-600">
            {cu.justificacion ??
              "Mayor puntaje ponderado según matriz de evaluación aprobada."}
          </p>
          <p className="mt-2 text-[10.5px] leading-relaxed text-ink-400">
            Nota: el presente cuadro se elabora según el procedimiento LOG-GN-P-02
            (Adquisición de Bienes y Servicios) y la matriz de puntajes aprobada
            LOGFP0202. Los precios históricos provienen del ERP (DATA SIG) y sirven
            como referencia de la última compra registrada.
          </p>
        </div>

        {itemsNoAprobados.length > 0 && (
          <div className="rounded-xl border border-warn-700/30 bg-warn-100/40 p-4 text-[12px]">
            <b>{itemsNoAprobados.length} ítem(s) no aprobados</b> — quedaron en
            la{" "}
            <Link
              href="/panel/pendientes"
              className="font-bold text-brand-900 underline"
            >
              bandeja de ítems pendientes de compra
            </Link>{" "}
            para descartarlos o llevarlos a otro comparativo.
          </div>
        )}

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
                        : a.accion === "aprobado_parcial"
                          ? "badge-medianamente"
                          : "badge-no-confiable"
                    }
                  >
                    {a.accion === "aprobado_parcial"
                      ? "aprobado parcialmente"
                      : a.accion}
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

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-ink-400">
          <span>
            Elaborado por {cu.usuarios?.nombre ?? "—"}
            {cu.aprobadores?.nombre
              ? ` · aprobador asignado: ${cu.aprobadores.nombre}${
                  cu.aprobadores.area ? ` (${cu.aprobadores.area})` : ""
                }`
              : ""}
          </span>
          <span className="font-mono">
            {cu.id.slice(0, 8).toUpperCase()}·{cu.creado_en?.slice(0, 10)}
          </span>
        </div>
      </div>

      {puedeResolver && (
        <div className="no-print">
          <AprobarCuadro
            cuadroId={cu.id}
            ganadorId={cu.proveedor_ganador_id ?? null}
            items={items.map((it: any) => ({
              id: it.id,
              orden: it.orden,
              descripcion: it.descripcion,
              cantidad: Number(it.cantidad),
              unidad: it.unidad,
              codigo_sig: it.codigo_sig ?? null,
            }))}
          />
        </div>
      )}

      <div className="no-print">
        <ExpedienteCompra
          cuadroId={cu.id}
          documentos={(cu.cuadro_documentos ?? []) as any}
          estado={cu.estado}
          cotizaciones={cots.map((x: any) => ({
            proveedor_id: x.proveedor_id,
            razon_social: x.proveedores?.razon_social ?? "—",
          }))}
        />
      </div>
    </div>
  );
}

function Dato({
  k,
  v,
  nota,
  tono = "n",
}: {
  k: string;
  v: string;
  nota?: string;
  tono?: "n" | "ok" | "danger";
}) {
  const color =
    tono === "ok"
      ? "text-ok-600"
      : tono === "danger"
        ? "text-danger-600"
        : "text-ink-950";
  return (
    <div className="rounded-xl border border-line p-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
        {k}
      </div>
      <div className={`mt-0.5 text-[15px] font-bold tabular-nums ${color}`}>
        {v}
      </div>
      {nota && <div className="text-[10px] text-ink-400">{nota}</div>}
    </div>
  );
}

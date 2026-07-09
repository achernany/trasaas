"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Trophy,
  Check,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Stepper from "@/components/Stepper";

const PESOS = { precio: 30, lugar: 15, tiempo: 15, pago: 20, garantia: 10, feedback: 10 };
const LUGARES = [
  { v: "destino", t: "Entrega en destino", pts: 15 },
  { v: "agencia", t: "Agencia de transporte", pts: 10 },
  { v: "recojo", t: "Recojo en proveedor", pts: 0 },
];
const PAGOS = [
  { v: "credito_45", t: "Crédito > 30 días", pts: 20 },
  { v: "credito_30", t: "Crédito a 30 días", pts: 15 },
  { v: "credito_15", t: "Crédito a 15 días", pts: 10 },
  { v: "contado", t: "Contado / < 15 días", pts: 0 },
];
const GARANTIAS = [
  { v: "total", t: "Total + certificados", pts: 10 },
  { v: "basica", t: "Básica", pts: 5 },
  { v: "sin", t: "Sin garantía", pts: 0 },
];
const FEEDBACK_PTS: Record<string, number> = {
  confiable: 10,
  medianamente_confiable: 5,
  no_confiable: 0,
};

export type ProvConfiable = {
  proveedor_id: string;
  razon_social: string;
  ruc: string;
  calificacion: string;
  nota: number | null;
};

type Item = { descripcion: string; cantidad: number; unidad: string };
type Cot = {
  proveedor_id: string;
  lugar: string;
  tiempo: number;
  pago: string;
  garantia: string;
  precios: number[];
};

export default function NuevoCuadro({
  confiables,
  proyectos,
}: {
  confiables: ProvConfiable[];
  proyectos: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [ticket, setTicket] = useState("");
  const [tipo, setTipo] = useState<"rutinario" | "emergencia">("rutinario");
  const [area, setArea] = useState("");
  const [proyectoId, setProyectoId] = useState("");
  const [items, setItems] = useState<Item[]>([
    { descripcion: "", cantidad: 1, unidad: "UND" },
  ]);
  const [cots, setCots] = useState<Cot[]>([]);
  const [justificacion, setJustificacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pasos = ["Requerimiento", "Ítems", "Cotizaciones", "Resumen"];
  const minCots = tipo === "rutinario" ? 3 : 1;

  const disponibles = confiables.filter(
    (p) => !cots.some((c) => c.proveedor_id === p.proveedor_id)
  );

  const totales = useMemo(
    () =>
      cots.map((c) =>
        items.reduce(
          (s, it, i) =>
            s + (Number(c.precios[i]) || 0) * (Number(it.cantidad) || 0),
          0
        )
      ),
    [cots, items]
  );

  const puntajes = useMemo(() => {
    const tv = totales.filter((t) => t > 0);
    const minTotal = tv.length ? Math.min(...tv) : 0;
    const ts = cots.map((c) => Number(c.tiempo) || 0).filter((t) => t > 0);
    const minTiempo = ts.length ? Math.min(...ts) : 0;
    return cots.map((c, i) => {
      const prov = confiables.find((p) => p.proveedor_id === c.proveedor_id);
      const precio =
        totales[i] > 0 && minTotal > 0
          ? Math.round(PESOS.precio * (minTotal / totales[i]))
          : 0;
      const lugar = LUGARES.find((l) => l.v === c.lugar)?.pts ?? 0;
      const tiempo =
        Number(c.tiempo) > 0 && minTiempo > 0
          ? Math.round(PESOS.tiempo * (minTiempo / Number(c.tiempo)))
          : 0;
      const pago = PAGOS.find((p) => p.v === c.pago)?.pts ?? 0;
      const garantia = GARANTIAS.find((g) => g.v === c.garantia)?.pts ?? 0;
      const feedback = FEEDBACK_PTS[prov?.calificacion ?? ""] ?? 0;
      return {
        precio,
        lugar,
        tiempo,
        pago,
        garantia,
        feedback,
        total: precio + lugar + tiempo + pago + garantia + feedback,
      };
    });
  }, [cots, totales, confiables]);

  const idxGanador = useMemo(() => {
    let idx = -1;
    let max = -1;
    puntajes.forEach((p, i) => {
      if (totales[i] > 0 && p.total > max) {
        max = p.total;
        idx = i;
      }
    });
    return idx;
  }, [puntajes, totales]);

  function pasoValido(i: number): boolean {
    if (pasos[i] === "Requerimiento") return Boolean(ticket.trim());
    if (pasos[i] === "Ítems")
      return items.every((it) => it.descripcion.trim() && it.cantidad > 0);
    if (pasos[i] === "Cotizaciones")
      return cots.length >= minCots && cots.every((_, j) => totales[j] > 0);
    return true;
  }
  const puedeAvanzar = pasoValido(paso);
  const esUltimo = paso === pasos.length - 1;
  const listo = pasos.every((_, i) => pasoValido(i)) && idxGanador >= 0;

  function irA(destino: number) {
    if (destino === paso || destino < 0 || destino >= pasos.length) return;
    if (destino > paso) {
      for (let i = paso; i < destino; i++) if (!pasoValido(i)) return;
    }
    setDir(destino > paso ? "fwd" : "back");
    setPaso(destino);
    document.querySelector(".modal-body")?.scrollTo({ top: 0 });
  }

  function agregarCot(proveedor_id: string) {
    if (!proveedor_id) return;
    setCots((c) => [
      ...c,
      {
        proveedor_id,
        lugar: "destino",
        tiempo: 3,
        pago: "credito_30",
        garantia: "total",
        precios: items.map(() => 0),
      },
    ]);
  }

  async function guardar() {
    if (!listo) return;
    setGuardando(true);
    setError(null);
    const supabase = createClient();
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { data: perfil } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", auth.user!.id)
        .single();
      const empresaId = perfil!.empresa_id;

      let { data: req } = await supabase
        .from("requerimientos")
        .select("id")
        .eq("ticket_avandesk", ticket.trim())
        .maybeSingle();
      if (!req) {
        const { data: nuevo, error: e1 } = await supabase
          .from("requerimientos")
          .insert({
            empresa_id: empresaId,
            ticket_avandesk: ticket.trim(),
            tipo,
            area_solicitante: area || null,
            proyecto_id: proyectoId || null,
            creado_por: auth.user!.id,
          })
          .select("id")
          .single();
        if (e1) throw e1;
        req = nuevo;
      }

      const codigo = `CC-${ticket.trim()}-${String(Date.now()).slice(-4)}`;
      const ganador = cots[idxGanador];
      const { data: cuadro, error: e2 } = await supabase
        .from("cuadros")
        .insert({
          empresa_id: empresaId,
          requerimiento_id: req!.id,
          codigo,
          matriz_pesos: PESOS,
          moneda: "PEN",
          estado: "enviado",
          justificacion:
            justificacion ||
            `Mayor puntaje ponderado (${puntajes[idxGanador].total}/100).`,
          proveedor_ganador_id: ganador.proveedor_id,
          creado_por: auth.user!.id,
        })
        .select("id")
        .single();
      if (e2) throw e2;

      const { data: itemsIns, error: e3 } = await supabase
        .from("cuadro_items")
        .insert(
          items.map((it, i) => ({
            cuadro_id: cuadro!.id,
            orden: i + 1,
            descripcion: it.descripcion.trim(),
            cantidad: it.cantidad,
            unidad: it.unidad || "UND",
          }))
        )
        .select("id, orden");
      if (e3) throw e3;

      for (let i = 0; i < cots.length; i++) {
        const c = cots[i];
        const { data: cot, error: e4 } = await supabase
          .from("cotizaciones")
          .insert({
            cuadro_id: cuadro!.id,
            proveedor_id: c.proveedor_id,
            lugar_entrega: c.lugar,
            tiempo_entrega_dias: Number(c.tiempo) || null,
            condicion_pago: PAGOS.find((p) => p.v === c.pago)?.t,
            garantia: GARANTIAS.find((g) => g.v === c.garantia)?.t,
            archivo_url: "pendiente-adjuntar",
            puntaje_total: puntajes[i].total,
          })
          .select("id")
          .single();
        if (e4) throw e4;
        const precios = (itemsIns ?? [])
          .sort((a: any, b: any) => a.orden - b.orden)
          .map((it: any, j: number) => ({
            cotizacion_id: cot!.id,
            item_id: it.id,
            precio_unitario: Number(c.precios[j]) || 0,
          }));
        const { error: e5 } = await supabase
          .from("cotizacion_precios")
          .insert(precios);
        if (e5) throw e5;
      }

      await supabase.from("audit_log").insert({
        empresa_id: empresaId,
        usuario_id: auth.user!.id,
        entidad: "cuadro",
        entidad_id: cuadro!.id,
        accion: "crear",
        detalle: { codigo, ticket, tipo, cotizaciones: cots.length },
      });

      router.push(`/panel/cuadros/${cuadro!.id}`);
    } catch (err: any) {
      setError(err.message ?? "Error al guardar");
      setGuardando(false);
    }
  }

  const nombrePaso = pasos[paso];
  const ganadorProv =
    idxGanador >= 0
      ? confiables.find((p) => p.proveedor_id === cots[idxGanador].proveedor_id)
      : null;

  return (
    <>
      <div className="modal-body min-h-0 flex-1 overflow-y-auto p-5">
        <Stepper
          pasos={pasos}
          paso={paso}
          alcanzable={(i) =>
            i <= paso || pasos.slice(0, i).every((_, j) => pasoValido(j))
          }
          onIr={irA}
        />

        <div key={paso} className={dir === "fwd" ? "step-enter" : "step-enter-back"}>
          {nombrePaso === "Requerimiento" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label text-[12px]">N° Ticket AvanDesk *</label>
                <input
                  className="input h-9 text-[13px]"
                  value={ticket}
                  onChange={(e) => setTicket(e.target.value)}
                  placeholder="Ej. RQ-2026-1234"
                />
              </div>
              <div>
                <label className="label text-[12px]">Tipo</label>
                <div className="flex gap-2">
                  {(["rutinario", "emergencia"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipo(t)}
                      className={`h-9 flex-1 rounded-lg border px-2 text-[12px] font-semibold capitalize transition ${
                        tipo === t
                          ? "border-brand-900 bg-brand-100 text-brand-900"
                          : "border-line bg-white text-ink-600 hover:bg-page"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label text-[12px]">Área solicitante</label>
                <input
                  className="input h-9 text-[13px]"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Ej. Operaciones"
                />
              </div>
              <div>
                <label className="label text-[12px]">Proyecto</label>
                <select
                  className="input h-9 text-[13px]"
                  value={proyectoId}
                  onChange={(e) => setProyectoId(e.target.value)}
                >
                  <option value="">— Sin proyecto —</option>
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-ink-400 sm:col-span-2">
                {tipo === "rutinario"
                  ? "Rutinario: mínimo 3 cotizaciones (LOG-GN-P-02)."
                  : "Emergencia: exento del mínimo de 3 cotizaciones — queda como sustento."}
              </p>
            </div>
          )}

          {nombrePaso === "Ítems" && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-[1fr_80px_70px_36px] gap-2 text-[10px] font-bold uppercase text-ink-400">
                <span>Descripción</span>
                <span>Cant.</span>
                <span>Unidad</span>
                <span></span>
              </div>
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_70px_36px] items-center gap-2">
                  <input
                    className="input h-9 text-[13px]"
                    placeholder="Bien o servicio"
                    value={it.descripcion}
                    onChange={(e) =>
                      setItems((xs) =>
                        xs.map((x, j) =>
                          j === i ? { ...x, descripcion: e.target.value } : x
                        )
                      )
                    }
                  />
                  <input
                    type="number"
                    min={0.01}
                    step="any"
                    className="input h-9 text-[13px]"
                    value={it.cantidad}
                    onChange={(e) =>
                      setItems((xs) =>
                        xs.map((x, j) =>
                          j === i ? { ...x, cantidad: Number(e.target.value) } : x
                        )
                      )
                    }
                  />
                  <input
                    className="input h-9 text-[13px]"
                    value={it.unidad}
                    onChange={(e) =>
                      setItems((xs) =>
                        xs.map((x, j) =>
                          j === i ? { ...x, unidad: e.target.value } : x
                        )
                      )
                    }
                  />
                  {items.length > 1 ? (
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-danger-600 hover:bg-danger-100"
                      onClick={() => {
                        setItems((xs) => xs.filter((_, j) => j !== i));
                        setCots((cs) =>
                          cs.map((c) => ({
                            ...c,
                            precios: c.precios.filter((_, j) => j !== i),
                          }))
                        );
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn-secondary min-h-[34px] px-3 text-[12px]"
                onClick={() => {
                  setItems((xs) => [
                    ...xs,
                    { descripcion: "", cantidad: 1, unidad: "UND" },
                  ]);
                  setCots((cs) =>
                    cs.map((c) => ({ ...c, precios: [...c.precios, 0] }))
                  );
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Agregar ítem
              </button>
            </div>
          )}

          {nombrePaso === "Cotizaciones" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12px] text-ink-400">
                  {cots.length}/{minCots} mín. · solo proveedores CONFIABLES ·
                  feedback automático del scorecard
                </span>
                <select
                  className="input h-9 w-64 text-[12px]"
                  value=""
                  onChange={(e) => agregarCot(e.target.value)}
                >
                  <option value="">+ Agregar proveedor…</option>
                  {disponibles.map((p) => (
                    <option key={p.proveedor_id} value={p.proveedor_id}>
                      {p.razon_social} — {p.ruc}
                    </option>
                  ))}
                </select>
              </div>

              {cots.map((c, i) => {
                const prov = confiables.find(
                  (p) => p.proveedor_id === c.proveedor_id
                )!;
                const esGanador = i === idxGanador && totales[i] > 0;
                return (
                  <div
                    key={c.proveedor_id}
                    className={`rounded-xl border p-3 ${esGanador ? "border-ok-600 bg-ok-100/30" : "border-line"}`}
                  >
                    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        {esGanador && (
                          <Trophy className="h-3.5 w-3.5 shrink-0 text-ok-600" />
                        )}
                        <span className="truncate text-[12px] font-bold">
                          {prov.razon_social}
                        </span>
                        <span className="badge-confiable shrink-0">
                          <CheckCircle2 className="h-3 w-3" /> {prov.nota ?? ""}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-display text-base font-semibold tabular-nums">
                          {puntajes[i]?.total ?? 0}
                          <span className="text-[10px] font-normal text-ink-400">
                            /100
                          </span>
                        </span>
                        <button
                          type="button"
                          className="text-danger-600"
                          onClick={() =>
                            setCots((cs) => cs.filter((_, j) => j !== i))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <select
                        className="input h-8 text-[11px]"
                        value={c.lugar}
                        onChange={(e) =>
                          setCots((cs) =>
                            cs.map((x, j) =>
                              j === i ? { ...x, lugar: e.target.value } : x
                            )
                          )
                        }
                      >
                        {LUGARES.map((l) => (
                          <option key={l.v} value={l.v}>
                            {l.t}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        className="input h-8 text-[11px]"
                        title="Días de entrega"
                        value={c.tiempo}
                        onChange={(e) =>
                          setCots((cs) =>
                            cs.map((x, j) =>
                              j === i
                                ? { ...x, tiempo: Number(e.target.value) }
                                : x
                            )
                          )
                        }
                      />
                      <select
                        className="input h-8 text-[11px]"
                        value={c.pago}
                        onChange={(e) =>
                          setCots((cs) =>
                            cs.map((x, j) =>
                              j === i ? { ...x, pago: e.target.value } : x
                            )
                          )
                        }
                      >
                        {PAGOS.map((p) => (
                          <option key={p.v} value={p.v}>
                            {p.t}
                          </option>
                        ))}
                      </select>
                      <select
                        className="input h-8 text-[11px]"
                        value={c.garantia}
                        onChange={(e) =>
                          setCots((cs) =>
                            cs.map((x, j) =>
                              j === i ? { ...x, garantia: e.target.value } : x
                            )
                          )
                        }
                      >
                        {GARANTIAS.map((g) => (
                          <option key={g.v} value={g.v}>
                            {g.t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {items.map((it, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-2 text-[11px]"
                        >
                          <span className="flex-1 truncate text-ink-600">
                            {it.descripcion || `Ítem ${j + 1}`} × {it.cantidad}
                          </span>
                          <span className="text-ink-400">S/</span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            className="input h-8 w-24 text-right text-[11px]"
                            value={c.precios[j] || ""}
                            onChange={(e) =>
                              setCots((cs) =>
                                cs.map((x, k) =>
                                  k === i
                                    ? {
                                        ...x,
                                        precios: x.precios.map((p, m) =>
                                          m === j ? Number(e.target.value) : p
                                        ),
                                      }
                                    : x
                                )
                              )
                            }
                          />
                        </div>
                      ))}
                      <div className="flex justify-end border-t border-line pt-1.5 text-[12px] font-bold tabular-nums">
                        Total: S/ {totales[i]?.toFixed(2) ?? "0.00"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {nombrePaso === "Resumen" && (
            <div className="space-y-3">
              {ganadorProv && (
                <div className="rounded-xl border-2 border-ok-600/40 bg-ok-100/40 p-4 text-center">
                  <div className="flex items-center justify-center gap-2 font-display text-lg font-semibold">
                    <Trophy className="h-5 w-5 text-ok-600" />
                    {ganadorProv.razon_social}
                  </div>
                  <div className="mt-0.5 text-[12px] text-ink-600">
                    Recomendado · {puntajes[idxGanador]?.total}/100 pts · S/{" "}
                    {totales[idxGanador]?.toFixed(2)}
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-line p-3">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-left text-[10px] uppercase text-ink-400">
                      <th className="py-1">Proveedor</th>
                      <th className="py-1 text-right">Total S/</th>
                      <th className="py-1 text-right">Puntaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {cots.map((c, i) => {
                      const prov = confiables.find(
                        (p) => p.proveedor_id === c.proveedor_id
                      )!;
                      return (
                        <tr key={i}>
                          <td className="max-w-[220px] truncate py-1.5 font-semibold">
                            {i === idxGanador && (
                              <Trophy className="mr-1 inline h-3 w-3 text-ok-600" />
                            )}
                            {prov.razon_social}
                          </td>
                          <td className="py-1.5 text-right tabular-nums">
                            {totales[i].toFixed(2)}
                          </td>
                          <td className="py-1.5 text-right font-bold tabular-nums">
                            {puntajes[i].total}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div>
                <label className="label text-[12px]">
                  Justificación de selección
                </label>
                <textarea
                  className="input text-[13px]"
                  rows={2}
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  placeholder="Se completa con el mayor puntaje si lo dejas vacío"
                />
                {error && (
                  <p className="mt-2 text-[12px] text-danger-600">{error}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer del modal */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-line bg-white px-5 py-2.5">
        <div className="flex min-w-0 items-center gap-2 text-[12px]">
          {ganadorProv ? (
            <>
              <Trophy className="h-4 w-4 shrink-0 text-ok-600" />
              <span className="truncate font-bold">
                {ganadorProv.razon_social}
              </span>
              <span className="shrink-0 font-display font-semibold tabular-nums">
                {puntajes[idxGanador]?.total}/100
              </span>
            </>
          ) : (
            <span className="text-ink-400">
              {cots.length}/{minCots} cotizaciones mín.
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {paso > 0 && (
            <button
              type="button"
              className="btn-secondary min-h-[36px] px-3 text-[12px]"
              onClick={() => irA(paso - 1)}
              disabled={guardando}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver
            </button>
          )}
          {!esUltimo ? (
            <button
              type="button"
              className="btn min-h-[36px] px-4 text-[12px]"
              disabled={!puedeAvanzar}
              onClick={() => irA(paso + 1)}
            >
              Siguiente <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              className="btn min-h-[36px] px-4 text-[12px]"
              disabled={!listo || guardando}
              onClick={guardar}
            >
              <Check className="h-3.5 w-3.5" />
              {guardando ? "Guardando…" : "Guardar cuadro"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

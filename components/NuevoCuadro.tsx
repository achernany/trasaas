"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PESOS = { precio: 30, lugar: 15, tiempo: 15, pago: 20, garantia: 10, feedback: 10 };
const LUGARES = [
  { v: "destino", t: "Entrega en destino (almacén)", pts: 15 },
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
  { v: "total", t: "Garantía total + certificados", pts: 10 },
  { v: "basica", t: "Garantía básica", pts: 5 },
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
  precios: number[]; // P.U. por ítem
};

export default function NuevoCuadro({
  confiables,
  proyectos,
}: {
  confiables: ProvConfiable[];
  proyectos: { id: string; nombre: string }[];
}) {
  const router = useRouter();
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

  const disponibles = confiables.filter(
    (p) => !cots.some((c) => c.proveedor_id === p.proveedor_id)
  );

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

  const totales = useMemo(
    () =>
      cots.map((c) =>
        items.reduce(
          (s, it, i) => s + (Number(c.precios[i]) || 0) * (Number(it.cantidad) || 0),
          0
        )
      ),
    [cots, items]
  );

  const puntajes = useMemo(() => {
    const totalesValidos = totales.filter((t) => t > 0);
    const minTotal = totalesValidos.length ? Math.min(...totalesValidos) : 0;
    const tiempos = cots.map((c) => Number(c.tiempo) || 0).filter((t) => t > 0);
    const minTiempo = tiempos.length ? Math.min(...tiempos) : 0;
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

  const minCots = tipo === "rutinario" ? 3 : 1;
  const listo =
    ticket.trim() &&
    items.every((it) => it.descripcion.trim() && it.cantidad > 0) &&
    cots.length >= minCots &&
    cots.every((c, i) => totales[i] > 0) &&
    idxGanador >= 0;

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

      // requerimiento (si el ticket ya existe, lo reutiliza)
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

  return (
    <div className="space-y-5">
      {/* Datos del requerimiento */}
      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">1 · Requerimiento</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">N° Ticket AvanDesk *</label>
            <input
              className="input"
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
              placeholder="Ej. RQ-2026-1234"
            />
          </div>
          <div>
            <label className="label">Tipo</label>
            <div className="flex gap-2">
              {(["rutinario", "emergencia"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`h-11 flex-1 rounded-lg border px-3 text-sm font-semibold capitalize transition ${
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
            <label className="label">Área solicitante</label>
            <input
              className="input"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Ej. Operaciones"
            />
          </div>
          <div>
            <label className="label">Proyecto</label>
            <select
              className="input"
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
        </div>
        {tipo === "rutinario" ? (
          <p className="text-xs text-ink-400">
            Rutinario: mínimo 3 cotizaciones (LOG-GN-P-02).
          </p>
        ) : (
          <p className="text-xs font-semibold text-warn-700">
            Emergencia: exento del mínimo de 3 cotizaciones — queda registrado
            como sustento.
          </p>
        )}
      </section>

      {/* Items */}
      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">2 · Ítems a cotizar</h2>
        {items.map((it, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <input
              className="input h-10 flex-1 text-[13px]"
              placeholder="Descripción del bien o servicio"
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
              className="input h-10 w-24 text-[13px]"
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
              className="input h-10 w-20 text-[13px]"
              value={it.unidad}
              onChange={(e) =>
                setItems((xs) =>
                  xs.map((x, j) =>
                    j === i ? { ...x, unidad: e.target.value } : x
                  )
                )
              }
            />
            {items.length > 1 && (
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-danger-600 hover:bg-danger-100"
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
            )}
          </div>
        ))}
        <button
          type="button"
          className="btn-secondary min-h-[38px] text-[13px]"
          onClick={() => {
            setItems((xs) => [...xs, { descripcion: "", cantidad: 1, unidad: "UND" }]);
            setCots((cs) => cs.map((c) => ({ ...c, precios: [...c.precios, 0] })));
          }}
        >
          <Plus className="h-4 w-4" /> Agregar ítem
        </button>
      </section>

      {/* Cotizaciones */}
      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            3 · Cotizaciones{" "}
            <span className="text-sm font-normal text-ink-400">
              ({cots.length}/{minCots} mín.)
            </span>
          </h2>
          <select
            className="input h-10 w-72 text-[13px]"
            value=""
            onChange={(e) => agregarCot(e.target.value)}
          >
            <option value="">+ Agregar proveedor confiable…</option>
            {disponibles.map((p) => (
              <option key={p.proveedor_id} value={p.proveedor_id}>
                {p.razon_social} — {p.ruc}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-ink-400">
          Solo aparecen proveedores CONFIABLES vigentes en el scorecard — la
          regla del procedimiento, aplicada por el sistema. El criterio
          "feedback" se llena solo con su calificación.
        </p>

        {cots.map((c, i) => {
          const prov = confiables.find((p) => p.proveedor_id === c.proveedor_id)!;
          const esGanador = i === idxGanador && totales[i] > 0;
          return (
            <div
              key={c.proveedor_id}
              className={`rounded-xl border p-4 ${esGanador ? "border-ok-600 bg-ok-100/30" : "border-line"}`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {esGanador && <Trophy className="h-4 w-4 text-ok-600" />}
                  <span className="text-sm font-bold">{prov.razon_social}</span>
                  <span className="badge-confiable">✓ {prov.nota ?? ""}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-semibold tabular-nums">
                    {puntajes[i]?.total ?? 0}
                    <span className="text-xs font-normal text-ink-400">/100</span>
                  </span>
                  <button
                    type="button"
                    className="text-danger-600 hover:underline"
                    onClick={() => setCots((cs) => cs.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <label className="label text-[11px]">Lugar de entrega</label>
                  <select
                    className="input h-10 text-[13px]"
                    value={c.lugar}
                    onChange={(e) =>
                      setCots((cs) =>
                        cs.map((x, j) => (j === i ? { ...x, lugar: e.target.value } : x))
                      )
                    }
                  >
                    {LUGARES.map((l) => (
                      <option key={l.v} value={l.v}>
                        {l.t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-[11px]">Entrega (días)</label>
                  <input
                    type="number"
                    min={1}
                    className="input h-10 text-[13px]"
                    value={c.tiempo}
                    onChange={(e) =>
                      setCots((cs) =>
                        cs.map((x, j) =>
                          j === i ? { ...x, tiempo: Number(e.target.value) } : x
                        )
                      )
                    }
                  />
                </div>
                <div>
                  <label className="label text-[11px]">Condición de pago</label>
                  <select
                    className="input h-10 text-[13px]"
                    value={c.pago}
                    onChange={(e) =>
                      setCots((cs) =>
                        cs.map((x, j) => (j === i ? { ...x, pago: e.target.value } : x))
                      )
                    }
                  >
                    {PAGOS.map((p) => (
                      <option key={p.v} value={p.v}>
                        {p.t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-[11px]">Garantía</label>
                  <select
                    className="input h-10 text-[13px]"
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
              </div>
              <div className="mt-3 space-y-2">
                {items.map((it, j) => (
                  <div key={j} className="flex items-center gap-2 text-[13px]">
                    <span className="flex-1 truncate text-ink-600">
                      {it.descripcion || `Ítem ${j + 1}`} × {it.cantidad}
                    </span>
                    <span className="text-ink-400">P.U. S/</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className="input h-9 w-28 text-right text-[13px]"
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
                <div className="flex justify-end gap-2 border-t border-line pt-2 text-sm font-bold tabular-nums">
                  Total: S/ {totales[i]?.toFixed(2) ?? "0.00"}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="card">
        <label className="label">Justificación de selección</label>
        <textarea
          className="input"
          rows={2}
          value={justificacion}
          onChange={(e) => setJustificacion(e.target.value)}
          placeholder="Se completa automáticamente con el mayor puntaje si lo dejas vacío"
        />
        {error && <p className="mt-3 text-sm text-danger-600">{error}</p>}
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-ink-400">
            Al guardar queda en estado <b>Pendiente de aprobación</b>.
          </p>
          <button className="btn" disabled={!listo || guardando} onClick={guardar}>
            {guardando ? "Guardando…" : "Guardar cuadro →"}
          </button>
        </div>
      </section>
    </div>
  );
}

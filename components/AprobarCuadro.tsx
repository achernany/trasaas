"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ListChecks, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Confirmar from "@/components/Confirmar";

type ItemCuadro = {
  id: string;
  orden: number;
  descripcion: string;
  cantidad: number;
  unidad: string;
  codigo_sig: string | null;
};

type Accion = "aprobado" | "aprobado_parcial" | "rechazado";

/**
 * Resolución interna del aprobador (sin correo: se decide dentro del sistema).
 * Aprobar todo · Aprobar parcialmente por ítem · Rechazar con observación.
 * Los ítems no aprobados caen en la bandeja de pendientes de compra.
 */
export default function AprobarCuadro({
  cuadroId,
  ganadorId,
  items,
}: {
  cuadroId: string;
  ganadorId?: string | null;
  items: ItemCuadro[];
}) {
  const router = useRouter();
  const [comentario, setComentario] = useState("");
  const [parcial, setParcial] = useState(false);
  const [aprobados, setAprobados] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.id, true]))
  );
  const [obsItem, setObsItem] = useState<Record<string, string>>({});
  const [trabajando, setTrabajando] = useState(false);
  const [pendiente, setPendiente] = useState<Accion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nAprobados = useMemo(
    () => items.filter((i) => aprobados[i.id] !== false).length,
    [items, aprobados]
  );
  const todos = nAprobados === items.length;
  const ninguno = nAprobados === 0;

  async function resolver(accion: Accion) {
    setTrabajando(true);
    setError(null);
    const supabase = createClient();
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { data: perfil } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", auth.user!.id)
        .single();
      const ahora = new Date().toISOString();

      // Resolución por ítem
      for (const it of items) {
        const ok = accion === "rechazado" ? false : aprobados[it.id] !== false;
        const { error: ei } = await supabase
          .from("cuadro_items")
          .update({
            estado_aprobacion: ok ? "aprobado" : "no_aprobado",
            observacion_aprobador: ok ? null : obsItem[it.id]?.trim() || null,
            resuelto_en: ahora,
          })
          .eq("id", it.id);
        if (ei) throw ei;
      }

      const { error: e1 } = await supabase.from("aprobaciones").insert({
        empresa_id: perfil!.empresa_id,
        cuadro_id: cuadroId,
        aprobador_id: auth.user!.id,
        token_email: crypto.randomUUID(),
        accion,
        comentario: comentario.trim() || null,
        resuelto_en: ahora,
      });
      if (e1) throw e1;

      const { error: e2 } = await supabase
        .from("cuadros")
        .update({ estado: accion, resuelto_en: ahora })
        .eq("id", cuadroId);
      if (e2) throw e2;

      // El ganador pasa a proveedor Aprobado si se aprobó (total o parcial)
      if (accion !== "rechazado" && ganadorId) {
        await supabase
          .from("proveedores")
          .update({ estado: "aprobado" })
          .eq("id", ganadorId);
      }

      await supabase.from("audit_log").insert({
        empresa_id: perfil!.empresa_id,
        usuario_id: auth.user!.id,
        entidad: "cuadro",
        entidad_id: cuadroId,
        accion,
        detalle: {
          comentario: comentario.trim() || null,
          items_aprobados: accion === "rechazado" ? 0 : nAprobados,
          items_total: items.length,
          no_aprobados: items
            .filter(
              (i) => accion === "rechazado" || aprobados[i.id] === false
            )
            .map((i) => ({
              codigo_sig: i.codigo_sig,
              descripcion: i.descripcion,
              observacion: obsItem[i.id]?.trim() || null,
            })),
        },
      });

      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Error");
      setTrabajando(false);
    }
  }

  return (
    <div className="card border-warn-700/30 bg-warn-100/30">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Resolución del aprobador</h3>
        <button
          type="button"
          onClick={() => setParcial((v) => !v)}
          className={`inline-flex min-h-[30px] items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold transition ${
            parcial
              ? "border-brand-900 bg-brand-900 text-white"
              : "border-line bg-white text-ink-950 hover:border-brand-900 hover:text-brand-900"
          }`}
        >
          <ListChecks className="h-3.5 w-3.5" />
          Aprobar parcialmente (por ítem)
        </button>
      </div>
      <p className="mb-3 text-[12px] text-ink-600">
        La decisión queda firmada con tu usuario, fecha y hora. Los ítems que no
        apruebes pasan a la bandeja de ítems pendientes de compra.
      </p>

      {parcial && (
        <div className="mb-3 overflow-hidden rounded-xl border border-line bg-white">
          <div className="max-h-[280px] overflow-y-auto">
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 z-[5] border-b border-line bg-page">
                <tr>
                  <th className="th w-10">Ok</th>
                  <th className="th">Ítem</th>
                  <th className="th w-[42%]">Observación si no se aprueba</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((it) => {
                  const ok = aprobados[it.id] !== false;
                  return (
                    <tr key={it.id}>
                      <td className="td py-2">
                        <button
                          type="button"
                          onClick={() =>
                            setAprobados((a) => ({ ...a, [it.id]: !ok }))
                          }
                          aria-label={ok ? "No aprobar" : "Aprobar"}
                          className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                            ok
                              ? "border-ok-600 bg-ok-600 text-white"
                              : "border-line bg-white"
                          }`}
                        >
                          {ok && <Check className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                      <td className="td py-2">
                        {it.codigo_sig && (
                          <span className="mr-1.5 rounded bg-page px-1 font-mono text-[10px] text-ink-600">
                            {it.codigo_sig}
                          </span>
                        )}
                        <span className="font-semibold">{it.descripcion}</span>
                        <span className="text-ink-400">
                          {" "}
                          × {it.cantidad} {it.unidad}
                        </span>
                      </td>
                      <td className="td py-2">
                        <input
                          className="input h-8 text-[12px] disabled:bg-page disabled:text-ink-400"
                          disabled={ok}
                          value={obsItem[it.id] ?? ""}
                          onChange={(e) =>
                            setObsItem((o) => ({
                              ...o,
                              [it.id]: e.target.value,
                            }))
                          }
                          placeholder={
                            ok ? "—" : "Motivo (presupuesto, stock, etc.)"
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line bg-page px-3 py-1.5 text-[11px] font-bold text-ink-600">
            {nAprobados} de {items.length} ítems aprobados
          </div>
        </div>
      )}

      <textarea
        className="input mb-3"
        rows={2}
        placeholder="Observación general (obligatoria si rechazas o apruebas parcialmente)"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />
      {error && <p className="mb-2 text-sm text-danger-600">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-danger-600 px-5 text-sm font-bold text-white transition hover:bg-danger-600/80 disabled:opacity-50"
          disabled={trabajando || !comentario.trim()}
          onClick={() => setPendiente("rechazado")}
        >
          <XCircle className="h-4 w-4" /> Rechazar
        </button>
        {parcial ? (
          <button
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-900 px-5 text-sm font-bold text-white transition hover:bg-brand-900/90 disabled:opacity-50"
            disabled={trabajando || ninguno || (!todos && !comentario.trim())}
            title={
              ninguno
                ? "Si no apruebas ningún ítem, usa Rechazar"
                : !todos && !comentario.trim()
                  ? "La aprobación parcial requiere observación"
                  : undefined
            }
            onClick={() =>
              setPendiente(todos ? "aprobado" : "aprobado_parcial")
            }
          >
            <ListChecks className="h-4 w-4" />
            {trabajando
              ? "Guardando…"
              : `Aprobar ${nAprobados} de ${items.length}`}
          </button>
        ) : (
          <button
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-ok-600 px-5 text-sm font-bold text-white transition hover:bg-ok-600/80 disabled:opacity-50"
            disabled={trabajando}
            onClick={() => setPendiente("aprobado")}
          >
            <CheckCircle2 className="h-4 w-4" />
            {trabajando ? "Guardando…" : "Aprobar todo"}
          </button>
        )}
      </div>

      <Confirmar
        abierto={pendiente !== null}
        titulo={
          pendiente === "rechazado"
            ? "¿Rechazar este cuadro comparativo?"
            : pendiente === "aprobado_parcial"
              ? "¿Aprobar parcialmente este comparativo?"
              : "¿Aprobar este cuadro comparativo?"
        }
        mensaje={
          pendiente === "rechazado"
            ? "El cuadro quedará rechazado con tu observación como sustento y todos sus ítems pasarán a la bandeja de pendientes de compra. La resolución queda firmada con tu usuario, fecha y hora en el registro de auditoría."
            : pendiente === "aprobado_parcial"
              ? `Se aprueban ${nAprobados} de ${items.length} ítems con el proveedor seleccionado. Los ${items.length - nAprobados} ítem(s) restantes pasarán a la bandeja de pendientes de compra para descartarlos o llevarlos a otro comparativo.`
              : "Se aprueban todos los ítems. El proveedor seleccionado pasará al estado Aprobado y podrá ser evaluado periódicamente. La resolución queda firmada con tu usuario, fecha y hora en el registro de auditoría."
        }
        confirmLabel={
          pendiente === "rechazado"
            ? "Sí, rechazar"
            : pendiente === "aprobado_parcial"
              ? "Sí, aprobar parcialmente"
              : "Sí, aprobar"
        }
        tono={pendiente === "rechazado" ? "peligro" : "brand"}
        cargando={trabajando}
        onCancelar={() => setPendiente(null)}
        onConfirmar={() => {
          const accion = pendiente!;
          setPendiente(null);
          resolver(accion);
        }}
      />
    </div>
  );
}

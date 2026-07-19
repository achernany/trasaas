"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Trash2, ShoppingCart, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Confirmar from "@/components/Confirmar";

export type ItemPendiente = {
  id: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  codigo_sig: string | null;
  precio_historico: number | null;
  observacion_aprobador: string | null;
  resuelto_en: string | null;
  cuadro_id: string;
  cuadro_codigo: string;
  ticket: string | null;
  area: string | null;
};

/**
 * Bandeja de ítems pendientes de compra: lo que el aprobador NO aprobó.
 * Dos salidas posibles: descartar (con trazabilidad) o llevarlos a un
 * nuevo comparativo (se precargan en el asistente).
 */
export default function PendientesTabla({ rows }: { rows: ItemPendiente[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [confirmando, setConfirmando] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seleccionados = useMemo(
    () => rows.filter((r) => sel[r.id]),
    [rows, sel]
  );

  async function descartar() {
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
      const ids = seleccionados.map((r) => r.id);
      const { error: e1 } = await supabase
        .from("cuadro_items")
        .update({ estado_aprobacion: "descartado" })
        .in("id", ids);
      if (e1) throw e1;
      await supabase.from("audit_log").insert({
        empresa_id: perfil!.empresa_id,
        usuario_id: auth.user!.id,
        entidad: "cuadro_items",
        entidad_id: ids[0],
        accion: "descartar_pendiente",
        detalle: {
          items: seleccionados.map((r) => ({
            codigo_sig: r.codigo_sig,
            descripcion: r.descripcion,
            cuadro: r.cuadro_codigo,
          })),
        },
      });
      setSel({});
      setConfirmando(false);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "No se pudo descartar");
    }
    setTrabajando(false);
  }

  function irANuevoComparativo() {
    const ids = seleccionados.map((r) => r.id).join(",");
    router.push(`/panel/cuadros/nuevo?pendientes=${ids}`);
  }

  if (rows.length === 0)
    return (
      <div className="card flex h-[calc(100vh-350px)] flex-col items-center justify-center gap-2 text-center">
        <ShoppingCart className="h-8 w-8 text-ink-400" />
        <p className="text-sm font-semibold">No hay ítems pendientes</p>
        <p className="max-w-sm text-[12px] text-ink-400">
          Aquí caen los ítems que el aprobador no aprobó en un comparativo, para
          descartarlos o llevarlos a una nueva cotización.
        </p>
      </div>
    );

  return (
    <>
      <div className="card p-0">
        <div className="h-[calc(100vh-390px)] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-[5] border-b border-line bg-page">
              <tr>
                <th className="th w-10" />
                <th className="th">Ítem</th>
                <th className="th">Comparativo de origen</th>
                <th className="th">Observación del aprobador</th>
                <th className="th text-right">Precio histórico</th>
                <th className="th">No aprobado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-[12px]">
              {rows.map((r) => {
                const ok = !!sel[r.id];
                return (
                  <tr
                    key={r.id}
                    className="cursor-pointer transition hover:bg-brand-100/30"
                    onClick={() => setSel((s) => ({ ...s, [r.id]: !ok }))}
                  >
                    <td className="td py-2.5">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                          ok
                            ? "border-brand-900 bg-brand-900 text-white"
                            : "border-line bg-white"
                        }`}
                      >
                        {ok && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </td>
                    <td className="td py-2.5">
                      {r.codigo_sig && (
                        <span className="mr-1.5 rounded bg-page px-1 font-mono text-[10px] text-ink-600">
                          {r.codigo_sig}
                        </span>
                      )}
                      <span className="font-semibold">{r.descripcion}</span>
                      <span className="text-ink-400">
                        {" "}
                        × {r.cantidad} {r.unidad}
                      </span>
                    </td>
                    <td className="td py-2.5">
                      <Link
                        href={`/panel/cuadros/${r.cuadro_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-brand-900 hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {r.cuadro_codigo}
                      </Link>
                      <span className="block text-[10.5px] text-ink-400">
                        {r.ticket ? `Ticket ${r.ticket}` : "—"}
                        {r.area ? ` · ${r.area}` : ""}
                      </span>
                    </td>
                    <td className="td py-2.5 text-ink-600">
                      {r.observacion_aprobador || "—"}
                    </td>
                    <td className="td py-2.5 text-right tabular-nums text-ink-600">
                      {r.precio_historico != null
                        ? `S/ ${Number(r.precio_historico).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="td py-2.5 font-mono text-[11px] text-ink-400">
                      {r.resuelto_en?.slice(0, 10) ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-danger-600">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-bold text-ink-600">
          {seleccionados.length} seleccionado(s) de {rows.length}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-secondary min-h-[40px] disabled:opacity-50"
            disabled={seleccionados.length === 0}
            onClick={() => setConfirmando(true)}
          >
            <Trash2 className="h-4 w-4" /> Descartar
          </button>
          <button
            className="btn min-h-[40px] disabled:opacity-50"
            disabled={seleccionados.length === 0}
            onClick={irANuevoComparativo}
          >
            <ShoppingCart className="h-4 w-4" /> Llevar a nuevo comparativo
          </button>
        </div>
      </div>

      <Confirmar
        abierto={confirmando}
        titulo="¿Descartar los ítems seleccionados?"
        mensaje={`${seleccionados.length} ítem(s) saldrán de la bandeja y quedarán marcados como descartados. La acción queda firmada con tu usuario en el registro de auditoría; el comparativo de origen conserva su historial.`}
        confirmLabel="Sí, descartar"
        tono="peligro"
        cargando={trabajando}
        onCancelar={() => setConfirmando(false)}
        onConfirmar={descartar}
      />
    </>
  );
}

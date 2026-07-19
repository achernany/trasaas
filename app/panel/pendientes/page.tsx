import { createClient } from "@/lib/supabase/server";
import Hint from "@/components/Hint";
import PendientesTabla, {
  type ItemPendiente,
} from "@/components/PendientesTabla";

export const dynamic = "force-dynamic";

export default async function PendientesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("cuadro_items")
    .select(
      `id, descripcion, cantidad, unidad, codigo_sig, precio_historico,
       observacion_aprobador, resuelto_en,
       cuadros(id, codigo, requerimientos(ticket_avandesk, area_solicitante))`
    )
    .eq("estado_aprobacion", "no_aprobado")
    .order("resuelto_en", { ascending: false })
    .limit(500);

  const rows: ItemPendiente[] = ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    descripcion: r.descripcion,
    cantidad: Number(r.cantidad),
    unidad: r.unidad,
    codigo_sig: r.codigo_sig ?? null,
    precio_historico:
      r.precio_historico != null ? Number(r.precio_historico) : null,
    observacion_aprobador: r.observacion_aprobador ?? null,
    resuelto_en: r.resuelto_en ?? null,
    cuadro_id: r.cuadros?.id,
    cuadro_codigo: r.cuadros?.codigo ?? "—",
    ticket: r.cuadros?.requerimientos?.ticket_avandesk ?? null,
    area: r.cuadros?.requerimientos?.area_solicitante ?? null,
  }));

  return (
    <div>
      <div className="page-head">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          Ítems pendientes de compra
          <Hint
            texto="Cuando el aprobador aprueba un comparativo solo parcialmente, los ítems que no aprobó caen aquí para no perderse. Desde esta bandeja se descartan (queda registrado quién y cuándo) o se llevan a un nuevo comparativo con otros proveedores, conservando el enlace al cuadro de origen."
            roles={["comprador", "analista", "coordinador", "director"]}
          />
        </h1>
        <p className="text-[12px] text-ink-400">
          Ítems no aprobados en comparativos · descártalos o llévalos a una
          nueva cotización
        </p>
      </div>

      <div className="mt-3">
        <PendientesTabla rows={rows} />
      </div>
    </div>
  );
}

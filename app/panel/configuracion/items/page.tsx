import { createClient } from "@/lib/supabase/server";
import ConfigHeader from "@/components/ConfigHeader";
import ItemsAdmin from "@/components/ItemsAdmin";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("items")
    .select("id, codigo, descripcion, tipo, unidad, ultimo_costo, activo")
    .order("codigo")
    .limit(2000);

  return (
    <div className="mx-auto w-full max-w-5xl pb-6" style={{ minHeight: "calc(100vh - 96px)" }}>
      <ConfigHeader
        titulo="Códigos SIG · Productos y servicios"
        desc="Catálogo estandarizado del ERP · los ítems de los comparativos se seleccionan de aquí, nunca texto libre"
        hint="La primera carga se hace con el botón Carga masiva CSV usando el Excel exportado del ERP (codigo; descripcion; tipo; unidad; ultimo_costo). Si una cotización supera el último costo de un ítem, el comparativo se marca con alerta y la aprobación escala al máximo aprobador."
      />
      <div className="mt-4">
        <ItemsAdmin iniciales={(items ?? []) as any} />
      </div>
    </div>
  );
}

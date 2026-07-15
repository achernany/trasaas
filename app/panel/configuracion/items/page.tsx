import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
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
    <div>
      <div className="page-head flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Códigos SIG · Productos y servicios
          </h1>
          <p className="text-[12px] text-ink-400">
            Catálogo estandarizado del ERP · en los comparativos los ítems se
            seleccionan de aquí, nunca texto libre · si una cotización supera el
            último costo, alerta y escala al máximo aprobador
          </p>
        </div>
        <Link
          href="/panel/configuracion"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-400 transition hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" /> Configuración
        </Link>
      </div>
      <div className="mt-4">
        <ItemsAdmin iniciales={(items ?? []) as any} />
      </div>
    </div>
  );
}

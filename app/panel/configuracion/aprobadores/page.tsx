import { createClient } from "@/lib/supabase/server";
import ConfigHeader from "@/components/ConfigHeader";
import AprobadoresAdmin from "@/components/AprobadoresAdmin";

export const dynamic = "force-dynamic";

export default async function AprobadoresPage() {
  const supabase = createClient();
  const { data: aprobadores } = await supabase
    .from("aprobadores")
    .select("id, nombre, email, area, cargo, monto_max, activo")
    .order("creado_en");

  return (
    <div className="mx-auto w-full max-w-5xl pb-6" style={{ minHeight: "calc(100vh - 96px)" }}>
      <ConfigHeader
        titulo="Aprobadores de comparativos"
        desc="El aprobador varía según área y monto · el máximo aprobador recibe las alertas de precio"
        hint="Registra a cada aprobador con su área y monto máximo. Al enviar un comparativo, el sistema sugiere automáticamente al aprobador correcto según el total; si hay alerta de precio histórico, escala al máximo aprobador (el que no tiene tope)."
      />
      <div className="mt-4">
        <AprobadoresAdmin iniciales={(aprobadores ?? []) as any} />
      </div>
    </div>
  );
}

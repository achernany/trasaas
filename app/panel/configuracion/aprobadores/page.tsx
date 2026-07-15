import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AprobadoresAdmin from "@/components/AprobadoresAdmin";

export const dynamic = "force-dynamic";

export default async function AprobadoresPage() {
  const supabase = createClient();
  const { data: aprobadores } = await supabase
    .from("aprobadores")
    .select("id, nombre, email, area, cargo, monto_max, activo")
    .order("creado_en");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="page-head flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Aprobadores de comparativos
          </h1>
          <p className="text-[12px] text-ink-400">
            El aprobador varía según área y monto · si el precio supera el
            histórico, la aprobación escala al máximo aprobador (sin tope)
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
        <AprobadoresAdmin iniciales={(aprobadores ?? []) as any} />
      </div>
    </div>
  );
}

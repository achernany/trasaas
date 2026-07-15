import Link from "next/link";
import { X } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MatrizEditor from "@/components/MatrizEditor";

export const dynamic = "force-dynamic";

export default async function EditarMatrizPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: m } = await supabase
    .from("matrices")
    .select(
      `id, empresa_id, nombre, tipo, clasificacion, categoria_id, version, estado,
       umbral_confiable, umbral_medianamente,
       meses_reeval_confiable, meses_reeval_medianamente, meses_reeval_no_confiable,
       criterios(id, orden, nombre, peso_max, criterio_opciones(id, orden, etiqueta, descripcion, puntos)),
       matriz_documentos(id, descripcion, eliminatorio)`
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!m) notFound();
  const mx = m as any;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/45 px-4 py-10 backdrop-blur-sm">
      <div className="step-enter flex h-full max-h-[780px] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between bg-ink-950 px-5 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold leading-6 tracking-tight text-white">
              Editar matriz — {mx.nombre}
            </h1>
            <p className="text-[11px] leading-4 text-white/50">
              Editando v{mx.version} → se creará y activará la v{mx.version + 1}
              · la actual queda archivada
            </p>
          </div>
          <Link
            href="/panel/configuracion/matrices"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar sin guardar"
          >
            <X className="h-[18px] w-[18px]" />
          </Link>
        </div>
        <MatrizEditor matriz={mx} />
      </div>
    </div>
  );
}

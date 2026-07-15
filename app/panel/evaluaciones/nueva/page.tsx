import Link from "next/link";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import EvaluacionForm from "@/components/EvaluacionForm";

export const dynamic = "force-dynamic";

export default async function NuevaEvaluacionPage({
  searchParams,
}: {
  searchParams: { pc?: string };
}) {
  const supabase = createClient();

  const [{ data: proveedores }, { data: categorias }, { data: proyectos }, { data: matrices }] =
    await Promise.all([
      supabase
        .from("proveedores")
        .select("id, ruc, razon_social, clasificacion")
        .eq("estado", "aprobado")
        .order("razon_social"),
      supabase.from("categorias").select("id, nombre").order("nombre"),
      supabase.from("proyectos").select("id, nombre").order("nombre"),
      supabase
        .from("matrices")
        .select(
          "id, nombre, tipo, clasificacion, umbral_confiable, umbral_medianamente, meses_reeval_confiable, meses_reeval_medianamente, meses_reeval_no_confiable, criterios(id, orden, nombre, peso_max, criterio_opciones(id, orden, etiqueta, descripcion, puntos)), matriz_documentos(id, descripcion, eliminatorio)"
        )
        .eq("estado", "vigente"),
    ]);

  let preseleccion: { proveedorId: string; categoriaId: string } | null = null;
  if (searchParams.pc) {
    const { data: pc } = await supabase
      .from("proveedor_categorias")
      .select("proveedor_id, categoria_id")
      .eq("id", searchParams.pc)
      .maybeSingle();
    if (pc)
      preseleccion = {
        proveedorId: pc.proveedor_id,
        categoriaId: pc.categoria_id,
      };
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-ink-900/45 px-4 py-10 backdrop-blur-sm">
      <div className="step-enter flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between bg-ink-950 px-5 py-3">
          <div>
            <h1 className="text-base font-semibold leading-6 tracking-tight text-white">
              Nueva evaluación
            </h1>
            <p className="text-[11px] leading-4 text-white/50">
              Formato LOG-F-P03-01 · clasificación automática según matriz
              vigente
            </p>
          </div>
          <Link
            href="/panel/evaluaciones"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar y volver a evaluaciones"
          >
            <X className="h-[18px] w-[18px]" />
          </Link>
        </div>
        <EvaluacionForm
          proveedores={proveedores ?? []}
          categorias={categorias ?? []}
          proyectos={proyectos ?? []}
          matrices={(matrices ?? []) as any}
          preseleccion={preseleccion}
        />
      </div>
    </div>
  );
}

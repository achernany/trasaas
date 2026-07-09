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
        .select("id, ruc, razon_social")
        .order("razon_social"),
      supabase.from("categorias").select("id, nombre").order("nombre"),
      supabase.from("proyectos").select("id, nombre").order("nombre"),
      supabase
        .from("matrices")
        .select(
          "id, nombre, tipo, umbral_confiable, umbral_medianamente, meses_reeval_confiable, meses_reeval_medianamente, meses_reeval_no_confiable, criterios(id, orden, nombre, peso_max, criterio_opciones(id, orden, etiqueta, descripcion, puntos)), matriz_documentos(id, descripcion, eliminatorio)"
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
    <div className="overlay overflow-y-auto">
      <div className="mx-auto my-6 w-full max-w-3xl px-4">
        <div className="step-enter rounded-2xl border border-line bg-page shadow-2xl">
          <div className="flex items-center justify-between rounded-t-2xl border-b border-line bg-white px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Nueva evaluación
              </h1>
              <p className="text-[12px] text-ink-400">
                Formato LOG-F-P03-01 · clasificación automática según matriz
                vigente
              </p>
            </div>
            <Link
              href="/panel/evaluaciones"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-400 transition hover:bg-page hover:text-ink-900"
              aria-label="Cerrar y volver a evaluaciones"
            >
              <X className="h-5 w-5" />
            </Link>
          </div>
          <div className="p-6">
            <EvaluacionForm
              proveedores={proveedores ?? []}
              categorias={categorias ?? []}
              proyectos={proyectos ?? []}
              matrices={(matrices ?? []) as any}
              preseleccion={preseleccion}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        Nueva evaluación
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Formato LOG-F-P03-01 · La clasificación se calcula automáticamente según
        la matriz vigente
      </p>
      <EvaluacionForm
        proveedores={proveedores ?? []}
        categorias={categorias ?? []}
        proyectos={proyectos ?? []}
        matrices={(matrices ?? []) as any}
        preseleccion={preseleccion}
      />
    </div>
  );
}

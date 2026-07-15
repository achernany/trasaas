import { createClient } from "@/lib/supabase/server";
import ConfigHeader from "@/components/ConfigHeader";
import MatricesLista from "@/components/MatricesLista";

export const dynamic = "force-dynamic";

export default async function MatricesPage() {
  const supabase = createClient();
  const { data: matrices } = await supabase
    .from("matrices")
    .select(
      `id, nombre, tipo, clasificacion, version, estado, creado_en,
       umbral_confiable, umbral_medianamente,
       meses_reeval_confiable, meses_reeval_medianamente, meses_reeval_no_confiable,
       criterios(id, orden, nombre, peso_max, criterio_opciones(id, orden, etiqueta, descripcion, puntos)),
       matriz_documentos(id, descripcion, eliminatorio)`
    )
    .order("estado", { ascending: false })
    .order("tipo")
    .order("version", { ascending: false });

  return (
    <div
      className="mx-auto w-full max-w-5xl pb-6"
      style={{ minHeight: "calc(100vh - 96px)" }}
    >
      <ConfigHeader
        titulo="Matrices de evaluación"
        desc="Cada evaluación conserva la versión de matriz con la que fue hecha · editar crea una nueva versión y archiva la anterior"
        hint="Haz clic en una matriz para consultarla en detalle. Editar nunca modifica la matriz actual: crea una versión nueva y archiva la anterior, de modo que ante auditoría siempre se puede demostrar con qué criterios se evaluó a cada proveedor."
      />
      <div className="mt-3">
        <MatricesLista rows={(matrices ?? []) as any} />
      </div>
    </div>
  );
}

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

  return <MatrizEditor matriz={m as any} />;
}

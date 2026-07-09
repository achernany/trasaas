import Link from "next/link";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NuevoCuadro, { type ProvConfiable } from "@/components/NuevoCuadro";

export const dynamic = "force-dynamic";

export default async function NuevoCuadroPage() {
  const supabase = createClient();
  const [{ data: pcs }, { data: proyectos }] = await Promise.all([
    supabase
      .from("proveedor_categorias")
      .select("proveedor_id, calificacion_actual, nota_actual, proveedores(razon_social, ruc)")
      .eq("calificacion_actual", "confiable"),
    supabase.from("proyectos").select("id, nombre").order("nombre"),
  ]);

  // dedupe por proveedor (puede ser confiable en varias categorías)
  const vistos = new Set<string>();
  const confiables: ProvConfiable[] = [];
  for (const pc of (pcs ?? []) as any[]) {
    if (vistos.has(pc.proveedor_id)) continue;
    vistos.add(pc.proveedor_id);
    confiables.push({
      proveedor_id: pc.proveedor_id,
      razon_social: pc.proveedores?.razon_social ?? "",
      ruc: pc.proveedores?.ruc ?? "",
      calificacion: pc.calificacion_actual,
      nota: pc.nota_actual,
    });
  }
  confiables.sort((a, b) => a.razon_social.localeCompare(b.razon_social));

  return (
    <div className="overlay overflow-y-auto">
      <div className="mx-auto my-6 w-full max-w-3xl px-4">
        <div className="step-enter rounded-2xl border border-line bg-page shadow-2xl">
          <div className="flex items-center justify-between rounded-t-2xl border-b border-line bg-white px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Nuevo cuadro comparativo
              </h1>
              <p className="text-[12px] text-ink-400">
                Formato LOG-GN-F-P02-07 · solo proveedores confiables · matriz
                ponderada automática
              </p>
            </div>
            <Link
              href="/panel/cuadros"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-400 transition hover:bg-page hover:text-ink-900"
              aria-label="Cerrar y volver a comparativos"
            >
              <X className="h-5 w-5" />
            </Link>
          </div>
          <div className="p-6">
            <NuevoCuadro confiables={confiables} proyectos={proyectos ?? []} />
          </div>
        </div>
      </div>
    </div>
  );
}

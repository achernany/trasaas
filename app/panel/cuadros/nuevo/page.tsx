import Link from "next/link";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import NuevoCuadro, {
  type Aprobador,
  type ItemSig,
  type ProvConfiable,
} from "@/components/NuevoCuadro";

export const dynamic = "force-dynamic";

export default async function NuevoCuadroPage({
  searchParams,
}: {
  searchParams: { pendientes?: string };
}) {
  const supabase = createClient();
  const idsPendientes = (searchParams.pendientes ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const [{ data: pcs }, { data: proyectos }, { data: cat }, { data: aps }] =
    await Promise.all([
      supabase
        .from("proveedor_categorias")
        .select(
          "proveedor_id, calificacion_actual, nota_actual, proveedores(razon_social, ruc, estado, clasificacion)"
        ),
      supabase.from("proyectos").select("id, nombre").order("nombre"),
      supabase
        .from("items")
        .select(
          "id, codigo, descripcion, unidad, ultimo_costo, fecha_ultima_compra"
        )
        .eq("activo", true)
        .order("codigo")
        .limit(2000),
      supabase
        .from("aprobadores")
        .select("id, nombre, email, area, monto_max")
        .eq("activo", true)
        .order("monto_max", { ascending: true, nullsFirst: false }),
    ]);

  // Elegibles: proveedores CLASIFICADOS (Selección) o ya Aprobados.
  // Único criterio de entrada al comparativo — sin calificaciones.
  const vistos = new Set<string>();
  const confiables: ProvConfiable[] = [];
  for (const pc of (pcs ?? []) as any[]) {
    if (vistos.has(pc.proveedor_id)) continue;
    const estado = pc.proveedores?.estado;
    if (estado !== "seleccionado" && estado !== "aprobado") continue;
    vistos.add(pc.proveedor_id);
    confiables.push({
      proveedor_id: pc.proveedor_id,
      razon_social: pc.proveedores?.razon_social ?? "",
      ruc: pc.proveedores?.ruc ?? "",
      calificacion: pc.calificacion_actual ?? "",
      clasificacion: pc.proveedores?.clasificacion ?? "regular",
      nota: pc.nota_actual,
    });
  }
  confiables.sort((a, b) => a.razon_social.localeCompare(b.razon_social));

  // Ítems traídos desde la bandeja de pendientes de compra
  let precarga: any[] = [];
  if (idsPendientes.length > 0) {
    const { data: pend } = await supabase
      .from("cuadro_items")
      .select(
        "id, descripcion, cantidad, unidad, item_id, codigo_sig, precio_historico, fecha_ultima_compra"
      )
      .in("id", idsPendientes)
      .eq("estado_aprobacion", "no_aprobado");
    precarga = ((pend ?? []) as any[]).map((p) => ({
      descripcion: p.descripcion,
      cantidad: Number(p.cantidad),
      unidad: p.unidad,
      item_id: p.item_id ?? null,
      codigo_sig: p.codigo_sig ?? null,
      ultimo_costo:
        p.precio_historico != null ? Number(p.precio_historico) : null,
      origen_item_id: p.id,
    }));
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-ink-900/45 px-4 py-10 backdrop-blur-sm">
      <div className="step-enter flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between bg-ink-950 px-5 py-3">
          <div>
            <h1 className="text-base font-semibold leading-6 tracking-tight text-white">
              Nuevo cuadro comparativo
            </h1>
            <p className="text-[11px] leading-4 text-white/50">
              {precarga.length > 0
                ? `LOG-GN-F-P02-07 · ${precarga.length} ítem(s) traídos de la bandeja de pendientes`
                : "LOG-GN-F-P02-07 · proveedores clasificados (críticos y no críticos) · matriz ponderada automática"}
            </p>
          </div>
          <Link
            href="/panel/cuadros"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar y volver a comparativos"
          >
            <X className="h-[18px] w-[18px]" />
          </Link>
        </div>
        <NuevoCuadro
          confiables={confiables}
          proyectos={proyectos ?? []}
          catalogo={(cat ?? []) as ItemSig[]}
          aprobadores={(aps ?? []) as Aprobador[]}
          precarga={precarga}
        />
      </div>
    </div>
  );
}

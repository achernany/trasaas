import { UserCheck, Users, CheckCircle2, Shield, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SeleccionTabla from "@/components/SeleccionTabla";
import Hint from "@/components/Hint";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SeleccionPage({
  searchParams,
}: {
  searchParams: { filtro?: string; q?: string };
}) {
  const supabase = createClient();
  const filtro = searchParams.filtro ?? "pendientes";
  const q = (searchParams.q ?? "").trim();

  const [{ data: provs }, { data: categorias }] = await Promise.all([
    supabase
      .from("proveedores")
      .select(
        "id, ruc, razon_social, distrito, estado, clasificacion, creado_en, proveedor_categorias(id, suministro, categorias(id, nombre, tipo))"
      )
      .in("estado", ["registrado", "seleccionado", "aprobado"])
      .order("creado_en", { ascending: false })
      .limit(500),
    supabase
      .from("categorias")
      .select("id, nombre, tipo")
      .eq("activo", true)
      .order("nombre"),
  ]);

  let rows = (provs ?? []) as any[];
  const conteos = {
    pendientes: rows.filter((p) => p.estado === "registrado").length,
    seleccionados: rows.filter((p) => p.estado === "seleccionado").length,
    aprobados: rows.filter((p) => p.estado === "aprobado").length,
  };

  if (q) {
    const qq = q.toLowerCase();
    rows = rows.filter(
      (p) =>
        p.razon_social?.toLowerCase().includes(qq) || p.ruc?.includes(qq)
    );
  }
  if (filtro === "criticos")
    rows = rows.filter((p) => p.clasificacion === "critico");
  else if (filtro === "regulares")
    rows = rows.filter((p) => p.clasificacion !== "critico");
  else if (filtro === "pendientes")
    rows = rows.filter((p) => p.estado === "registrado");
  else if (filtro === "seleccionados")
    rows = rows.filter((p) => p.estado === "seleccionado");
  else if (filtro === "aprobados")
    rows = rows.filter((p) => p.estado === "aprobado");

  const chips = [
    { key: "pendientes", label: `Por seleccionar (${conteos.pendientes})`, Icon: Users },
    { key: "seleccionados", label: `Seleccionados (${conteos.seleccionados})`, Icon: UserCheck },
    { key: "aprobados", label: `Aprobados (${conteos.aprobados})`, Icon: CheckCircle2 },
    {
      key: "criticos",
      label: `Críticos (${(provs ?? []).filter((p: any) => p.clasificacion === "critico").length})`,
      Icon: ShieldAlert,
    },
    {
      key: "regulares",
      label: `Regulares (${(provs ?? []).filter((p: any) => p.clasificacion !== "critico").length})`,
      Icon: Shield,
    },
  ];

  return (
    <div>
      <div className="page-head space-y-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            Selección de proveedores
            <Hint
              texto="Paso 2 del flujo de compra: aquí el comprador categoriza a cada proveedor registrado (la categoría define si es bien o servicio) y le asigna clasificación Regular o Crítico, que determina la matriz de su evaluación periódica. Un proveedor pasa a Aprobado cuando gana un comparativo aprobado."
              roles={["comprador", "analista", "coordinador", "director"]}
            />
          </h1>
          <p className="text-[12px] text-ink-400">
            Categoriza a los proveedores registrados: tipo (bien/servicio vía
            categoría) y clasificación Regular/Crítico · el estado Aprobado se
            gana al ganar un comparativo aprobado
          </p>
        </div>
        <form className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por razón social o RUC…"
            className="input h-10 max-w-md text-[13px]"
          />
          {filtro !== "pendientes" && (
            <input type="hidden" name="filtro" value={filtro} />
          )}
          <button className="btn-secondary min-h-[40px]" type="submit">
            Buscar
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <Link
              key={c.key}
              href={`/panel/seleccion?filtro=${c.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`${filtro === c.key ? "chip-active" : "chip"} min-h-[30px] px-3 text-[12px]`}
            >
              <c.Icon className="h-3.5 w-3.5" /> {c.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <SeleccionTabla rows={rows} categorias={(categorias ?? []) as any} />
      </div>
    </div>
  );
}

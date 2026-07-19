import { CheckCircle2, Shield, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
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
  const filtro = searchParams.filtro ?? "criticos";
  const q = (searchParams.q ?? "").trim();

  const [{ data: provs }, { data: categorias }] = await Promise.all([
    supabase
      .from("proveedores")
      .select(
        "id, ruc, razon_social, distrito, estado, clasificacion, creado_en, proveedor_categorias(id, suministro, categorias(id, nombre, tipo))"
      )
      .in("estado", ["seleccionado", "aprobado"])
      .order("creado_en", { ascending: false })
      .limit(500),
    supabase
      .from("categorias")
      .select("id, nombre, tipo")
      .eq("activo", true)
      .order("nombre"),
  ]);

  let rows = (provs ?? []) as any[];

  // Cadena documental: docs que el proveedor subió en su registro (por RUC)
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: regs } = await admin
    .from("proveedor_registros")
    .select("form_data, proveedor_documentos(id, tipo, archivo_url)")
    .in("estado", ["enviado", "validado"]);
  const docsPorRuc: Record<
    string,
    { tipo: string; nombre: string; url: string }[]
  > = {};
  for (const r of (regs ?? []) as any[]) {
    const ruc = r.form_data?.ruc;
    if (!ruc) continue;
    for (const d of r.proveedor_documentos ?? []) {
      const { data: firmada } = await admin.storage
        .from("registro-docs")
        .createSignedUrl(d.archivo_url, 3600);
      if (!firmada?.signedUrl) continue;
      (docsPorRuc[ruc] ??= []).push({
        tipo: d.tipo,
        nombre: d.archivo_url.split("/").pop() ?? d.tipo,
        url: firmada.signedUrl,
      });
    }
  }
  const conteos = {
    criticos: rows.filter((p) => p.clasificacion === "critico").length,
    no_criticos: rows.filter((p) => p.clasificacion !== "critico").length,
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
  else if (filtro === "no_criticos")
    rows = rows.filter((p) => p.clasificacion !== "critico");
  else if (filtro === "aprobados")
    rows = rows.filter((p) => p.estado === "aprobado");

  const chips = [
    {
      key: "criticos",
      label: `Críticos (${conteos.criticos})`,
      Icon: ShieldAlert,
    },
    {
      key: "no_criticos",
      label: `No críticos (${conteos.no_criticos})`,
      Icon: Shield,
    },
    {
      key: "aprobados",
      label: `Aprobados (${conteos.aprobados})`,
      Icon: CheckCircle2,
    },
  ];

  return (
    <div>
      <div className="page-head space-y-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            Selección de proveedores
            <Hint
              texto="Aquí llegan los proveedores clasificados desde Registro (Matriz LOG-GN-A-P02-02). Solo existen tres estados: Crítico, No crítico y Aprobado. Desde aquí compiten en comparativos; al ganar uno aprobado pasan a Aprobados. La clasificación define la matriz de su evaluación periódica."
              roles={["comprador", "analista", "coordinador", "director"]}
            />
          </h1>
          <p className="text-[12px] text-ink-400">
            Proveedores clasificados desde Registro · Crítico / No crítico /
            Aprobado · el estado Aprobado se gana al ganar un comparativo
            aprobado
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
        <SeleccionTabla
          rows={rows}
          categorias={(categorias ?? []) as any}
          docsPorRuc={docsPorRuc}
        />
      </div>
    </div>
  );
}

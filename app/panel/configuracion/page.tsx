import Link from "next/link";
import { SlidersHorizontal, Mail, FileBadge, ChevronRight, Boxes, BadgeCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const supabase = createClient();
  const [
    { count: nMatrices },
    { count: nVigentes },
    { count: nDest },
    { count: nItems },
    { count: nAprob },
    { count: nUsers },
  ] = await Promise.all([
    supabase.from("matrices").select("*", { count: "exact", head: true }),
    supabase
      .from("matrices")
      .select("*", { count: "exact", head: true })
      .eq("estado", "vigente"),
    supabase
      .from("notificacion_destinatarios")
      .select("*", { count: "exact", head: true })
      .eq("activo", true),
    supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("activo", true),
    supabase
      .from("aprobadores")
      .select("*", { count: "exact", head: true })
      .eq("activo", true),
    supabase.from("usuarios").select("*", { count: "exact", head: true }),
  ]);

  const secciones = [
    {
      href: "/panel/configuracion/matrices",
      Icon: SlidersHorizontal,
      titulo: "Matrices de evaluación",
      desc: `${nVigentes ?? 0} vigentes de ${nMatrices ?? 0} versiones. Edita criterios y ponderaciones sin tocar código; cada cambio crea una nueva versión auditable.`,
    },
    {
      href: "/panel/configuracion/correos",
      Icon: Mail,
      titulo: "Correos y notificaciones",
      desc: `${nDest ?? 0} destinatarios activos. Define quién recibe avisos de nuevos proveedores, evaluaciones por vencer, encuestas y comparativos.`,
    },
    {
      href: "/panel/configuracion/items",
      Icon: Boxes,
      titulo: "Códigos SIG · Productos y servicios",
      desc: `${nItems ?? 0} ítems activos. Catálogo estandarizado del ERP con carga masiva; alimenta los comparativos y la alerta de precio histórico.`,
    },
    {
      href: "/panel/configuracion/aprobadores",
      Icon: BadgeCheck,
      titulo: "Aprobadores de comparativos",
      desc: `${nAprob ?? 0} activos. Define quién aprueba según área y monto; el máximo aprobador recibe las alertas de precio.`,
    },
    {
      href: "/panel/configuracion/usuarios",
      Icon: Users,
      titulo: "Usuarios y roles",
      desc: `${nUsers ?? 0} usuarios. Director, Coordinador, Analista, Comprador y Auditor (solo lectura).`,
    },
    {
      href: "#",
      Icon: FileBadge,
      titulo: "Documentos corporativos",
      desc: "Membrete y logo institucional para actas y reportes en PDF. Disponible al recibir la plantilla oficial de Alfaco.",
      deshabilitado: true,
    },
  ];

  return (
    <div>
      <div className="page-head">
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-[12px] text-ink-400">
          Panel de administración · el sistema se ajusta desde aquí, sin
          depender de desarrollo
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {secciones.map((s) => (
          <Link
            key={s.titulo}
            href={s.href}
            className={`card card-hover flex flex-col gap-3 ${
              s.deshabilitado ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-900">
                <s.Icon className="h-5 w-5" />
              </span>
              {!s.deshabilitado && (
                <ChevronRight className="h-4 w-4 text-ink-400" />
              )}
            </div>
            <div>
              <h2 className="font-semibold">{s.titulo}</h2>
              <p className="mt-1 text-[12px] leading-5 text-ink-400">
                {s.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

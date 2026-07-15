import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import UsuariosAdmin from "@/components/UsuariosAdmin";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const supabase = createClient();
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nombre, email, rol, cargo, activo")
    .order("nombre");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="page-head flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Usuarios y roles
          </h1>
          <p className="text-[12px] text-ink-400">
            Asigna el rol de cada usuario · el Auditor solo visualiza y
            descarga · los permisos finos por módulo se configuran cuando
            Logística defina la matriz de permisos
          </p>
        </div>
        <Link
          href="/panel/configuracion"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-400 transition hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" /> Configuración
        </Link>
      </div>
      <div className="mt-4">
        <UsuariosAdmin iniciales={(usuarios ?? []) as any} />
      </div>
    </div>
  );
}

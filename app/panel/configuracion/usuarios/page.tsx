import { createClient } from "@/lib/supabase/server";
import ConfigHeader from "@/components/ConfigHeader";
import UsuariosAdmin from "@/components/UsuariosAdmin";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const supabase = createClient();
  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, nombre, email, rol, cargo, activo")
    .order("nombre");

  return (
    <div className="mx-auto w-full max-w-5xl pb-6" style={{ minHeight: "calc(100vh - 96px)" }}>
      <ConfigHeader
        titulo="Usuarios y roles"
        desc="Asigna el rol de cada usuario · el Auditor solo visualiza y descarga"
        hint="Roles disponibles: Administrador, Director del área, Coordinador General, Analista de compras, Comprador y Auditor (solo lectura). La restricción fina por módulo (p. ej. matrices solo Director y Logística) se activa con la matriz de permisos que definirá Logística."
      />
      <div className="mt-4">
        <UsuariosAdmin iniciales={(usuarios ?? []) as any} />
      </div>
    </div>
  );
}

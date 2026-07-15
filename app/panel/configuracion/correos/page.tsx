import { createClient } from "@/lib/supabase/server";
import ConfigHeader from "@/components/ConfigHeader";
import DestinatariosAdmin from "@/components/DestinatariosAdmin";

export const dynamic = "force-dynamic";

export default async function CorreosPage() {
  const supabase = createClient();
  const { data: destinatarios } = await supabase
    .from("notificacion_destinatarios")
    .select("id, nombre, email, tipos, activo")
    .order("creado_en");

  return (
    <div className="mx-auto w-full max-w-5xl pb-6" style={{ minHeight: "calc(100vh - 96px)" }}>
      <ConfigHeader
        titulo="Correos y notificaciones"
        desc="Quién recibe cada tipo de aviso · el envío automático se activa al conectar el servicio de correo"
        hint="Agrega destinatarios y marca qué avisos recibe cada uno. Cuando el servicio de correo esté conectado, el sistema enviará automáticamente: nuevos registros de proveedores, resumen diario de evaluaciones por vencer/vencidas, encuestas y comparativos para aprobación."
      />

      <div className="mt-4">
        <DestinatariosAdmin iniciales={(destinatarios ?? []) as any} />
      </div>
    </div>
  );
}

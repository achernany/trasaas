import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DestinatariosAdmin from "@/components/DestinatariosAdmin";

export const dynamic = "force-dynamic";

export default async function CorreosPage() {
  const supabase = createClient();
  const { data: destinatarios } = await supabase
    .from("notificacion_destinatarios")
    .select("id, nombre, email, tipos, activo")
    .order("creado_en");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="page-head flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Correos y notificaciones
          </h1>
          <p className="text-[12px] text-ink-400">
            Quién recibe cada tipo de aviso · el envío automático se activa al
            conectar el servicio de correo
          </p>
        </div>
        <Link href="/panel/configuracion" className="btn-secondary min-h-[40px]">
          ← Configuración
        </Link>
      </div>

      <div className="mt-4">
        <DestinatariosAdmin iniciales={(destinatarios ?? []) as any} />
      </div>
    </div>
  );
}

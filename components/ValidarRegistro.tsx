"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ValidarRegistro({ registroId }: { registroId: string }) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState(false);

  async function validar() {
    setTrabajando(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", auth.user!.id)
      .single();
    await supabase
      .from("proveedor_registros")
      .update({ estado: "validado", validado_por: auth.user!.id })
      .eq("id", registroId);
    await supabase.from("audit_log").insert({
      empresa_id: perfil!.empresa_id,
      usuario_id: auth.user!.id,
      entidad: "proveedor_registro",
      entidad_id: registroId,
      accion: "validar",
    });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={validar}
      disabled={trabajando}
      className="inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-ok-600 px-3 text-[11px] font-bold text-white transition hover:bg-ok-600/85 disabled:opacity-50"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {trabajando ? "Validando…" : "Validar"}
    </button>
  );
}

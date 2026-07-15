"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Confirmar from "@/components/Confirmar";

export default function ValidarRegistro({
  registroId,
  datos,
}: {
  registroId: string;
  datos: {
    ruc?: string;
    razon_social?: string;
    direccion?: string;
    distrito?: string;
  };
}) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

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

    // El proveedor validado entra al flujo: estado "registrado" → panel Selección
    if (datos.ruc && datos.razon_social) {
      const { data: existente } = await supabase
        .from("proveedores")
        .select("id")
        .eq("ruc", datos.ruc)
        .maybeSingle();
      if (!existente) {
        await supabase.from("proveedores").insert({
          empresa_id: perfil!.empresa_id,
          ruc: datos.ruc,
          razon_social: datos.razon_social,
          direccion: datos.direccion ?? null,
          distrito: datos.distrito ?? null,
          estado: "registrado",
        });
      }
    }
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
    <>
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      disabled={trabajando}
      className="inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-ok-600 px-3 text-[11px] font-bold text-white transition hover:bg-ok-600/85 disabled:opacity-50"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {trabajando ? "Validando…" : "Validar"}
    </button>
    <Confirmar
      abierto={confirmando}
      titulo="¿Validar este registro?"
      mensaje={`Se dará por verificado el expediente de ${datos.razon_social ?? "este proveedor"} y entrará al flujo de compra (aparecerá en Selección para ser categorizado). La validación queda registrada en auditoría con tu usuario.`}
      confirmLabel="Sí, validar"
      cargando={trabajando}
      onCancelar={() => setConfirmando(false)}
      onConfirmar={() => {
        setConfirmando(false);
        validar();
      }}
    />
    </>
  );
}

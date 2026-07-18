"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Confirmar from "@/components/Confirmar";

export default function AprobarCuadro({
  cuadroId,
  ganadorId,
}: {
  cuadroId: string;
  ganadorId?: string | null;
}) {
  const router = useRouter();
  const [comentario, setComentario] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [pendiente, setPendiente] = useState<"aprobado" | "rechazado" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolver(accion: "aprobado" | "rechazado") {
    setTrabajando(true);
    setError(null);
    const supabase = createClient();
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { data: perfil } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", auth.user!.id)
        .single();

      const { error: e1 } = await supabase.from("aprobaciones").insert({
        empresa_id: perfil!.empresa_id,
        cuadro_id: cuadroId,
        aprobador_id: auth.user!.id,
        token_email: crypto.randomUUID(),
        accion,
        comentario: comentario || null,
        resuelto_en: new Date().toISOString(),
      });
      if (e1) throw e1;

      const { error: e2 } = await supabase
        .from("cuadros")
        .update({ estado: accion, resuelto_en: new Date().toISOString() })
        .eq("id", cuadroId);
      if (e2) throw e2;

      // Flujo: al aprobar el comparativo, el ganador pasa a "proveedor aprobado"
      if (accion === "aprobado" && ganadorId) {
        await supabase
          .from("proveedores")
          .update({ estado: "aprobado" })
          .eq("id", ganadorId);
      }

      await supabase.from("audit_log").insert({
        empresa_id: perfil!.empresa_id,
        usuario_id: auth.user!.id,
        entidad: "cuadro",
        entidad_id: cuadroId,
        accion,
        detalle: { comentario: comentario || null },
      });

      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Error");
      setTrabajando(false);
    }
  }

  return (
    <div className="card border-warn-700/30 bg-warn-100/30">
      <h3 className="mb-2 font-semibold">Resolución del aprobador</h3>
      <textarea
        className="input mb-3"
        rows={2}
        placeholder="Comentario (obligatorio si rechazas)"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />
      {error && <p className="mb-2 text-sm text-danger-600">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-danger-600 px-5 text-sm font-bold text-white transition hover:bg-danger-600/80 disabled:opacity-50"
          disabled={trabajando || !comentario.trim()}
          onClick={() => setPendiente("rechazado")}
        >
          <XCircle className="h-4 w-4" /> Rechazar
        </button>
        <button
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-ok-600 px-5 text-sm font-bold text-white transition hover:bg-ok-600/80 disabled:opacity-50"
          disabled={trabajando}
          onClick={() => setPendiente("aprobado")}
        >
          <CheckCircle2 className="h-4 w-4" />
          {trabajando ? "Guardando…" : "Aprobar"}
        </button>
      </div>

      <Confirmar
        abierto={pendiente !== null}
        titulo={
          pendiente === "aprobado"
            ? "¿Aprobar este cuadro comparativo?"
            : "¿Rechazar este cuadro comparativo?"
        }
        mensaje={
          pendiente === "aprobado"
            ? "El proveedor ganador pasará al estado Aprobado y podrá ser evaluado periódicamente. La resolución queda firmada con tu usuario, fecha y hora en el registro de auditoría."
            : "El cuadro quedará rechazado con tu comentario como sustento. La resolución queda firmada con tu usuario, fecha y hora en el registro de auditoría."
        }
        confirmLabel={pendiente === "aprobado" ? "Sí, aprobar" : "Sí, rechazar"}
        tono={pendiente === "rechazado" ? "peligro" : "brand"}
        cargando={trabajando}
        onCancelar={() => setPendiente(null)}
        onConfirmar={() => {
          const accion = pendiente!;
          setPendiente(null);
          resolver(accion);
        }}
      />
    </div>
  );
}

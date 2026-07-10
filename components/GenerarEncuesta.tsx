"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function GenerarEncuesta({
  evaluacionId,
  pcId,
  tokenExistente,
}: {
  evaluacionId: string;
  pcId: string;
  tokenExistente: string | null;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(tokenExistente);
  const [trabajando, setTrabajando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  async function generar() {
    setTrabajando(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", auth.user!.id)
      .single();
    const nuevo = crypto.randomUUID();
    const { error } = await supabase.from("satisfaccion_respuestas").insert({
      empresa_id: perfil!.empresa_id,
      proveedor_categoria_id: pcId,
      evaluacion_id: evaluacionId,
      token_acceso: nuevo,
    });
    if (!error) {
      setToken(nuevo);
      router.refresh();
    }
    setTrabajando(false);
  }

  async function copiar() {
    if (!token) return;
    await navigator.clipboard.writeText(
      `${window.location.origin}/satisfaccion/${token}`
    );
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (!token)
    return (
      <button
        type="button"
        onClick={generar}
        disabled={trabajando}
        className="btn-secondary min-h-[40px] text-[13px]"
      >
        <Send className="h-4 w-4" />
        {trabajando ? "Generando…" : "Encuesta al área usuaria"}
      </button>
    );

  return (
    <button
      type="button"
      onClick={copiar}
      className="btn-secondary min-h-[40px] text-[13px]"
      title="Copiar el link de la encuesta para enviarlo al área usuaria"
    >
      {copiado ? (
        <>
          <Check className="h-4 w-4 text-ok-600" /> Link copiado
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" /> Copiar link de encuesta
        </>
      )}
    </button>
  );
}

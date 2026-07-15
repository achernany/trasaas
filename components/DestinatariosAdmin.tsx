"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Power } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Confirmar from "@/components/Confirmar";

const TIPOS = [
  { v: "nuevos_proveedores", t: "Nuevos proveedores" },
  { v: "por_vencer", t: "Evaluaciones por vencer" },
  { v: "vencidas", t: "Evaluaciones vencidas" },
  { v: "encuestas", t: "Encuestas área usuaria" },
  { v: "comparativos", t: "Comparativos y reportes" },
];

type Dest = {
  id: string;
  nombre: string | null;
  email: string;
  tipos: string[];
  activo: boolean;
};

export default function DestinatariosAdmin({
  iniciales,
}: {
  iniciales: Dest[];
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [tipos, setTipos] = useState<string[]>([]);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [porEliminar, setPorEliminar] = useState<string | null>(null);

  function toggleTipo(v: string) {
    setTipos((ts) =>
      ts.includes(v) ? ts.filter((t) => t !== v) : [...ts, v]
    );
  }

  async function agregar() {
    if (!email.trim() || tipos.length === 0) return;
    setTrabajando(true);
    setError(null);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", auth.user!.id)
      .single();
    const { error: e } = await supabase
      .from("notificacion_destinatarios")
      .insert({
        empresa_id: perfil!.empresa_id,
        nombre: nombre.trim() || null,
        email: email.trim().toLowerCase(),
        tipos,
      });
    if (e) setError(e.message);
    else {
      setNombre("");
      setEmail("");
      setTipos([]);
      router.refresh();
    }
    setTrabajando(false);
  }

  async function toggleActivo(d: Dest) {
    const supabase = createClient();
    await supabase
      .from("notificacion_destinatarios")
      .update({ activo: !d.activo })
      .eq("id", d.id);
    router.refresh();
  }

  async function eliminar(id: string) {
    const supabase = createClient();
    await supabase.from("notificacion_destinatarios").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
          Agregar destinatario
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="input h-9 text-[13px]"
            placeholder="Nombre (opcional)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            className="input h-9 text-[13px]"
            placeholder="correo@empresa.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => toggleTipo(t.v)}
              className={`${tipos.includes(t.v) ? "chip-active" : "chip"} min-h-[30px] px-3 text-[12px]`}
            >
              {t.t}
            </button>
          ))}
        </div>
        {error && <p className="text-[12px] text-danger-600">{error}</p>}
        <button
          type="button"
          className="btn"
          disabled={!email.trim() || tipos.length === 0 || trabajando}
          onClick={agregar}
        >
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="border-b border-line bg-page">
            <tr>
              <th className="th">Destinatario</th>
              <th className="th">Notificaciones</th>
              <th className="th">Estado</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {iniciales.map((d) => (
              <tr
                key={d.id}
                className={`transition hover:bg-brand-100/40 ${!d.activo ? "opacity-50" : ""}`}
              >
                <td className="td py-3">
                  <div className="font-sans text-[12px] font-bold">
                    {d.nombre ?? "—"}
                  </div>
                  <div className="font-mono text-[11px] text-ink-400">
                    {d.email}
                  </div>
                </td>
                <td className="td py-3">
                  <div className="flex flex-wrap gap-1">
                    {d.tipos.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-900"
                      >
                        {TIPOS.find((x) => x.v === t)?.t ?? t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="td py-3">
                  <span
                    className={d.activo ? "badge-confiable" : "text-[11px] font-bold text-ink-400"}
                  >
                    {d.activo ? "Activo" : "Pausado"}
                  </span>
                </td>
                <td className="td py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => toggleActivo(d)}
                      title={d.activo ? "Pausar" : "Activar"}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-page hover:text-ink-950"
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPorEliminar(d.id)}
                      title="Eliminar"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-danger-100 hover:text-danger-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {iniciales.length === 0 && (
              <tr>
                <td className="td py-8 text-center text-ink-400" colSpan={4}>
                  Aún no hay destinatarios configurados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Confirmar
        abierto={porEliminar !== null}
        titulo="¿Eliminar este destinatario?"
        mensaje="Dejará de recibir todas las notificaciones configuradas. Si solo quieres pausarlo temporalmente, usa el botón de pausa."
        confirmLabel="Sí, eliminar"
        tono="peligro"
        onCancelar={() => setPorEliminar(null)}
        onConfirmar={() => {
          const id = porEliminar!;
          setPorEliminar(null);
          eliminar(id);
        }}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Select from "@/components/Select";
import { ROLES } from "@/lib/areas";

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  cargo: string | null;
  activo: boolean;
};

export default function UsuariosAdmin({ iniciales }: { iniciales: Usuario[] }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState<string | null>(null);

  async function cambiarRol(u: Usuario, rol: string) {
    setGuardando(u.id);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", auth.user!.id)
      .single();
    await supabase.from("usuarios").update({ rol }).eq("id", u.id);
    await supabase.from("audit_log").insert({
      empresa_id: perfil!.empresa_id,
      usuario_id: auth.user!.id,
      entidad: "usuarios",
      entidad_id: u.id,
      accion: "cambiar_rol",
      detalle: { rol_anterior: u.rol, rol_nuevo: rol },
    });
    setGuardando(null);
    router.refresh();
  }

  return (
    <div className="card overflow-hidden p-0">
      <table className="w-full">
        <thead className="border-b border-line bg-page">
          <tr>
            <th className="th">Usuario</th>
            <th className="th">Cargo</th>
            <th className="th w-56">Rol</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {iniciales.map((u) => (
            <tr key={u.id} className="transition hover:bg-brand-100/40">
              <td className="td py-3">
                <div className="font-sans text-[12px] font-bold">{u.nombre}</div>
                <div className="font-mono text-[11px] text-ink-400">{u.email}</div>
              </td>
              <td className="td py-3 text-[12px] text-ink-600">
                {u.cargo ?? "—"}
              </td>
              <td className="td py-2">
                <Select
                  compacto
                  value={u.rol}
                  onChange={(rol) => cambiarRol(u, rol)}
                  opciones={ROLES}
                />
                {guardando === u.id && (
                  <span className="text-[10px] text-ink-400">Guardando…</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line px-4 py-2.5 text-[11px] text-ink-400">
        Los usuarios se crean en Supabase Auth (Autenticación → Users) y
        aparecen aquí al vincularse. La restricción granular por módulo
        (ej. matrices solo Director + Logística) se activa con la matriz de
        permisos que definirá Logística.
      </p>
    </div>
  );
}

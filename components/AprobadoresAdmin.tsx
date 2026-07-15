"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Power, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Select from "@/components/Select";
import { AREAS } from "@/lib/areas";

type Aprobador = {
  id: string;
  nombre: string;
  email: string;
  area: string | null;
  cargo: string | null;
  monto_max: number | null;
  activo: boolean;
};

export default function AprobadoresAdmin({
  iniciales,
}: {
  iniciales: Aprobador[];
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("");
  const [cargo, setCargo] = useState("");
  const [monto, setMonto] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function agregar() {
    if (!nombre.trim() || !email.trim()) return;
    setTrabajando(true);
    setError(null);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", auth.user!.id)
      .single();
    const { error: e } = await supabase.from("aprobadores").insert({
      empresa_id: perfil!.empresa_id,
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      area: area || null,
      cargo: cargo.trim() || null,
      monto_max: monto ? Number(monto) : null,
    });
    if (e) setError(e.message);
    else {
      setNombre("");
      setEmail("");
      setArea("");
      setCargo("");
      setMonto("");
      router.refresh();
    }
    setTrabajando(false);
  }

  async function toggleActivo(a: Aprobador) {
    const supabase = createClient();
    await supabase
      .from("aprobadores")
      .update({ activo: !a.activo })
      .eq("id", a.id);
    router.refresh();
  }

  async function eliminar(id: string) {
    const supabase = createClient();
    await supabase.from("aprobadores").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
          Agregar aprobador
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="input h-9 text-[13px]"
            placeholder="Nombre y apellido"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            className="input h-9 text-[13px]"
            placeholder="correo@alfaco.com.pe"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Select
            value={area}
            onChange={setArea}
            placeholder="Área…"
            opciones={AREAS.map((a) => ({ value: a, label: a }))}
          />
          <div className="flex gap-2">
            <input
              className="input h-9 flex-1 text-[13px]"
              placeholder="Cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
            />
            <input
              className="input h-9 w-36 text-[13px]"
              placeholder="Monto máx. S/"
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>
        </div>
        <p className="text-[11px] text-ink-400">
          Sin monto máximo = <b>máximo aprobador</b>: recibe los comparativos
          que superan topes o traen alerta de precio histórico.
        </p>
        {error && <p className="text-[12px] font-semibold text-danger-600">{error}</p>}
        <button
          type="button"
          className="btn"
          disabled={!nombre.trim() || !email.trim() || trabajando}
          onClick={agregar}
        >
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="border-b border-line bg-page">
            <tr>
              <th className="th">Aprobador</th>
              <th className="th">Área / Cargo</th>
              <th className="th">Monto máx.</th>
              <th className="th">Estado</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {iniciales.map((a) => (
              <tr
                key={a.id}
                className={`transition hover:bg-brand-100/40 ${!a.activo ? "opacity-50" : ""}`}
              >
                <td className="td py-3">
                  <div className="font-sans text-[12px] font-bold">{a.nombre}</div>
                  <div className="font-mono text-[11px] text-ink-400">{a.email}</div>
                </td>
                <td className="td py-3 text-[12px] text-ink-600">
                  {a.area ?? "—"}
                  {a.cargo ? ` · ${a.cargo}` : ""}
                </td>
                <td className="td py-3">
                  {a.monto_max != null ? (
                    <span className="font-mono text-[11px] font-bold">
                      S/ {Number(a.monto_max).toLocaleString("es-PE")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-900">
                      <Crown className="h-3.5 w-3.5" /> Máximo aprobador
                    </span>
                  )}
                </td>
                <td className="td py-3">
                  <span
                    className={
                      a.activo
                        ? "badge-confiable"
                        : "text-[11px] font-bold text-ink-400"
                    }
                  >
                    {a.activo ? "Activo" : "Pausado"}
                  </span>
                </td>
                <td className="td py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => toggleActivo(a)}
                      title={a.activo ? "Pausar" : "Activar"}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-page hover:text-ink-950"
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar(a.id)}
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
                <td className="td py-8 text-center text-ink-400" colSpan={5}>
                  Aún no hay aprobadores configurados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

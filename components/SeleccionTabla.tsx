"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, UserCheck, Shield, ShieldAlert, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Select from "@/components/Select";

type Cat = { id: string; nombre: string; tipo: string };
type Prov = {
  id: string;
  ruc: string;
  razon_social: string;
  distrito: string | null;
  estado: string;
  clasificacion: "regular" | "critico" | null;
  proveedor_categorias: {
    id: string;
    suministro: string | null;
    categorias: Cat | null;
  }[];
};

const ESTADO_BADGE: Record<string, { cls: string; label: string }> = {
  registrado: {
    cls: "inline-flex items-center rounded-full bg-warn-100 px-2.5 py-0.5 text-[11px] font-bold text-warn-700",
    label: "Por seleccionar",
  },
  seleccionado: {
    cls: "inline-flex items-center rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-900",
    label: "Seleccionado",
  },
  aprobado: { cls: "badge-confiable", label: "Aprobado" },
};

export default function SeleccionTabla({
  rows,
  categorias,
}: {
  rows: Prov[];
  categorias: Cat[];
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState<Prov | null>(null);
  const [categoriaId, setCategoriaId] = useState("");
  const [suministro, setSuministro] = useState("");
  const [clasificacion, setClasificacion] = useState<"regular" | "critico">("regular");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrir(p: Prov) {
    setAbierto(p);
    setCategoriaId(p.proveedor_categorias[0]?.categorias?.id ?? "");
    setSuministro(p.proveedor_categorias[0]?.suministro ?? "");
    setClasificacion(p.clasificacion ?? "regular");
    setError(null);
  }

  async function guardar() {
    if (!abierto || !categoriaId) return;
    setGuardando(true);
    setError(null);
    const supabase = createClient();
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { data: perfil } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", auth.user!.id)
        .single();
      const empresaId = perfil!.empresa_id;

      // vínculo proveedor-categoría (si no existe)
      const { data: pcExiste } = await supabase
        .from("proveedor_categorias")
        .select("id")
        .eq("proveedor_id", abierto.id)
        .eq("categoria_id", categoriaId)
        .maybeSingle();
      if (!pcExiste) {
        const { error: e1 } = await supabase.from("proveedor_categorias").insert({
          empresa_id: empresaId,
          proveedor_id: abierto.id,
          categoria_id: categoriaId,
          suministro: suministro.trim() || null,
        });
        if (e1) throw e1;
      } else if (suministro.trim()) {
        await supabase
          .from("proveedor_categorias")
          .update({ suministro: suministro.trim() })
          .eq("id", pcExiste.id);
      }

      // clasificación + estado seleccionado (si aún no está aprobado)
      const { error: e2 } = await supabase
        .from("proveedores")
        .update({
          clasificacion,
          ...(abierto.estado === "registrado" ? { estado: "seleccionado" } : {}),
        })
        .eq("id", abierto.id);
      if (e2) throw e2;

      await supabase.from("audit_log").insert({
        empresa_id: empresaId,
        usuario_id: auth.user!.id,
        entidad: "proveedores",
        entidad_id: abierto.id,
        accion: "seleccionar",
        detalle: { categoria_id: categoriaId, clasificacion },
      });

      setAbierto(null);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "No se pudo guardar");
    }
    setGuardando(false);
  }

  return (
    <>
      <div className="card overflow-hidden p-0">
        <div className="max-h-[calc(100vh-330px)] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-[5] border-b border-line bg-page">
              <tr>
                <th className="th">Proveedor</th>
                <th className="th">RUC</th>
                <th className="th">Categorías</th>
                <th className="th">Clasificación</th>
                <th className="th">Estado</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => {
                const b = ESTADO_BADGE[p.estado];
                return (
                  <tr key={p.id} className="transition hover:bg-brand-100/40">
                    <td className="td py-3">
                      <span className="block max-w-[260px] truncate font-sans text-[12px] font-bold">
                        {p.razon_social}
                      </span>
                    </td>
                    <td className="td py-3 font-mono text-[11px] text-ink-600">
                      {p.ruc}
                    </td>
                    <td className="td py-3">
                      <div className="flex max-w-[240px] flex-wrap gap-1">
                        {p.proveedor_categorias.length > 0 ? (
                          p.proveedor_categorias.map((pc) => (
                            <span
                              key={pc.id}
                              className="rounded-full bg-page px-2 py-0.5 text-[10px] font-bold text-ink-600"
                            >
                              {pc.categorias?.nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-ink-400">
                            Sin categorizar
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="td py-3">
                      {p.clasificacion === "critico" ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-bold text-danger-600">
                          <ShieldAlert className="h-3.5 w-3.5" /> Crítico
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-600">
                          <Shield className="h-3.5 w-3.5 text-brand-700" /> Regular
                        </span>
                      )}
                    </td>
                    <td className="td py-3">
                      {b && <span className={b.cls}>{b.label}</span>}
                    </td>
                    <td className="td py-3 text-right">
                      <button
                        type="button"
                        onClick={() => abrir(p)}
                        className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12px] font-bold text-ink-950 transition hover:border-brand-900 hover:text-brand-900"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        {p.estado === "registrado" ? "Seleccionar" : "Editar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td className="td py-10 text-center text-ink-400" colSpan={6}>
                    No hay proveedores en este estado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal one-view de selección */}
      {abierto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/45 px-4 py-10 backdrop-blur-sm">
          <div className="step-enter flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between bg-ink-950 px-5 py-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold leading-6 tracking-tight text-white">
                  {abierto.razon_social}
                </h2>
                <p className="text-[11px] leading-4 text-white/50">
                  RUC {abierto.ruc} · asigna categoría y clasificación
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            <div className="modal-body min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              <div>
                <label className="label text-[12px]">
                  Categoría (define si es bien o servicio) *
                </label>
                <Select
                  value={categoriaId}
                  onChange={setCategoriaId}
                  opciones={categorias.map((c) => ({
                    value: c.id,
                    label: `${c.nombre} · ${c.tipo === "bien" ? "Bien" : "Servicio"}`,
                  }))}
                />
              </div>
              <div>
                <label className="label text-[12px]">Suministro</label>
                <input
                  className="input h-9 text-[13px]"
                  value={suministro}
                  onChange={(e) => setSuministro(e.target.value)}
                  placeholder="Ej. Materiales eléctricos"
                />
              </div>
              <div>
                <label className="label text-[12px]">Clasificación *</label>
                <div className="flex gap-2">
                  {(["regular", "critico"] as const).map((cl) => (
                    <button
                      key={cl}
                      type="button"
                      onClick={() => setClasificacion(cl)}
                      className={`h-9 flex-1 rounded-lg border px-2 text-[12px] font-semibold transition ${
                        clasificacion === cl
                          ? cl === "critico"
                            ? "border-alfa-red bg-danger-100 text-danger-600"
                            : "border-brand-900 bg-brand-100 text-brand-900"
                          : "border-line bg-white text-ink-600 hover:bg-page"
                      }`}
                    >
                      {cl === "critico" ? "Crítico" : "Regular"}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-ink-400">
                  Define qué matriz se aplicará en su evaluación periódica.
                </p>
              </div>
              {error && (
                <p className="text-[12px] font-semibold text-danger-600">{error}</p>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-between bg-ink-950 px-5 py-3">
              <button
                type="button"
                onClick={() => setAbierto(null)}
                className="inline-flex min-h-[38px] items-center rounded-xl border border-white/25 px-4 text-[13px] font-bold text-white transition hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!categoriaId || guardando}
                onClick={guardar}
                className="inline-flex min-h-[38px] items-center gap-2 rounded-xl bg-white px-5 text-[13px] font-bold text-ink-950 transition hover:bg-brand-100 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {guardando ? "Guardando…" : "Guardar selección"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

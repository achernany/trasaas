"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, ShieldAlert, Shield, Save, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Criterios de la Matriz LOG-GN-A-P02-02 (aprobada 17/07/26) */
const CRITERIOS = [
  ["Impacto en la operación / continuidad", "Alto: falla afecta procesos clave o seguridad", "Bajo: no compromete la operación"],
  ["Alternativas en el mercado", "Baja o nula: proveedor único o muy pocas opciones", "Alta: múltiples proveedores disponibles"],
  ["Costo/tiempo de cambio (switching cost)", "Alto", "Bajo"],
  ["Relación con requisitos contractuales", "Directa: incide en exigencias contractuales/regulatorias", "Indirecta o nula"],
  ["Impacto económico ante incumplimiento", "Alto: sobrecostos, penalidades, pérdida de negocio", "Bajo: fácilmente mitigable"],
  ["Manejo de información sensible", "Frecuente: datos confidenciales, procesos críticos", "Poco frecuente o nulo"],
  ["Complejidad de la compra", "Alta: evaluación técnica, legal y de riesgo", "Baja: proceso estandarizado y ágil"],
  ["Nivel de seguimiento", "Permanente: indicadores, auditorías, comités", "Básico o por excepción"],
  ["Tipo de relación", "Estratégica, largo plazo", "Transaccional"],
];

/**
 * Clasificación desde REGISTRO (Matriz LOG-GN-A-P02-02): la coordinadora
 * clasifica uno por uno como Crítico / No crítico y el proveedor pasa a
 * Selección. Único par de estados de clasificación permitido en el sistema.
 */
export default function ClasificarProveedor({
  datos,
}: {
  datos: {
    ruc?: string;
    razon_social?: string;
    direccion?: string;
    distrito?: string;
  };
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [clasificacion, setClasificacion] = useState<"critico" | "regular" | "">("");
  const [verGuia, setVerGuia] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function clasificar() {
    if (!clasificacion || !datos.ruc || !datos.razon_social) return;
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

      const { data: existente } = await supabase
        .from("proveedores")
        .select("id, estado")
        .eq("ruc", datos.ruc)
        .maybeSingle();

      let proveedorId = existente?.id;
      if (!existente) {
        const { data: nuevo, error: e1 } = await supabase
          .from("proveedores")
          .insert({
            empresa_id: perfil!.empresa_id,
            ruc: datos.ruc,
            razon_social: datos.razon_social,
            direccion: datos.direccion ?? null,
            distrito: datos.distrito ?? null,
            estado: "seleccionado",
            clasificacion,
          })
          .select("id")
          .single();
        if (e1) throw e1;
        proveedorId = nuevo!.id;
      } else {
        const { error: e2 } = await supabase
          .from("proveedores")
          .update({
            clasificacion,
            ...(existente.estado === "registrado"
              ? { estado: "seleccionado" }
              : {}),
          })
          .eq("id", existente.id);
        if (e2) throw e2;
      }

      await supabase.from("audit_log").insert({
        empresa_id: perfil!.empresa_id,
        usuario_id: auth.user!.id,
        entidad: "proveedores",
        entidad_id: proveedorId,
        accion: "clasificar",
        detalle: { clasificacion, matriz: "LOG-GN-A-P02-02" },
      });

      setAbierto(false);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "No se pudo clasificar");
    }
    setGuardando(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-line bg-white px-3 text-[11px] font-bold text-ink-950 transition hover:border-brand-900 hover:text-brand-900"
      >
        <Shield className="h-3.5 w-3.5" /> Clasificar
      </button>

      {abierto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/45 px-4 py-10 backdrop-blur-sm">
          <div className="step-enter flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between bg-ink-950 px-5 py-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold leading-6 tracking-tight text-white">
                  Clasificar — {datos.razon_social}
                </h2>
                <p className="text-[11px] leading-4 text-white/50">
                  Matriz LOG-GN-A-P02-02 · Crítico / No crítico · pasa a
                  Selección
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            <div className="modal-body min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setClasificacion("critico")}
                  className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border-2 text-[13px] font-bold transition ${
                    clasificacion === "critico"
                      ? "border-alfa-red bg-danger-100 text-danger-600"
                      : "border-line text-ink-600 hover:bg-page"
                  }`}
                >
                  <ShieldAlert className="h-5 w-5" />
                  CRÍTICO
                </button>
                <button
                  type="button"
                  onClick={() => setClasificacion("regular")}
                  className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border-2 text-[13px] font-bold transition ${
                    clasificacion === "regular"
                      ? "border-brand-900 bg-brand-100 text-brand-900"
                      : "border-line text-ink-600 hover:bg-page"
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  NO CRÍTICO
                </button>
              </div>
              <p className="text-[11.5px] leading-5 text-ink-600">
                <b>Crítico:</b> alto impacto en operación, seguridad o
                cumplimiento contractual; pocas alternativas; evaluación
                rigurosa. <b>No crítico:</b> bajo impacto, estandarizado,
                múltiples alternativas; gestión simplificada.
              </p>

              <button
                type="button"
                onClick={() => setVerGuia((v) => !v)}
                className="inline-flex items-center gap-1 text-[12px] font-bold text-brand-900 hover:underline"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${verGuia ? "rotate-180" : ""}`}
                />
                {verGuia ? "Ocultar" : "Ver"} los 9 criterios de la matriz
              </button>
              {verGuia && (
                <div className="overflow-hidden rounded-xl border border-line">
                  <table className="w-full text-[11px]">
                    <thead className="bg-page text-left text-[10px] uppercase text-ink-400">
                      <tr>
                        <th className="px-2.5 py-1.5">Criterio</th>
                        <th className="px-2.5 py-1.5 text-danger-600">Crítico</th>
                        <th className="px-2.5 py-1.5 text-brand-900">No crítico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {CRITERIOS.map(([c, cr, nc]) => (
                        <tr key={c}>
                          <td className="px-2.5 py-1.5 font-semibold">{c}</td>
                          <td className="px-2.5 py-1.5 text-ink-600">{cr}</td>
                          <td className="px-2.5 py-1.5 text-ink-600">{nc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {error && (
                <p className="text-[12px] font-semibold text-danger-600">{error}</p>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-between bg-ink-950 px-5 py-3">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="inline-flex min-h-[38px] items-center rounded-xl border border-white/25 px-4 text-[13px] font-bold text-white transition hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!clasificacion || guardando}
                onClick={clasificar}
                className="inline-flex min-h-[38px] items-center gap-2 rounded-xl bg-white px-5 text-[13px] font-bold text-ink-950 transition hover:bg-brand-100 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {guardando ? "Guardando…" : "Clasificar y pasar a Selección"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

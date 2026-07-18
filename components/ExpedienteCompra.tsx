"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  UploadCloud,
  FileText,
  Trash2,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Confirmar from "@/components/Confirmar";
import Select from "@/components/Select";

type Doc = {
  id: string;
  tipo: "ticket" | "cotizacion" | "oc" | "aprobacion" | "otro";
  nombre: string;
  archivo_url: string;
  creado_en: string;
};

const TIPOS: { v: Doc["tipo"]; t: string; ayuda: string }[] = [
  { v: "ticket", t: "Ticket de requerimiento", ayuda: "PDF o Excel del ticket (ERP/AvanDesk)" },
  { v: "cotizacion", t: "Cotización", ayuda: "PDF de cada proveedor" },
  { v: "aprobacion", t: "Aprobación (correo)", ayuda: "PDF del correo de aprobación — cierra la aprobación del cuadro" },
  { v: "oc", t: "Orden de Compra", ayuda: "PDF de la OC — cierra el ciclo" },
  { v: "otro", t: "Otro documento", ayuda: "Cualquier sustento adicional" },
];

/** Carpeta de trazabilidad del comparativo: ticket, cotizaciones, OC y otros */
export default function ExpedienteCompra({
  cuadroId,
  documentos,
  estado,
  cotizaciones = [],
}: {
  cuadroId: string;
  documentos: Doc[];
  estado?: string;
  cotizaciones?: { proveedor_id: string; razon_social: string }[];
}) {
  const router = useRouter();
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [porEliminar, setPorEliminar] = useState<Doc | null>(null);
  const [cerrando, setCerrando] = useState(false);
  const [ganadorId, setGanadorId] = useState("");
  const [obs, setObs] = useState("");
  const [cerrandoOk, setCerrandoOk] = useState(false);

  const tieneOC = documentos.some((d) => d.tipo === "oc");

  async function subir(tipo: Doc["tipo"], file: File) {
    setSubiendo(tipo);
    setError(null);
    const supabase = createClient();
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { data: perfil } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", auth.user!.id)
        .single();
      const ruta = `${cuadroId}/${tipo}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: e1 } = await supabase.storage
        .from("compras-docs")
        .upload(ruta, file);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("cuadro_documentos").insert({
        empresa_id: perfil!.empresa_id,
        cuadro_id: cuadroId,
        tipo,
        nombre: file.name,
        archivo_url: ruta,
        subido_por: auth.user!.id,
      });
      if (e2) throw e2;
      await supabase.from("audit_log").insert({
        empresa_id: perfil!.empresa_id,
        usuario_id: auth.user!.id,
        entidad: "cuadro_documentos",
        entidad_id: cuadroId,
        accion: "adjuntar",
        detalle: { tipo, nombre: file.name },
      });
      if (
        tipo === "aprobacion" &&
        (estado === "enviado" || estado === "reenviado")
      ) {
        setCerrando(true);
      } else {
        router.refresh();
      }
    } catch (e: any) {
      setError(e?.message ?? "No se pudo subir el archivo");
    }
    setSubiendo(null);
  }

  /** Cierre del flujo por correo: PDF adjunto + proveedor seleccionado = aprobado */
  async function cerrarAprobacion() {
    if (!ganadorId) return;
    setCerrandoOk(true);
    const supabase = createClient();
    try {
      const { data: auth } = await supabase.auth.getUser();
      const { data: perfil } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", auth.user!.id)
        .single();
      const { error: e1 } = await supabase
        .from("cuadros")
        .update({
          estado: "aprobado",
          proveedor_ganador_id: ganadorId,
          resuelto_en: new Date().toISOString(),
        })
        .eq("id", cuadroId);
      if (e1) throw e1;
      await supabase
        .from("proveedores")
        .update({ estado: "aprobado" })
        .eq("id", ganadorId);
      await supabase.from("aprobaciones").insert({
        empresa_id: perfil!.empresa_id,
        cuadro_id: cuadroId,
        aprobador_id: auth.user!.id,
        token_email: crypto.randomUUID(),
        accion: "aprobado",
        comentario: obs.trim()
          ? `Aprobación por correo adjunta. ${obs.trim()}`
          : "Aprobación por correo adjunta al expediente.",
        resuelto_en: new Date().toISOString(),
      });
      await supabase.from("audit_log").insert({
        empresa_id: perfil!.empresa_id,
        usuario_id: auth.user!.id,
        entidad: "cuadro",
        entidad_id: cuadroId,
        accion: "aprobado_por_correo",
        detalle: { proveedor_ganador_id: ganadorId, observacion: obs || null },
      });
      setCerrando(false);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cerrar la aprobación");
    }
    setCerrandoOk(false);
  }

  async function abrir(doc: Doc) {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("compras-docs")
      .createSignedUrl(doc.archivo_url, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function eliminar(doc: Doc) {
    const supabase = createClient();
    await supabase.from("cuadro_documentos").delete().eq("id", doc.id);
    router.refresh();
  }

  return (
    <div className="card">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 font-semibold">
          <FolderOpen className="h-4 w-4 text-brand-900" />
          Expediente de la compra
        </h3>
        {tieneOC ? (
          <span className="badge-confiable">
            <CheckCircle2 className="h-3.5 w-3.5" /> Ciclo cerrado con OC
          </span>
        ) : (
          <span className="rounded-full bg-warn-100 px-2.5 py-0.5 text-[11px] font-bold text-warn-700">
            Pendiente de OC para cerrar el ciclo
          </span>
        )}
      </div>
      <p className="mb-4 text-[12px] text-ink-400">
        Trazabilidad completa: ticket, cotizaciones en PDF y la Orden de Compra
        final. Todo queda vinculado a este comparativo para auditoría.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {TIPOS.map((t) => {
          const docs = documentos.filter((d) => d.tipo === t.v);
          return (
            <div key={t.v} className="rounded-xl border border-line p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[12px] font-bold">{t.t}</span>
                <label className="inline-flex min-h-[28px] cursor-pointer items-center gap-1 rounded-lg border border-line bg-white px-2.5 text-[11px] font-bold text-ink-950 transition hover:border-brand-900 hover:text-brand-900">
                  <UploadCloud className="h-3.5 w-3.5" />
                  {subiendo === t.v ? "Subiendo…" : "Adjuntar"}
                  <input
                    type="file"
                    accept=".pdf,.xls,.xlsx"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) subir(t.v, f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {docs.length === 0 ? (
                <p className="text-[11px] text-ink-400">{t.ayuda}</p>
              ) : (
                <ul className="space-y-1">
                  {docs.map((d) => (
                    <li key={d.id} className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-brand-900" />
                      <button
                        type="button"
                        onClick={() => abrir(d)}
                        className="min-w-0 flex-1 truncate text-left text-[12px] font-semibold text-brand-900 hover:underline"
                        title={d.nombre}
                      >
                        {d.nombre}
                      </button>
                      <ExternalLink className="h-3 w-3 shrink-0 text-ink-400" />
                      <button
                        type="button"
                        onClick={() => setPorEliminar(d)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-ink-400 transition hover:bg-danger-100 hover:text-danger-600"
                        title="Quitar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      {error && (
        <p className="mt-3 text-[12px] font-semibold text-danger-600">{error}</p>
      )}

      {cerrando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 px-4 backdrop-blur-sm">
          <div className="step-enter w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
            <div className="bg-ink-950 px-5 py-3">
              <h3 className="text-base font-semibold text-white">
                Cerrar aprobación del comparativo
              </h3>
              <p className="text-[11px] text-white/50">
                El PDF de aprobación quedó adjunto · selecciona el proveedor
                aprobado en el correo
              </p>
            </div>
            <div className="space-y-3 p-5">
              <div>
                <label className="label text-[12px]">Proveedor aprobado *</label>
                <Select
                  value={ganadorId}
                  onChange={setGanadorId}
                  placeholder="Selecciona el proveedor…"
                  opciones={cotizaciones.map((c) => ({
                    value: c.proveedor_id,
                    label: c.razon_social,
                  }))}
                />
              </div>
              <div>
                <label className="label text-[12px]">Observación (opcional)</label>
                <textarea
                  className="input text-[13px]"
                  rows={2}
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Ej. aprobado parcialmente, ver correo"
                />
              </div>
              <p className="rounded-lg bg-warn-100/60 p-2.5 text-[11px] leading-4 text-warn-700">
                Coordinación audita que el proveedor seleccionado coincida con
                el PDF adjunto. Todo queda en el registro de auditoría.
              </p>
            </div>
            <div className="flex items-center justify-between bg-ink-950 px-5 py-3">
              <button
                type="button"
                onClick={() => {
                  setCerrando(false);
                  router.refresh();
                }}
                className="inline-flex min-h-[36px] items-center rounded-xl border border-white/25 px-4 text-[13px] font-bold text-white transition hover:bg-white/10"
              >
                Solo adjuntar
              </button>
              <button
                type="button"
                disabled={!ganadorId || cerrandoOk}
                onClick={cerrarAprobacion}
                className="inline-flex min-h-[36px] items-center gap-2 rounded-xl bg-white px-5 text-[13px] font-bold text-ink-950 transition hover:bg-brand-100 disabled:opacity-50"
              >
                {cerrandoOk ? "Cerrando…" : "Marcar como aprobado"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Confirmar
        abierto={porEliminar !== null}
        titulo="¿Quitar este documento del expediente?"
        mensaje={
          porEliminar
            ? `"${porEliminar.nombre}" dejará de formar parte de la trazabilidad de esta compra. Esta acción es sensible para auditoría.`
            : ""
        }
        confirmLabel="Sí, quitar"
        tono="peligro"
        onCancelar={() => setPorEliminar(null)}
        onConfirmar={() => {
          const d = porEliminar!;
          setPorEliminar(null);
          eliminar(d);
        }}
      />
    </div>
  );
}

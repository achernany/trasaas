"use client";

import { useMemo, useState } from "react";
import { UploadCloud, ArrowLeft, ArrowRight, CheckCircle2, Send } from "lucide-react";
import Select from "@/components/Select";
import Stepper from "@/components/Stepper";
import { FORM_REGISTRO, type Campo, type Grupo } from "@/lib/registro-config";

type Valores = Record<string, unknown>;

function visible(campo: Campo, valores: Valores): boolean {
  if (!campo.showIf) return true;
  const v = String(valores[campo.showIf.campo] ?? "");
  if (campo.showIf.igualA !== undefined) return v === campo.showIf.igualA;
  if (campo.showIf.rucEmpiezaCon !== undefined)
    return v.startsWith(campo.showIf.rucEmpiezaCon);
  return true;
}

function validaCampo(campo: Campo, valor: unknown): string | null {
  const s = valor === undefined || valor === null ? "" : String(valor);
  if (campo.requerido && campo.tipo !== "grid" && campo.tipo !== "file" && !s)
    return "Campo obligatorio";
  if (campo.validacion === "ruc" && s && !/^(10|15|17|20)\d{9}$/.test(s))
    return "RUC inválido: deben ser 11 dígitos (empieza en 10 o 20)";
  if (campo.validacion === "cci" && s && !/^\d{20}$/.test(s))
    return "CCI inválido: deben ser 20 dígitos";
  if (campo.tipo === "email" && s && !/^\S+@\S+\.\S+$/.test(s))
    return "Correo inválido";
  return null;
}

export default function RegistroForm({ token }: { token: string }) {
  const secciones = FORM_REGISTRO;
  const [paso, setPaso] = useState(0);
  const [valores, setValores] = useState<Valores>({});
  const [archivos, setArchivos] = useState<Record<string, File[]>>({});
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const seccion = secciones[paso];

  const set = (id: string, v: unknown) =>
    setValores((prev) => ({ ...prev, [id]: v }));

  function validaSeccion(): boolean {
    const errs: Record<string, string> = {};
    for (const c of seccion.campos ?? []) {
      if (!visible(c, valores)) continue;
      if (c.tipo === "checkbox" && c.requerido && !valores[c.id])
        errs[c.id] = "Debe aceptar para continuar";
      else if (c.tipo === "grid" && c.requerido) {
        const g = (valores[c.id] as Record<string, string>) ?? {};
        if ((c.filas ?? []).some((_, i) => !g[String(i)]))
          errs[c.id] = "Responda todas las filas";
      } else if (c.tipo === "file" && c.requerido) {
        if (!archivos[c.id]?.length) errs[c.id] = "Adjunte el archivo";
      } else {
        const e = validaCampo(c, valores[c.id]);
        if (e) errs[c.id] = e;
      }
    }
    for (const g of seccion.grupos ?? []) {
      if (g.gate) {
        if (g.gate.requerido && !valores[g.gate.id])
          errs[g.gate.id] = "Campo obligatorio";
        if (valores[g.gate.id] === "Sí") {
          const items = (valores[`items_${g.id}`] as Valores[]) ?? [];
          if (items.length === 0)
            errs[g.gate.id] = "Agregue al menos un registro";
          items.forEach((item, idx) => {
            for (const c of g.camposItem) {
              if (!visible(c, item)) continue;
              const e = validaCampo(c, item[c.id]);
              if (e) errs[`${g.id}.${idx}.${c.id}`] = e;
            }
          });
        }
      }
    }
    setErrores(errs);
    return Object.keys(errs).length === 0;
  }

  async function enviar() {
    if (!validaSeccion()) return;
    setEnviando(true);
    setErrorEnvio(null);
    const fd = new FormData();
    fd.append("token", token);
    fd.append("form_data", JSON.stringify(valores));
    for (const [id, files] of Object.entries(archivos))
      files.forEach((f) => fd.append(id, f));
    const res = await fetch("/api/registro", { method: "POST", body: fd });
    if (res.ok) setEnviado(true);
    else {
      const j = await res.json().catch(() => null);
      setErrorEnvio(j?.error ?? "Error al enviar. Intente nuevamente.");
    }
    setEnviando(false);
  }

  const progreso = useMemo(
    () => Math.round(((paso + 1) / secciones.length) * 100),
    [paso, secciones.length]
  );

  if (enviado)
    return (
      <div className="px-8 py-14 text-center">
        <div className="mb-2 flex justify-center"><svg viewBox="0 0 24 24" className="h-10 w-10 text-ok-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg></div>
        <h2 className="mb-2 text-lg font-semibold">Registro enviado</h2>
        <p className="text-sm text-slate-600">
          Su información fue recibida y será validada por el área de Logística.
          Recibirá una comunicación con el resultado del proceso.
        </p>
      </div>
    );

  return (
    <>
      <div className="shrink-0 px-5 pt-4">
        <Stepper
          compacto
          pasos={secciones.map((x) => x.titulo)}
          paso={paso}
          alcanzable={(i) => i <= paso}
          onIr={(i) => {
            if (i < paso) {
              setPaso(i);
              document.querySelector(".modal-body")?.scrollTo({ top: 0 });
            }
          }}
        />
      </div>

      <div className="shrink-0 border-b border-line px-5 pb-4 pt-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-bold tracking-[-0.5px]">
            {seccion.titulo}
          </h2>
          <span className="shrink-0 font-mono text-[11px] font-semibold text-ink-400">
            {progreso}%
          </span>
        </div>
        {seccion.descripcion && (
          <p className="mt-1 text-[13px] leading-6 text-ink-600">
            {seccion.descripcion}
          </p>
        )}
      </div>

      <div className="modal-body min-h-0 flex-1 overflow-y-auto p-5">
        <div
          key={paso}
          className={`step-enter grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2${
            seccion.id === "condiciones" ? " h-full content-end" : ""
          }`}
        >
        {(seccion.campos ?? []).map(
          (c) =>
            visible(c, valores) && (
              <CampoInput
                key={c.id}
                campo={c}
                valor={valores[c.id]}
                error={errores[c.id]}
                onChange={(v) => set(c.id, v)}
                archivos={archivos[c.id]}
                onArchivos={(files) =>
                  setArchivos((p) => ({ ...p, [c.id]: files }))
                }
              />
            )
        )}

        {(seccion.grupos ?? []).map((g) => (
          <GrupoInput
            key={g.id}
            grupo={g}
            valores={valores}
            errores={errores}
            set={set}
          />
        ))}

        {errorEnvio && (
          <p className="text-sm font-semibold text-danger-600 sm:col-span-2">
            {errorEnvio}
          </p>
        )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between bg-ink-950 px-5 py-2.5">
        <button
          className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-white/25 px-4 text-[13px] font-bold text-white transition hover:bg-white/10 disabled:opacity-40"
          disabled={paso === 0 || enviando}
          onClick={() => {
            setPaso((p) => p - 1);
            document.querySelector(".modal-body")?.scrollTo({ top: 0 });
          }}
        >
          <ArrowLeft className="h-4 w-4" /> Anterior
        </button>
        <span className="hidden text-[11px] font-semibold text-white/40 sm:block">
          Tu avance se conserva al retroceder
        </span>
        {paso < secciones.length - 1 ? (
          <button
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-white px-5 text-[13px] font-bold text-ink-950 transition hover:bg-brand-100"
            onClick={() => {
              if (validaSeccion()) {
                setPaso((p) => p + 1);
                document.querySelector(".modal-body")?.scrollTo({ top: 0 });
              }
            }}
          >
            Siguiente <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-white px-5 text-[13px] font-bold text-ink-950 transition hover:bg-brand-100 disabled:opacity-50"
            disabled={enviando}
            onClick={enviar}
          >
            <Send className="h-4 w-4" />
            {enviando ? "Enviando…" : "Enviar registro"}
          </button>
        )}
      </div>
    </>
  );
}

function CampoInput({
  campo,
  valor,
  error,
  onChange,
  archivos,
  onArchivos,
}: {
  campo: Campo;
  valor: unknown;
  error?: string;
  onChange: (v: unknown) => void;
  archivos?: File[];
  onArchivos?: (f: File[]) => void;
}) {
  return (
    <div
      className={campo.ancho === "medio" ? "sm:col-span-1" : "sm:col-span-2"}
    >
      {campo.tipo !== "checkbox" && (
        <label className="label">
          {campo.label}
          {campo.requerido && <span className="text-red-500"> *</span>}
        </label>
      )}
      {campo.ayuda && (
        <p className="-mt-0.5 mb-1 text-xs text-ink-600">{campo.ayuda}</p>
      )}

      {(campo.tipo === "text" ||
        campo.tipo === "tel" ||
        campo.tipo === "email") && (
        <input
          type={campo.tipo}
          className="input h-9 text-[13px]"
          value={(valor as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {campo.tipo === "select" && (
        <Select
          value={(valor as string) ?? ""}
          onChange={(v) => onChange(v)}
          opciones={(campo.opciones ?? []).map((o) => ({
            value: o,
            label: o,
          }))}
        />
      )}

      {campo.tipo === "radio" && (
        <div className="flex flex-wrap gap-2">
          {campo.opciones?.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={`min-h-[36px] rounded-lg border px-4 text-[13px] font-semibold transition ${
                valor === o
                  ? "border-brand-900 bg-brand-100 text-brand-900"
                  : "border-line bg-white text-ink-600 hover:bg-page"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {campo.tipo === "checkbox" && (
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={Boolean(valor)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>
            {campo.label}
            {campo.requerido && <span className="text-red-500"> *</span>}
          </span>
        </label>
      )}

      {campo.tipo === "grid" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-1 pr-2"></th>
                {["SI", "NO", "No Aplica"].map((c) => (
                  <th key={c} className="w-20 py-1 text-center">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campo.filas?.map((fila, i) => {
                const g = (valor as Record<string, string>) ?? {};
                return (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-2 pr-2">{fila}</td>
                    {["SI", "NO", "No Aplica"].map((c) => (
                      <td key={c} className="text-center">
                        <input
                          type="radio"
                          name={`${campo.id}_${i}`}
                          checked={g[String(i)] === c}
                          onChange={() => onChange({ ...g, [String(i)]: c })}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {campo.tipo === "file" && (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line bg-page/70 px-4 py-6 text-center transition hover:border-brand-900/60 hover:bg-brand-100/30">
          <UploadCloud className="h-6 w-6 text-brand-900" />
          <span className="text-[13px] font-bold text-ink-600">
            {(archivos?.length ?? 0) > 0
              ? "Cambiar archivo(s)"
              : "Adjuntar PDF — clic para elegir"}
          </span>
          <span className="text-[11px] text-ink-400">
            Solo PDF{campo.multiple ? " · puedes seleccionar varios" : ""}
          </span>
          <input
            type="file"
            accept="application/pdf"
            multiple={campo.multiple}
            className="hidden"
            onChange={(e) => onArchivos?.(Array.from(e.target.files ?? []))}
          />
        </label>
      )}
      {campo.tipo === "file" && (archivos?.length ?? 0) > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {archivos!.map((f) => (
            <span
              key={f.name}
              className="inline-flex items-center gap-1 rounded-full bg-ok-100 px-2.5 py-1 text-[11px] font-bold text-ok-600"
            >
              <CheckCircle2 className="h-3 w-3" />
              {f.name}
            </span>
          ))}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function GrupoInput({
  grupo,
  valores,
  errores,
  set,
}: {
  grupo: Grupo;
  valores: Valores;
  errores: Record<string, string>;
  set: (id: string, v: unknown) => void;
}) {
  const key = `items_${grupo.id}`;
  const items = (valores[key] as Valores[]) ?? [];
  const activo = grupo.gate ? valores[grupo.gate.id] === "Sí" : true;

  return (
    <div className="rounded-xl border border-line bg-page/60 p-4 sm:col-span-2">
      <h3 className="mb-3 text-sm font-semibold">{grupo.titulo}</h3>
      {grupo.gate && (
        <CampoInput
          campo={grupo.gate}
          valor={valores[grupo.gate.id]}
          error={errores[grupo.gate.id]}
          onChange={(v) => {
            set(grupo.gate!.id, v);
            if (v === "Sí" && items.length === 0) set(key, [{}]);
          }}
        />
      )}
      {activo && (
        <div className="mt-4 space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-lg bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Registro {idx + 1}
                </span>
                {items.length > (grupo.min ?? 1) && (
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline"
                    onClick={() =>
                      set(
                        key,
                        items.filter((_, i) => i !== idx)
                      )
                    }
                  >
                    Quitar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                {grupo.camposItem.map(
                  (c) =>
                    visible(c, item) && (
                      <CampoInput
                        key={c.id}
                        campo={c}
                        valor={item[c.id]}
                        error={errores[`${grupo.id}.${idx}.${c.id}`]}
                        onChange={(v) => {
                          const copia = [...items];
                          copia[idx] = { ...copia[idx], [c.id]: v };
                          set(key, copia);
                        }}
                      />
                    )
                )}
              </div>
            </div>
          ))}
          {items.length < (grupo.max ?? 10) && (
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => set(key, [...items, {}])}
            >
              + Agregar otro
            </button>
          )}
        </div>
      )}
    </div>
  );
}

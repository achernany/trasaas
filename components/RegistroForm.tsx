"use client";

import { useMemo, useState } from "react";
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
      <div className="card mx-auto max-w-xl text-center">
        <div className="mb-2 text-3xl">✓</div>
        <h2 className="mb-2 text-lg font-semibold">Registro enviado</h2>
        <p className="text-sm text-slate-600">
          Su información fue recibida y será validada por el área de Logística
          de Alfa Co S.A.C. Recibirá una comunicación con el resultado del
          proceso.
        </p>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>
            Sección {paso + 1} de {secciones.length}: {seccion.titulo}
          </span>
          <span>{progreso}%</span>
        </div>
        <div className="h-1.5 rounded bg-slate-200">
          <div
            className="h-1.5 rounded bg-slate-900 transition-all"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      <div className="card space-y-5">
        <div>
          <h2 className="text-lg font-semibold">{seccion.titulo}</h2>
          {seccion.descripcion && (
            <p className="mt-1 text-sm text-slate-500">{seccion.descripcion}</p>
          )}
        </div>

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
      </div>

      {errorEnvio && <p className="text-sm text-red-600">{errorEnvio}</p>}

      <div className="flex justify-between">
        <button
          className="btn-secondary"
          disabled={paso === 0 || enviando}
          onClick={() => setPaso((p) => p - 1)}
        >
          Anterior
        </button>
        {paso < secciones.length - 1 ? (
          <button
            className="btn"
            onClick={() => {
              if (validaSeccion()) setPaso((p) => p + 1);
            }}
          >
            Siguiente
          </button>
        ) : (
          <button className="btn" disabled={enviando} onClick={enviar}>
            {enviando ? "Enviando..." : "Enviar registro"}
          </button>
        )}
      </div>
    </div>
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
    <div>
      {campo.tipo !== "checkbox" && (
        <label className="label">
          {campo.label}
          {campo.requerido && <span className="text-red-500"> *</span>}
        </label>
      )}
      {campo.ayuda && (
        <p className="-mt-0.5 mb-1 text-xs text-slate-400">{campo.ayuda}</p>
      )}

      {(campo.tipo === "text" ||
        campo.tipo === "tel" ||
        campo.tipo === "email") && (
        <input
          type={campo.tipo}
          className="input"
          value={(valor as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {campo.tipo === "select" && (
        <select
          className="input"
          value={(valor as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Seleccione…</option>
          {campo.opciones?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}

      {campo.tipo === "radio" && (
        <div className="flex flex-wrap gap-4">
          {campo.opciones?.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={campo.id}
                checked={valor === o}
                onChange={() => onChange(o)}
              />
              {o}
            </label>
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
        <input
          type="file"
          accept="application/pdf"
          multiple={campo.multiple}
          className="block w-full text-sm"
          onChange={(e) => onArchivos?.(Array.from(e.target.files ?? []))}
        />
      )}
      {campo.tipo === "file" && (archivos?.length ?? 0) > 0 && (
        <p className="mt-1 text-xs text-slate-500">
          {archivos!.map((f) => f.name).join(", ")}
        </p>
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
    <div className="rounded-lg border border-slate-200 p-4">
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
            <div key={idx} className="rounded-lg bg-slate-50 p-3">
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
              <div className="space-y-3">
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

"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Opcion = {
  id: string;
  orden: number;
  etiqueta: string;
  descripcion: string | null;
  puntos: number;
};
type Criterio = {
  id: string;
  orden: number;
  nombre: string;
  peso_max: number;
  criterio_opciones: Opcion[];
};
type Doc = { id: string; descripcion: string; eliminatorio: boolean };
type Matriz = {
  id: string;
  nombre: string;
  tipo: "seleccion" | "evaluacion";
  umbral_confiable: number;
  umbral_medianamente: number;
  meses_reeval_confiable: number;
  meses_reeval_medianamente: number;
  meses_reeval_no_confiable: number;
  criterios: Criterio[];
  matriz_documentos: Doc[];
};
type Prov = { id: string; ruc: string; razon_social: string };

const CAL_UI: Record<string, { cls: string; label: string }> = {
  confiable: { cls: "badge-confiable", label: "✓ CONFIABLE" },
  medianamente_confiable: {
    cls: "badge-medianamente",
    label: "! MEDIANAMENTE CONFIABLE",
  },
  no_confiable: { cls: "badge-no-confiable", label: "✕ NO CONFIABLE" },
};

export default function EvaluacionForm({
  proveedores,
  categorias,
  proyectos,
  matrices,
  preseleccion,
}: {
  proveedores: Prov[];
  categorias: { id: string; nombre: string }[];
  proyectos: { id: string; nombre: string }[];
  matrices: Matriz[];
  preseleccion: { proveedorId: string; categoriaId: string } | null;
}) {
  const router = useRouter();
  const [proveedorId, setProveedorId] = useState(preseleccion?.proveedorId ?? "");
  const [categoriaId, setCategoriaId] = useState(preseleccion?.categoriaId ?? "");
  const [proyectoId, setProyectoId] = useState("");
  const [proceso, setProceso] = useState<"seleccion" | "evaluacion">("evaluacion");
  const [suministro, setSuministro] = useState("");
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [docs, setDocs] = useState<Record<string, boolean | null>>({});
  const [observacion, setObservacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matriz = useMemo(
    () => matrices.find((m) => m.tipo === proceso),
    [matrices, proceso]
  );
  const criterios = useMemo(
    () => [...(matriz?.criterios ?? [])].sort((a, b) => a.orden - b.orden),
    [matriz]
  );

  const nota = useMemo(() => {
    let total = 0;
    for (const c of criterios) {
      const op = c.criterio_opciones.find((o) => o.id === respuestas[c.id]);
      if (op) total += Number(op.puntos);
    }
    return total;
  }, [criterios, respuestas]);

  const docsIncumplidos = useMemo(
    () =>
      (matriz?.matriz_documentos ?? []).filter(
        (d) => d.eliminatorio && docs[d.id] === false
      ),
    [matriz, docs]
  );

  const calificacion = useMemo(() => {
    if (!matriz) return null;
    if (docsIncumplidos.length > 0) return "no_confiable";
    if (nota >= matriz.umbral_confiable) return "confiable";
    if (nota >= matriz.umbral_medianamente) return "medianamente_confiable";
    return "no_confiable";
  }, [matriz, nota, docsIncumplidos]);

  const respondidos = criterios.filter((c) => respuestas[c.id]).length;
  const docsListos = (matriz?.matriz_documentos ?? []).every(
    (d) => docs[d.id] !== undefined && docs[d.id] !== null
  );
  const completo =
    Boolean(proveedorId && categoriaId && matriz) &&
    respondidos === criterios.length &&
    docsListos;

  async function guardar() {
    if (!completo || !matriz || !calificacion) return;
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

      let { data: pc } = await supabase
        .from("proveedor_categorias")
        .select("id")
        .eq("proveedor_id", proveedorId)
        .eq("categoria_id", categoriaId)
        .maybeSingle();
      if (!pc) {
        const { data: nuevo, error: e1 } = await supabase
          .from("proveedor_categorias")
          .insert({
            empresa_id: empresaId,
            proveedor_id: proveedorId,
            categoria_id: categoriaId,
            suministro: suministro || null,
          })
          .select("id")
          .single();
        if (e1) throw e1;
        pc = nuevo;
      }

      const prov = proveedores.find((p) => p.id === proveedorId)!;
      const d = new Date();
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = String(d.getFullYear()).slice(-2);
      let codigo = `${dd}.${mm}.${yy}-${proceso === "seleccion" ? "S" : "E"}-${prov.ruc}`;

      const meses =
        calificacion === "confiable"
          ? matriz.meses_reeval_confiable
          : calificacion === "medianamente_confiable"
            ? matriz.meses_reeval_medianamente
            : matriz.meses_reeval_no_confiable;
      const proxima = new Date();
      proxima.setMonth(proxima.getMonth() + meses);

      let evalId: string | null = null;
      for (let intento = 0; intento < 2; intento++) {
        const { data: ev, error: e2 } = await supabase
          .from("evaluaciones")
          .insert({
            empresa_id: empresaId,
            proveedor_categoria_id: pc!.id,
            matriz_id: matriz.id,
            proyecto_id: proyectoId || null,
            codigo,
            proceso,
            evaluador_id: auth.user!.id,
            fecha: new Date().toISOString().slice(0, 10),
            nota,
            calificacion,
            observacion: observacion || null,
            estado: "completada",
          })
          .select("id")
          .single();
        if (!e2) {
          evalId = ev!.id;
          break;
        }
        if (e2.code === "23505") {
          codigo = `${codigo}-${String(Date.now()).slice(-3)}`;
          continue;
        }
        throw e2;
      }
      if (!evalId) throw new Error("No se pudo generar el código");

      const filas = criterios.map((c) => {
        const op = c.criterio_opciones.find((o) => o.id === respuestas[c.id])!;
        return {
          evaluacion_id: evalId,
          criterio_id: c.id,
          opcion_id: op.id,
          puntos: op.puntos,
        };
      });
      const { error: e3 } = await supabase
        .from("evaluacion_respuestas")
        .insert(filas);
      if (e3) throw e3;

      if ((matriz.matriz_documentos ?? []).length) {
        const { error: e4 } = await supabase
          .from("evaluacion_documentos")
          .insert(
            matriz.matriz_documentos.map((doc) => ({
              evaluacion_id: evalId,
              matriz_documento_id: doc.id,
              cumple: docs[doc.id],
            }))
          );
        if (e4) throw e4;
      }

      const { error: e5 } = await supabase
        .from("proveedor_categorias")
        .update({
          calificacion_actual: calificacion,
          nota_actual: nota,
          proxima_evaluacion: proxima.toISOString().slice(0, 10),
          ...(suministro ? { suministro } : {}),
        })
        .eq("id", pc!.id);
      if (e5) throw e5;

      await supabase.from("audit_log").insert({
        empresa_id: empresaId,
        usuario_id: auth.user!.id,
        entidad: "evaluacion",
        entidad_id: evalId,
        accion: "crear",
        detalle: { codigo, nota, calificacion, proceso },
      });

      router.push(`/panel/evaluaciones/${evalId}`);
    } catch (err: any) {
      setError(err.message ?? "Error al guardar");
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-6 pb-28">
      {/* 1 · Datos del proceso */}
      <section className="card space-y-5">
        <h2 className="text-xl font-semibold">1 · Datos del proceso</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Tipo de proceso</label>
            <div className="flex gap-2">
              {(["seleccion", "evaluacion"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setProceso(p);
                    setRespuestas({});
                    setDocs({});
                  }}
                  className={`min-h-[44px] flex-1 rounded-lg border px-3 text-sm font-semibold transition ${
                    proceso === p
                      ? "border-brand-900 bg-brand-100 text-brand-900"
                      : "border-line bg-white text-ink-600 hover:bg-page"
                  }`}
                >
                  {p === "seleccion" ? "Selección (nuevo)" : "Evaluación"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Proyecto</label>
            <select
              className="input"
              value={proyectoId}
              onChange={(e) => setProyectoId(e.target.value)}
            >
              <option value="">— Sin proyecto —</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Proveedor</label>
            <ComboboxProveedor
              proveedores={proveedores}
              value={proveedorId}
              onChange={setProveedorId}
            />
          </div>
          <div>
            <label className="label">Categoría</label>
            <select
              className="input"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
            >
              <option value="">Seleccione…</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Suministro (bien/servicio)</label>
            <input
              className="input"
              value={suministro}
              onChange={(e) => setSuministro(e.target.value)}
              placeholder="Ej. Ferretería y fontanería"
            />
          </div>
        </div>
      </section>

      {/* 2 · Grilla de calificación */}
      <section className="card space-y-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">2 · Criterios</h2>
          <span className="text-xs text-ink-400">{matriz?.nombre}</span>
        </div>
        <div className="divide-y divide-line">
          {criterios.map((c, i) => (
            <div key={c.id} className="grid gap-3 py-4 md:grid-cols-[220px_1fr] md:items-center">
              <div>
                <div className="text-sm font-bold">
                  {i + 1}. {c.nombre}
                </div>
                <div className="text-xs text-ink-400">
                  máx. {Number(c.peso_max)} pts
                </div>
              </div>
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${c.criterio_opciones.length}, minmax(0,1fr))`,
                }}
              >
                {[...c.criterio_opciones]
                  .sort((a, b) => a.orden - b.orden)
                  .map((o) => {
                    const activo = respuestas[c.id] === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        title={o.descripcion ?? o.etiqueta}
                        onClick={() =>
                          setRespuestas((r) => ({ ...r, [c.id]: o.id }))
                        }
                        className={`min-h-[48px] rounded-lg border px-2 py-1.5 text-center transition ${
                          activo
                            ? "border-brand-900 bg-brand-100"
                            : "border-line bg-white hover:bg-page"
                        }`}
                      >
                        <div
                          className={`text-xs font-bold ${activo ? "text-brand-900" : "text-ink-600"}`}
                        >
                          {o.etiqueta}
                        </div>
                        <div
                          className={`text-xs tabular-nums ${activo ? "font-bold text-brand-900" : "text-ink-400"}`}
                        >
                          {Number(o.puntos)} pts
                        </div>
                      </button>
                    );
                  })}
              </div>
              {respuestas[c.id] && (
                <p className="text-xs text-ink-400 md:col-start-2">
                  {
                    c.criterio_opciones.find((o) => o.id === respuestas[c.id])
                      ?.descripcion
                  }
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 3 · Documentos de legalidad */}
      {(matriz?.matriz_documentos ?? []).length > 0 && (
        <section className="card space-y-3">
          <h2 className="text-xl font-semibold">3 · Documentos de legalidad</h2>
          <p className="text-xs text-ink-400">
            Eliminatorios: un solo "No cumple" clasifica al proveedor como NO
            CONFIABLE sin importar el puntaje.
          </p>
          {matriz!.matriz_documentos.map((d) => (
            <div
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-4 py-3"
            >
              <span className="text-sm">{d.descripcion}</span>
              <div className="flex shrink-0 gap-2">
                {[
                  { v: true, t: "✓ Cumple", on: "border-ok-600 bg-ok-600 text-white" },
                  { v: false, t: "✕ No cumple", on: "border-danger-600 bg-danger-600 text-white" },
                ].map(({ v, t, on }) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDocs((x) => ({ ...x, [d.id]: v }))}
                    className={`min-h-[40px] rounded-lg border px-4 text-xs font-bold transition ${
                      docs[d.id] === v
                        ? on
                        : "border-line text-ink-600 hover:bg-page"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {docsIncumplidos.length > 0 && (
            <div className="rounded-lg bg-danger-100 px-4 py-3 text-sm font-semibold text-danger-600">
              ⚠ {docsIncumplidos.length} documento(s) sin cumplir — la
              clasificación será NO CONFIABLE.
            </div>
          )}
        </section>
      )}

      {/* Observaciones */}
      <section className="card">
        <label className="label">Observaciones</label>
        <textarea
          className="input"
          rows={2}
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
        />
        {error && <p className="mt-3 text-sm text-danger-600">{error}</p>}
      </section>

      {/* Barra de resultado sticky */}
      <div className="fixed inset-x-0 bottom-14 z-20 px-4 md:bottom-4">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/95 px-5 py-3 shadow-lg backdrop-blur">
          <div className="flex items-center gap-4">
            <div>
              <div className="font-display text-2xl font-semibold leading-7 tabular-nums">
                {nota}
                <span className="text-sm font-normal text-ink-400"> /100</span>
              </div>
              <div className="text-[11px] text-ink-400">
                {respondidos}/{criterios.length} criterios
              </div>
            </div>
            {respondidos > 0 && calificacion && (
              <span className={CAL_UI[calificacion].cls}>
                {CAL_UI[calificacion].label}
              </span>
            )}
          </div>
          <button className="btn" disabled={!completo || guardando} onClick={guardar}>
            {guardando ? "Guardando…" : "Guardar y generar ficha"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ComboboxProveedor({
  proveedores,
  value,
  onChange,
}: {
  proveedores: Prov[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seleccionado = proveedores.find((p) => p.id === value);

  const matches = useMemo(() => {
    const f = texto.toLowerCase().trim();
    if (!f) return proveedores.slice(0, 8);
    return proveedores
      .filter(
        (p) => p.razon_social.toLowerCase().includes(f) || p.ruc.includes(f)
      )
      .slice(0, 8);
  }, [proveedores, texto]);

  if (seleccionado) {
    return (
      <div className="flex min-h-[48px] items-center justify-between rounded-lg border border-brand-900 bg-brand-100 px-4 py-2">
        <div>
          <div className="text-sm font-bold text-brand-900">
            {seleccionado.razon_social}
          </div>
          <div className="text-xs text-brand-700">RUC {seleccionado.ruc}</div>
        </div>
        <button
          type="button"
          className="text-xs font-bold text-brand-900 underline"
          onClick={() => {
            onChange("");
            setTexto("");
          }}
        >
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        className="input"
        placeholder="Escribe razón social o RUC…"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setAbierto(false), 150);
        }}
      />
      {abierto && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-line bg-white py-1 shadow-lg">
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left transition hover:bg-brand-100"
                onMouseDown={() => {
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  onChange(p.id);
                }}
              >
                <div className="text-sm font-semibold">{p.razon_social}</div>
                <div className="text-xs text-ink-400">RUC {p.ruc}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {abierto && texto && matches.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink-400 shadow-lg">
          Sin coincidencias — el proveedor debe estar registrado primero
        </div>
      )}
    </div>
  );
}

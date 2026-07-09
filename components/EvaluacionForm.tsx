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
  const [paso, setPaso] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");

  const matriz = useMemo(
    () => matrices.find((m) => m.tipo === proceso),
    [matrices, proceso]
  );
  const criterios = useMemo(
    () => [...(matriz?.criterios ?? [])].sort((a, b) => a.orden - b.orden),
    [matriz]
  );
  const tieneDocs = (matriz?.matriz_documentos ?? []).length > 0;

  const pasos = useMemo(
    () => ["Datos", "Criterios", ...(tieneDocs ? ["Documentos"] : []), "Resumen"],
    [tieneDocs]
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

  function pasoValido(i: number): boolean {
    const nombre = pasos[i];
    if (nombre === "Datos") return Boolean(proveedorId && categoriaId && matriz);
    if (nombre === "Criterios") return respondidos === criterios.length;
    if (nombre === "Documentos") return docsListos;
    return true;
  }
  const puedeAvanzar = pasoValido(paso);
  const esUltimo = paso === pasos.length - 1;
  const listoParaGuardar = pasos.every((_, i) => pasoValido(i));

  function irA(destino: number) {
    if (destino === paso) return;
    // hacia atrás siempre; hacia adelante solo si los pasos previos están completos
    if (destino > paso) {
      for (let i = paso; i < destino; i++) if (!pasoValido(i)) return;
    }
    setDir(destino > paso ? "fwd" : "back");
    setPaso(destino);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardar() {
    if (!listoParaGuardar || !matriz || !calificacion) return;
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

      if (tieneDocs) {
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

  const nombrePaso = pasos[paso];
  const provSel = proveedores.find((p) => p.id === proveedorId);
  const catSel = categorias.find((c) => c.id === categoriaId);

  return (
    <div className="pb-32">
      {/* Step bar */}
      <div className="mb-6 flex items-center">
        {pasos.map((nombre, i) => {
          const hecho = i < paso || (i === paso && pasoValido(i) && esUltimo);
          const activo = i === paso;
          const alcanzable =
            i <= paso || pasos.slice(0, i).every((_, j) => pasoValido(j));
          return (
            <div key={nombre} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => alcanzable && irA(i)}
                className={`group flex items-center gap-2 ${alcanzable ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                    activo
                      ? "scale-110 border-brand-900 bg-brand-900 text-white shadow-lg shadow-brand-900/30"
                      : hecho || i < paso
                        ? "border-ok-600 bg-ok-600 text-white"
                        : "border-line bg-white text-ink-400"
                  }`}
                >
                  {i < paso ? "✓" : i + 1}
                </span>
                <span
                  className={`hidden text-[12px] font-bold sm:block ${
                    activo ? "text-brand-900" : "text-ink-400"
                  }`}
                >
                  {nombre}
                </span>
              </button>
              {i < pasos.length - 1 && (
                <div className="mx-2 h-0.5 flex-1 overflow-hidden rounded bg-line">
                  <div
                    className="h-full bg-ok-600 transition-all duration-500"
                    style={{ width: i < paso ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contenido del paso */}
      <div key={paso} className={dir === "fwd" ? "step-enter" : "step-enter-back"}>
        {nombrePaso === "Datos" && (
          <section className="card space-y-5">
            <h2 className="text-xl font-semibold">Datos del proceso</h2>
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
        )}

        {nombrePaso === "Criterios" && (
          <section className="card space-y-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">Criterios de la matriz</h2>
              <span className="text-xs text-ink-400">{matriz?.nombre}</span>
            </div>
            <div className="divide-y divide-line">
              {criterios.map((c, i) => (
                <div
                  key={c.id}
                  className="grid gap-3 py-4 md:grid-cols-[220px_1fr] md:items-center"
                >
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
                </div>
              ))}
            </div>
          </section>
        )}

        {nombrePaso === "Documentos" && (
          <section className="card space-y-3">
            <h2 className="text-xl font-semibold">Documentos de legalidad</h2>
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

        {nombrePaso === "Resumen" && calificacion && (
          <section className="space-y-4">
            <div
              className={`card border-2 text-center ${
                calificacion === "confiable"
                  ? "border-ok-600/40 bg-ok-100/40"
                  : calificacion === "medianamente_confiable"
                    ? "border-warn-700/40 bg-warn-100/40"
                    : "border-danger-600/40 bg-danger-100/40"
              }`}
            >
              <div className="font-display text-6xl font-bold tabular-nums">
                {nota}
                <span className="text-2xl font-normal text-ink-400">/100</span>
              </div>
              <div className="mt-2">
                <span className={CAL_UI[calificacion].cls}>
                  {CAL_UI[calificacion].label}
                </span>
              </div>
            </div>

            <div className="card space-y-2 text-sm">
              <h3 className="font-semibold">Resumen</h3>
              <Fila k="Proveedor" v={`${provSel?.razon_social ?? "—"} (${provSel?.ruc ?? ""})`} />
              <Fila k="Categoría" v={catSel?.nombre ?? "—"} />
              <Fila k="Proceso" v={proceso === "seleccion" ? "Selección" : "Evaluación"} />
              <Fila k="Matriz" v={matriz?.nombre ?? "—"} />
              <div className="divide-y divide-line border-t border-line pt-2">
                {criterios.map((c) => {
                  const op = c.criterio_opciones.find(
                    (o) => o.id === respuestas[c.id]
                  );
                  return (
                    <div key={c.id} className="flex justify-between gap-3 py-1.5">
                      <span className="text-ink-600">{c.nombre}</span>
                      <span className="font-bold tabular-nums">
                        {op?.etiqueta} · {Number(op?.puntos ?? 0)} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <label className="label">Observaciones (opcional)</label>
              <textarea
                className="input"
                rows={2}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
              />
              {error && <p className="mt-3 text-sm text-danger-600">{error}</p>}
            </div>
          </section>
        )}
      </div>

      {/* Barra sticky: score + navegación */}
      <div className="fixed inset-x-0 bottom-14 z-20 px-4 md:bottom-4">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/95 px-5 py-3 shadow-lg backdrop-blur">
          <div className="flex items-center gap-3">
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
              <span className={`hidden sm:inline-flex ${CAL_UI[calificacion].cls}`}>
                {CAL_UI[calificacion].label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {paso > 0 && (
              <button
                type="button"
                className="btn-secondary min-h-[40px] px-4"
                onClick={() => irA(paso - 1)}
                disabled={guardando}
              >
                ← Volver
              </button>
            )}
            {!esUltimo ? (
              <button
                type="button"
                className="btn min-h-[40px] px-5"
                disabled={!puedeAvanzar}
                onClick={() => irA(paso + 1)}
              >
                Siguiente →
              </button>
            ) : (
              <button
                type="button"
                className="btn min-h-[40px] px-5"
                disabled={!listoParaGuardar || guardando}
                onClick={guardar}
              >
                {guardando ? "Guardando…" : "✓ Finalizar y generar ficha"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-ink-400">{k}</span>
      <span className="text-right font-semibold">{v}</span>
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

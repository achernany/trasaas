"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Stepper from "@/components/Stepper";
import Select from "@/components/Select";

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
  clasificacion?: "regular" | "critico";
  umbral_confiable: number;
  umbral_medianamente: number;
  meses_reeval_confiable: number;
  meses_reeval_medianamente: number;
  meses_reeval_no_confiable: number;
  criterios: Criterio[];
  matriz_documentos: Doc[];
};
type Prov = {
  id: string;
  ruc: string;
  razon_social: string;
  clasificacion?: "regular" | "critico";
};

export function CalBadge({ cal }: { cal: string | null }) {
  if (cal === "confiable")
    return (
      <span className="badge-confiable">
        <CheckCircle2 className="h-3.5 w-3.5" /> CONFIABLE
      </span>
    );
  if (cal === "medianamente_confiable")
    return (
      <span className="badge-medianamente">
        <AlertTriangle className="h-3.5 w-3.5" /> MEDIANAMENTE
      </span>
    );
  if (cal === "no_confiable")
    return (
      <span className="badge-no-confiable">
        <XCircle className="h-3.5 w-3.5" /> NO CONFIABLE
      </span>
    );
  return null;
}

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
  const [clasificacion, setClasificacion] = useState<"regular" | "critico">(
    () =>
      proveedores.find((p) => p.id === preseleccion?.proveedorId)
        ?.clasificacion ?? "regular"
  );
  const [suministro, setSuministro] = useState("");
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [docs, setDocs] = useState<Record<string, boolean | null>>({});
  const [observacion, setObservacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paso, setPaso] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");

  const matriz = useMemo(
    () =>
      matrices.find(
        (m) => m.tipo === proceso && (m.clasificacion ?? "regular") === clasificacion
      ) ?? matrices.find((m) => m.tipo === proceso),
    [matrices, proceso, clasificacion]
  );
  const matrizExactaExiste = useMemo(
    () =>
      matrices.some(
        (m) => m.tipo === proceso && (m.clasificacion ?? "regular") === clasificacion
      ),
    [matrices, proceso, clasificacion]
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
    const n = pasos[i];
    if (n === "Datos")
      return Boolean(
        proveedorId && categoriaId && matriz && proyectoId && suministro.trim()
      );
    if (n === "Criterios") return respondidos === criterios.length;
    if (n === "Documentos") return docsListos;
    return true;
  }
  const puedeAvanzar = pasoValido(paso);
  const esUltimo = paso === pasos.length - 1;
  const listoParaGuardar = pasos.every((_, i) => pasoValido(i));

  function irA(destino: number) {
    if (destino === paso || destino < 0 || destino >= pasos.length) return;
    if (destino > paso) {
      for (let i = paso; i < destino; i++) if (!pasoValido(i)) return;
    }
    setDir(destino > paso ? "fwd" : "back");
    setPaso(destino);
    document.querySelector(".modal-body")?.scrollTo({ top: 0 });
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

      await supabase
        .from("proveedores")
        .update({ clasificacion })
        .eq("id", proveedorId);

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
    <>
      <div className="modal-body min-h-0 flex-1 overflow-y-auto p-5">
        <Stepper
          pasos={pasos}
          paso={paso}
          alcanzable={(i) =>
            i <= paso || pasos.slice(0, i).every((_, j) => pasoValido(j))
          }
          onIr={irA}
        />

        <div key={paso} className={dir === "fwd" ? "step-enter" : "step-enter-back"}>
          {nombrePaso === "Datos" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label text-[12px]">Tipo de proceso</label>
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
                        className={`h-9 flex-1 rounded-lg border px-2 text-[12px] font-semibold transition ${
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
                  <label className="label text-[12px]">
                    Clasificación del proveedor *
                  </label>
                  <div className="flex gap-2">
                    {(["regular", "critico"] as const).map((cl) => (
                      <button
                        key={cl}
                        type="button"
                        onClick={() => {
                          setClasificacion(cl);
                          setRespuestas({});
                          setDocs({});
                        }}
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
                  {!matrizExactaExiste && clasificacion === "critico" && (
                    <p className="mt-1 text-[11px] text-warn-700">
                      Sin matriz vigente para críticos: se aplica la matriz
                      regular. Créala en Configuración → Matrices.
                    </p>
                  )}
                </div>
                <div>
                  <label className="label text-[12px]">Proyecto *</label>
                  <Select
                    value={proyectoId}
                    onChange={setProyectoId}
                    opciones={proyectos.map((p) => ({
                      value: p.id,
                      label: p.nombre,
                    }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label text-[12px]">Proveedor</label>
                  <ComboboxProveedor
                    proveedores={proveedores}
                    value={proveedorId}
                    onChange={(id: string) => {
                      setProveedorId(id);
                      const pr = proveedores.find((x) => x.id === id);
                      if (pr?.clasificacion) setClasificacion(pr.clasificacion);
                    }}
                  />
                </div>
                <div>
                  <label className="label text-[12px]">Categoría *</label>
                  <Select
                    value={categoriaId}
                    onChange={setCategoriaId}
                    opciones={categorias.map((c) => ({
                      value: c.id,
                      label: c.nombre,
                    }))}
                  />
                </div>
                <div>
                  <label className="label text-[12px]">
                    Suministro (bien/servicio) *
                  </label>
                  <input
                    className="input h-9 text-[13px]"
                    value={suministro}
                    onChange={(e) => setSuministro(e.target.value)}
                    placeholder="Ej. Ferretería y fontanería"
                  />
                </div>
              </div>
            </div>
          )}

          {nombrePaso === "Criterios" && (
            <div>
              <div className="mb-2 text-right text-[10px] text-ink-400">
                {matriz?.nombre}
              </div>
              <div className="divide-y divide-line">
                {criterios.map((c, i) => (
                  <div
                    key={c.id}
                    className="grid gap-2 py-2.5 md:grid-cols-[170px_1fr] md:items-center"
                  >
                    <div>
                      <div className="text-[12px] font-bold leading-4">
                        {i + 1}. {c.nombre}
                      </div>
                      <div className="text-[10px] text-ink-400">
                        máx. {Number(c.peso_max)} pts
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
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
                              className={`min-h-[38px] rounded-md border px-1 py-1 text-center transition ${
                                activo
                                  ? "border-brand-900 bg-brand-100"
                                  : "border-line bg-white hover:bg-page"
                              }`}
                            >
                              <div
                                className={`text-[10px] font-bold leading-3 ${activo ? "text-brand-900" : "text-ink-600"}`}
                              >
                                {o.etiqueta}
                              </div>
                              <div
                                className={`text-[10px] leading-3 tabular-nums ${activo ? "font-bold text-brand-900" : "text-ink-400"}`}
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
            </div>
          )}

          {nombrePaso === "Documentos" && (
            <div className="space-y-2.5">
              <p className="text-[11px] text-ink-400">
                Eliminatorios: un solo "No cumple" clasifica al proveedor como
                NO CONFIABLE sin importar el puntaje.
              </p>
              {matriz!.matriz_documentos.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2.5"
                >
                  <span className="flex-1 text-[12px] leading-4">
                    {d.descripcion}
                  </span>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDocs((x) => ({ ...x, [d.id]: true }))}
                      className={`inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-[11px] font-bold transition ${
                        docs[d.id] === true
                          ? "border-ok-600 bg-ok-600 text-white"
                          : "border-line text-ink-600 hover:bg-page"
                      }`}
                    >
                      <Check className="h-3 w-3" /> Cumple
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocs((x) => ({ ...x, [d.id]: false }))}
                      className={`inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-[11px] font-bold transition ${
                        docs[d.id] === false
                          ? "border-danger-600 bg-danger-600 text-white"
                          : "border-line text-ink-600 hover:bg-page"
                      }`}
                    >
                      <X className="h-3 w-3" /> No cumple
                    </button>
                  </div>
                </div>
              ))}
              {docsIncumplidos.length > 0 && (
                <div className="rounded-lg bg-danger-100 px-3 py-2.5 text-[12px] font-semibold text-danger-600">
                  ⚠ {docsIncumplidos.length} documento(s) sin cumplir — la
                  clasificación será NO CONFIABLE.
                </div>
              )}
            </div>
          )}

          {nombrePaso === "Resumen" && calificacion && (
            <div className="space-y-3">
              <div
                className={`rounded-xl border-2 p-4 text-center ${
                  calificacion === "confiable"
                    ? "border-ok-600/40 bg-ok-100/40"
                    : calificacion === "medianamente_confiable"
                      ? "border-warn-700/40 bg-warn-100/40"
                      : "border-danger-600/40 bg-danger-100/40"
                }`}
              >
                <div className="font-display text-4xl font-bold tabular-nums">
                  {nota}
                  <span className="text-lg font-normal text-ink-400">/100</span>
                </div>
                <div className="mt-1.5 flex justify-center">
                  <CalBadge cal={calificacion} />
                </div>
              </div>

              <div className="rounded-xl border border-line p-4 text-[12px]">
                <div className="mb-2 grid gap-1 sm:grid-cols-2">
                  <Fila k="Proveedor" v={provSel?.razon_social ?? "—"} />
                  <Fila k="RUC" v={provSel?.ruc ?? "—"} />
                  <Fila k="Categoría" v={catSel?.nombre ?? "—"} />
                  <Fila
                    k="Proceso"
                    v={`${proceso === "seleccion" ? "Selección" : "Evaluación"} · Prov. ${clasificacion === "critico" ? "crítico" : "regular"}`}
                  />
                </div>
                <div className="divide-y divide-line border-t border-line pt-1">
                  {criterios.map((c) => {
                    const op = c.criterio_opciones.find(
                      (o) => o.id === respuestas[c.id]
                    );
                    return (
                      <div key={c.id} className="flex justify-between gap-2 py-1.5">
                        <span className="text-ink-600">{c.nombre}</span>
                        <span className="shrink-0 font-bold tabular-nums">
                          {op?.etiqueta} · {Number(op?.puntos ?? 0)} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="label text-[12px]">
                  Observaciones (opcional)
                </label>
                <textarea
                  className="input text-[13px]"
                  rows={2}
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                />
                {error && (
                  <p className="mt-2 text-[12px] text-danger-600">{error}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer del modal: score + navegación (superficie de marca) */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 bg-ink-950 px-5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div>
            <div className="font-display text-xl font-semibold leading-6 tabular-nums text-white">
              {nota}
              <span className="text-xs font-normal text-white/40"> /100</span>
            </div>
            <div className="text-[10px] leading-3 text-white/40">
              {respondidos}/{criterios.length} criterios
            </div>
          </div>
          {respondidos > 0 && (
            <span className="hidden sm:block">
              <CalBadge cal={calificacion} />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {paso > 0 && (
            <button
              type="button"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/25 px-3 text-[12px] font-semibold text-white transition hover:bg-white/10 disabled:opacity-40"
              onClick={() => irA(paso - 1)}
              disabled={guardando}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver
            </button>
          )}
          {!esUltimo ? (
            <button
              type="button"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-white px-4 text-[12px] font-bold text-ink-950 transition hover:bg-white/85 disabled:opacity-40"
              disabled={!puedeAvanzar}
              onClick={() => irA(paso + 1)}
            >
              Siguiente <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-white px-4 text-[12px] font-bold text-ink-950 transition hover:bg-white/85 disabled:opacity-40"
              disabled={!listoParaGuardar || guardando}
              onClick={guardar}
            >
              <Check className="h-3.5 w-3.5" />
              {guardando ? "Guardando…" : "Finalizar y generar ficha"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-ink-400">{k}</span>
      <span className="truncate text-right font-semibold">{v}</span>
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
      <div className="flex h-9 items-center justify-between rounded-lg border border-brand-900 bg-brand-100 px-3">
        <div className="min-w-0 truncate text-[12px] font-bold text-brand-900">
          {seleccionado.razon_social}
          <span className="ml-1.5 font-normal text-brand-700">
            {seleccionado.ruc}
          </span>
        </div>
        <button
          type="button"
          className="shrink-0 text-[11px] font-bold text-brand-900 underline"
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
        className="input h-9 text-[13px]"
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
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-line bg-white py-1 shadow-lg">
          {matches.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left transition hover:bg-brand-100"
                onMouseDown={() => {
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  onChange(p.id);
                }}
              >
                <div className="text-[12px] font-semibold leading-4">
                  {p.razon_social}
                </div>
                <div className="text-[10px] text-ink-400">RUC {p.ruc}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {abierto && texto && matches.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[12px] text-ink-400 shadow-lg">
          Sin coincidencias — el proveedor debe estar registrado primero
        </div>
      )}
    </div>
  );
}

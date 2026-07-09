"use client";

import { useMemo, useState } from "react";
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

export default function EvaluacionForm({
  proveedores,
  categorias,
  proyectos,
  matrices,
  preseleccion,
}: {
  proveedores: { id: string; ruc: string; razon_social: string }[];
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
  const [filtro, setFiltro] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matriz = useMemo(
    () => matrices.find((m) => m.tipo === proceso),
    [matrices, proceso]
  );
  const criterios = useMemo(
    () =>
      [...(matriz?.criterios ?? [])].sort((a, b) => a.orden - b.orden),
    [matriz]
  );

  const nota = useMemo(() => {
    let total = 0;
    for (const c of criterios) {
      const opId = respuestas[c.id];
      const op = c.criterio_opciones.find((o) => o.id === opId);
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

  const provFiltrados = useMemo(() => {
    if (!filtro) return proveedores;
    const f = filtro.toLowerCase();
    return proveedores.filter(
      (p) => p.razon_social.toLowerCase().includes(f) || p.ruc.includes(f)
    );
  }, [proveedores, filtro]);

  const completo =
    proveedorId &&
    categoriaId &&
    matriz &&
    criterios.every((c) => respuestas[c.id]) &&
    (matriz.matriz_documentos ?? []).every((d) => docs[d.id] !== undefined && docs[d.id] !== null);

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

      // proveedor_categoria: buscar o crear
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

      // código: DD.MM.YY-S/E-RUC
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

      // insertar evaluación (reintento con sufijo si el código ya existe)
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

      // respuestas
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

      // checklist documental
      if ((matriz.matriz_documentos ?? []).length) {
        const { error: e4 } = await supabase.from("evaluacion_documentos").insert(
          matriz.matriz_documentos.map((doc) => ({
            evaluacion_id: evalId,
            matriz_documento_id: doc.id,
            cumple: docs[doc.id],
          }))
        );
        if (e4) throw e4;
      }

      // actualizar calificación vigente del proveedor-categoría
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

      // auditoría
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

  const CAL_UI: Record<string, { cls: string; label: string }> = {
    confiable: { cls: "badge-confiable", label: "CONFIABLE" },
    medianamente_confiable: {
      cls: "badge-medianamente",
      label: "MEDIANAMENTE CONFIABLE",
    },
    no_confiable: { cls: "badge-no-confiable", label: "NO CONFIABLE" },
  };

  return (
    <div className="space-y-5">
      <div className="card space-y-4">
        <h2 className="font-semibold">1 · Datos del proceso</h2>
        <div className="grid gap-4 sm:grid-cols-2">
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
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${
                    proceso === p
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
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
            <input
              className="input mb-2"
              placeholder="Filtrar por razón social o RUC…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
            <select
              className="input"
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              size={Math.min(6, Math.max(2, provFiltrados.length))}
            >
              {provFiltrados.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.razon_social} — {p.ruc}
                </option>
              ))}
            </select>
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
      </div>

      <div className="card space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">2 · Criterios de la matriz</h2>
          <span className="text-xs text-slate-400">{matriz?.nombre}</span>
        </div>
        {criterios.map((c, i) => (
          <div key={c.id} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-medium">
                {i + 1}. {c.nombre}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                máx. {Number(c.peso_max)} pts
              </span>
            </div>
            <div className="space-y-2">
              {[...c.criterio_opciones]
                .sort((a, b) => a.orden - b.orden)
                .map((o) => (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition ${
                      respuestas[c.id] === o.id
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-start gap-2">
                      <input
                        type="radio"
                        name={c.id}
                        className="mt-0.5"
                        checked={respuestas[c.id] === o.id}
                        onChange={() =>
                          setRespuestas((r) => ({ ...r, [c.id]: o.id }))
                        }
                      />
                      <span>
                        <span className="font-semibold">{o.etiqueta}</span>
                        {o.descripcion && (
                          <span className="text-slate-500">
                            {" "}
                            — {o.descripcion}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-slate-500">
                      {Number(o.puntos)}
                    </span>
                  </label>
                ))}
            </div>
          </div>
        ))}
      </div>

      {(matriz?.matriz_documentos ?? []).length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold">3 · Documentos de legalidad</h2>
          <p className="text-xs text-slate-500">
            Eliminatorios: si el proveedor no cumple alguno, la clasificación
            será NO CONFIABLE sin importar el puntaje.
          </p>
          {matriz!.matriz_documentos.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-3 py-2"
            >
              <span className="text-sm">{d.descripcion}</span>
              <div className="flex shrink-0 gap-2">
                {[
                  { v: true, t: "Cumple" },
                  { v: false, t: "No cumple" },
                ].map(({ v, t }) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDocs((x) => ({ ...x, [d.id]: v }))}
                    className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                      docs[d.id] === v
                        ? v
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-red-600 bg-red-600 text-white"
                        : "border-slate-300 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="mb-3 font-semibold">Resultado</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-4xl font-bold tracking-tight">
            {nota}
            <span className="text-lg font-medium text-slate-400"> / 100</span>
          </div>
          {calificacion && (
            <span className={CAL_UI[calificacion].cls}>
              {CAL_UI[calificacion].label}
            </span>
          )}
          {docsIncumplidos.length > 0 && (
            <span className="text-sm text-red-600">
              ⚠ {docsIncumplidos.length} documento(s) eliminatorio(s) sin
              cumplir
            </span>
          )}
        </div>
        <div className="mt-4">
          <label className="label">Observaciones</label>
          <textarea
            className="input"
            rows={2}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end">
          <button
            className="btn"
            disabled={!completo || guardando}
            onClick={guardar}
          >
            {guardando ? "Guardando…" : "Guardar evaluación y generar ficha"}
          </button>
        </div>
      </div>
    </div>
  );
}

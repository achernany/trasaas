"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Select from "@/components/Select";

type Opcion = {
  orden: number;
  etiqueta: string;
  descripcion: string | null;
  puntos: number;
};
type Criterio = {
  orden: number;
  nombre: string;
  peso_max: number;
  criterio_opciones: Opcion[];
};
type Doc = { descripcion: string; eliminatorio: boolean };
type MatrizFull = {
  id: string;
  empresa_id: string;
  nombre: string;
  tipo: string;
  clasificacion: string;
  categoria_id: string | null;
  version: number;
  estado: string;
  umbral_confiable: number;
  umbral_medianamente: number;
  meses_reeval_confiable: number;
  meses_reeval_medianamente: number;
  meses_reeval_no_confiable: number;
  criterios: (Criterio & { id: string })[];
  matriz_documentos: (Doc & { id: string })[];
};

export default function MatrizEditor({ matriz }: { matriz: MatrizFull }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(matriz.nombre);
  const [clasificacion, setClasificacion] = useState(matriz.clasificacion);
  const [umbralC, setUmbralC] = useState(matriz.umbral_confiable);
  const [umbralM, setUmbralM] = useState(matriz.umbral_medianamente);
  const [criterios, setCriterios] = useState<Criterio[]>(
    [...matriz.criterios]
      .sort((a, b) => a.orden - b.orden)
      .map((c) => ({
        orden: c.orden,
        nombre: c.nombre,
        peso_max: Number(c.peso_max),
        criterio_opciones: [...c.criterio_opciones]
          .sort((a, b) => a.orden - b.orden)
          .map((o) => ({ ...o, puntos: Number(o.puntos) })),
      }))
  );
  const [docs, setDocs] = useState<Doc[]>(
    matriz.matriz_documentos.map((d) => ({
      descripcion: d.descripcion,
      eliminatorio: d.eliminatorio,
    }))
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPeso = useMemo(
    () => criterios.reduce((s, c) => s + (Number(c.peso_max) || 0), 0),
    [criterios]
  );

  function setCriterio(i: number, patch: Partial<Criterio>) {
    setCriterios((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  }
  function setOpcion(i: number, k: number, patch: Partial<Opcion>) {
    setCriterios((cs) =>
      cs.map((c, j) =>
        j === i
          ? {
              ...c,
              criterio_opciones: c.criterio_opciones.map((o, l) =>
                l === k ? { ...o, ...patch } : o
              ),
            }
          : c
      )
    );
  }

  const valido =
    nombre.trim() &&
    criterios.length > 0 &&
    criterios.every(
      (c) =>
        c.nombre.trim() &&
        c.peso_max > 0 &&
        c.criterio_opciones.length > 0 &&
        c.criterio_opciones.every((o) => o.etiqueta.trim())
    );

  async function guardar() {
    if (!valido) return;
    setGuardando(true);
    setError(null);
    const supabase = createClient();
    try {
      const { data: auth } = await supabase.auth.getUser();

      // 1. Nueva versión vigente
      const { data: nueva, error: e1 } = await supabase
        .from("matrices")
        .insert({
          empresa_id: matriz.empresa_id,
          nombre: nombre.trim(),
          tipo: matriz.tipo,
          clasificacion,
          categoria_id: matriz.categoria_id,
          version: matriz.version + 1,
          estado: "vigente",
          umbral_confiable: umbralC,
          umbral_medianamente: umbralM,
          meses_reeval_confiable: matriz.meses_reeval_confiable,
          meses_reeval_medianamente: matriz.meses_reeval_medianamente,
          meses_reeval_no_confiable: matriz.meses_reeval_no_confiable,
        })
        .select("id")
        .single();
      if (e1) throw e1;

      // 2. Criterios y opciones
      for (let i = 0; i < criterios.length; i++) {
        const c = criterios[i];
        const { data: cr, error: e2 } = await supabase
          .from("criterios")
          .insert({
            matriz_id: nueva.id,
            orden: i + 1,
            nombre: c.nombre.trim(),
            peso_max: c.peso_max,
          })
          .select("id")
          .single();
        if (e2) throw e2;
        const { error: e3 } = await supabase.from("criterio_opciones").insert(
          c.criterio_opciones.map((o, k) => ({
            criterio_id: cr.id,
            orden: k + 1,
            etiqueta: o.etiqueta.trim(),
            descripcion: o.descripcion?.trim() || null,
            puntos: o.puntos,
          }))
        );
        if (e3) throw e3;
      }

      // 3. Documentos eliminatorios
      if (docs.length > 0) {
        const { error: e4 } = await supabase.from("matriz_documentos").insert(
          docs
            .filter((d) => d.descripcion.trim())
            .map((d) => ({
              matriz_id: nueva.id,
              descripcion: d.descripcion.trim(),
              eliminatorio: d.eliminatorio,
            }))
        );
        if (e4) throw e4;
      }

      // 4. Archivar la versión anterior
      const { error: e5 } = await supabase
        .from("matrices")
        .update({ estado: "archivada" })
        .eq("id", matriz.id);
      if (e5) throw e5;

      // 5. Auditoría
      await supabase.from("audit_log").insert({
        empresa_id: matriz.empresa_id,
        usuario_id: auth.user?.id,
        accion: "nueva_version_matriz",
        entidad: "matrices",
        entidad_id: nueva.id,
        detalle: {
          desde: matriz.id,
          version_anterior: matriz.version,
          version_nueva: matriz.version + 1,
          total_peso: totalPeso,
        },
      });

      router.push(`/panel/configuracion/matrices/${nueva.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "No se pudo guardar la nueva versión");
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/panel/configuracion/matrices/${matriz.id}`}
          className="text-sm text-slate-500 hover:underline"
        >
          ← Cancelar
        </Link>
        <span className="text-[12px] text-ink-400">
          Editando v{matriz.version} → se creará y activará la{" "}
          <b>v{matriz.version + 1}</b>; la actual queda archivada para
          trazabilidad
        </span>
      </div>

      <div className="card space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label text-[12px]">Nombre de la matriz</label>
            <input
              className="input h-9 text-[13px]"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div>
            <label className="label text-[12px]">Aplica a proveedores</label>
            <Select
              value={clasificacion}
              onChange={setClasificacion}
              opciones={[
                { value: "regular", label: "Regulares" },
                { value: "critico", label: "Críticos" },
              ]}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label text-[12px]">
              Umbral Confiable (≥ puntos)
            </label>
            <input
              type="number"
              className="input h-9 text-[13px]"
              value={umbralC}
              onChange={(e) => setUmbralC(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label text-[12px]">
              Umbral Medianamente (≥ puntos)
            </label>
            <input
              type="number"
              className="input h-9 text-[13px]"
              value={umbralM}
              onChange={(e) => setUmbralM(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
          Criterios ({totalPeso} pts en total)
        </h2>
        {totalPeso !== 100 && (
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-warn-700">
            <AlertTriangle className="h-3.5 w-3.5" /> Los pesos no suman 100
          </span>
        )}
      </div>

      {criterios.map((c, i) => (
        <div key={i} className="card space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="label text-[12px]">Criterio {i + 1}</label>
              <input
                className="input h-9 text-[13px]"
                value={c.nombre}
                onChange={(e) => setCriterio(i, { nombre: e.target.value })}
              />
            </div>
            <div className="w-28">
              <label className="label text-[12px]">Peso máx.</label>
              <input
                type="number"
                className="input h-9 text-[13px]"
                value={c.peso_max}
                onChange={(e) =>
                  setCriterio(i, { peso_max: Number(e.target.value) })
                }
              />
            </div>
            <button
              type="button"
              onClick={() =>
                setCriterios((cs) => cs.filter((_, j) => j !== i))
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition hover:bg-danger-100 hover:text-danger-600"
              title="Eliminar criterio"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {c.criterio_opciones.map((o, k) => (
              <div key={k} className="flex items-center gap-2">
                <input
                  className="input h-8 w-40 text-[12px]"
                  value={o.etiqueta}
                  placeholder="Nivel (ej. EXCELENTE)"
                  onChange={(e) => setOpcion(i, k, { etiqueta: e.target.value })}
                />
                <input
                  className="input h-8 flex-1 text-[12px]"
                  value={o.descripcion ?? ""}
                  placeholder="Descripción"
                  onChange={(e) =>
                    setOpcion(i, k, { descripcion: e.target.value })
                  }
                />
                <input
                  type="number"
                  className="input h-8 w-20 text-[12px]"
                  value={o.puntos}
                  onChange={(e) =>
                    setOpcion(i, k, { puntos: Number(e.target.value) })
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setCriterio(i, {
                      criterio_opciones: c.criterio_opciones.filter(
                        (_, l) => l !== k
                      ),
                    })
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition hover:bg-danger-100 hover:text-danger-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setCriterio(i, {
                  criterio_opciones: [
                    ...c.criterio_opciones,
                    { orden: c.criterio_opciones.length + 1, etiqueta: "", descripcion: "", puntos: 0 },
                  ],
                })
              }
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-900 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar nivel
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          setCriterios((cs) => [
            ...cs,
            {
              orden: cs.length + 1,
              nombre: "",
              peso_max: 0,
              criterio_opciones: [
                { orden: 1, etiqueta: "", descripcion: "", puntos: 0 },
              ],
            },
          ])
        }
        className="btn-secondary min-h-[40px] text-[13px]"
      >
        <Plus className="h-4 w-4" /> Agregar criterio
      </button>

      <div className="card space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
          Documentos eliminatorios
        </h2>
        {docs.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="input h-8 flex-1 text-[12px]"
              value={d.descripcion}
              onChange={(e) =>
                setDocs((ds) =>
                  ds.map((x, j) =>
                    j === i ? { ...x, descripcion: e.target.value } : x
                  )
                )
              }
            />
            <button
              type="button"
              onClick={() => setDocs((ds) => ds.filter((_, j) => j !== i))}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition hover:bg-danger-100 hover:text-danger-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setDocs((ds) => [...ds, { descripcion: "", eliminatorio: true }])
          }
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-900 hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Agregar documento
        </button>
      </div>

      {error && <p className="text-[12px] text-danger-600">{error}</p>}

      <div className="flex justify-end gap-2 pb-8">
        <Link
          href={`/panel/configuracion/matrices/${matriz.id}`}
          className="btn-secondary min-h-[40px]"
        >
          Cancelar
        </Link>
        <button
          type="button"
          className="btn"
          disabled={!valido || guardando}
          onClick={guardar}
        >
          <Save className="h-4 w-4" />
          {guardando
            ? "Guardando…"
            : `Guardar y activar v${matriz.version + 1}`}
        </button>
      </div>
    </div>
  );
}

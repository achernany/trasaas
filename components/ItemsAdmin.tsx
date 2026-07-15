"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, Power, Search, PackageOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Select from "@/components/Select";

type Item = {
  id: string;
  codigo: string;
  descripcion: string;
  tipo: string;
  unidad: string;
  ultimo_costo: number | null;
  activo: boolean;
};

export default function ItemsAdmin({ iniciales }: { iniciales: Item[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("producto");
  const [unidad, setUnidad] = useState("UND");
  const [costo, setCosto] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return iniciales;
    return iniciales.filter(
      (i) =>
        i.codigo.toLowerCase().includes(qq) ||
        i.descripcion.toLowerCase().includes(qq)
    );
  }, [iniciales, q]);

  async function empresaId(supabase: ReturnType<typeof createClient>) {
    const { data: auth } = await supabase.auth.getUser();
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", auth.user!.id)
      .single();
    return perfil!.empresa_id as string;
  }

  async function agregar() {
    if (!codigo.trim() || !descripcion.trim()) return;
    setTrabajando(true);
    setError(null);
    const supabase = createClient();
    const eid = await empresaId(supabase);
    const { error: e } = await supabase.from("items").insert({
      empresa_id: eid,
      codigo: codigo.trim().toUpperCase(),
      descripcion: descripcion.trim().toUpperCase(),
      tipo,
      unidad: unidad.trim() || "UND",
      ultimo_costo: costo ? Number(costo) : null,
    });
    if (e)
      setError(
        e.code === "23505" ? `El código ${codigo} ya existe` : e.message
      );
    else {
      setCodigo("");
      setDescripcion("");
      setCosto("");
      router.refresh();
    }
    setTrabajando(false);
  }

  /** Carga masiva CSV: codigo,descripcion,tipo,unidad,ultimo_costo (con o sin cabecera; separador , o ;) */
  async function importarCSV(file: File) {
    setTrabajando(true);
    setError(null);
    setMsg(null);
    try {
      const texto = await file.text();
      const sep = texto.includes(";") ? ";" : ",";
      const lineas = texto
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const filas: any[] = [];
      for (const linea of lineas) {
        const c = linea.split(sep).map((x) => x.replace(/^"|"$/g, "").trim());
        if (!c[0] || /^cod/i.test(c[0])) continue; // salta cabecera
        filas.push({
          codigo: c[0].toUpperCase(),
          descripcion: (c[1] ?? "").toUpperCase(),
          tipo: /serv/i.test(c[2] ?? "") ? "servicio" : "producto",
          unidad: c[3]?.trim() || "UND",
          ultimo_costo: c[4] && !isNaN(Number(c[4])) ? Number(c[4]) : null,
        });
      }
      if (filas.length === 0) throw new Error("No se encontraron filas válidas");

      const supabase = createClient();
      const eid = await empresaId(supabase);
      let ok = 0,
        dup = 0;
      // lotes de 200 con upsert por (empresa, codigo)
      for (let i = 0; i < filas.length; i += 200) {
        const lote = filas.slice(i, i + 200).map((f) => ({ ...f, empresa_id: eid }));
        const { error: e } = await supabase
          .from("items")
          .upsert(lote, { onConflict: "empresa_id,codigo" });
        if (e) dup += lote.length;
        else ok += lote.length;
      }
      setMsg(`Importados/actualizados ${ok} ítems${dup ? ` · ${dup} con error` : ""}`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "No se pudo importar el archivo");
    }
    setTrabajando(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function toggleActivo(it: Item) {
    const supabase = createClient();
    await supabase.from("items").update({ activo: !it.activo }).eq("id", it.id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
            Agregar ítem
          </h2>
          <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-4 text-[12px] font-bold text-ink-950 transition hover:border-brand-900 hover:text-brand-900">
            <Upload className="h-4 w-4" />
            {trabajando ? "Procesando…" : "Carga masiva CSV"}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importarCSV(f);
              }}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-5">
          <input
            className="input h-9 text-[13px]"
            placeholder="Código SIG"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
          <input
            className="input h-9 text-[13px] sm:col-span-2"
            placeholder="Descripción estandarizada"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <Select
            value={tipo}
            onChange={setTipo}
            opciones={[
              { value: "producto", label: "Producto" },
              { value: "servicio", label: "Servicio" },
            ]}
          />
          <div className="flex gap-2">
            <input
              className="input h-9 w-20 text-[13px]"
              placeholder="UND"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
            />
            <input
              className="input h-9 flex-1 text-[13px]"
              placeholder="Últ. costo"
              type="number"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
            />
          </div>
        </div>
        <p className="text-[11px] text-ink-400">
          CSV esperado: <span className="font-mono">codigo; descripcion; tipo; unidad; ultimo_costo</span> —
          los códigos existentes se actualizan (no se duplican).
        </p>
        {error && <p className="text-[12px] font-semibold text-danger-600">{error}</p>}
        {msg && <p className="text-[12px] font-semibold text-ok-600">{msg}</p>}
        <button
          type="button"
          className="btn"
          disabled={!codigo.trim() || !descripcion.trim() || trabajando}
          onClick={agregar}
        >
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <Search className="h-4 w-4 text-ink-400" />
          <input
            className="h-8 w-full bg-transparent text-[13px] outline-none placeholder:text-ink-400"
            placeholder={`Buscar en ${iniciales.length} ítems por código o descripción…`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="max-h-[calc(100vh-430px)] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-[5] border-b border-line bg-page">
              <tr>
                <th className="th">Código</th>
                <th className="th">Descripción</th>
                <th className="th">Tipo</th>
                <th className="th">Unidad</th>
                <th className="th">Últ. costo</th>
                <th className="th">Estado</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtrados.slice(0, 200).map((it) => (
                <tr
                  key={it.id}
                  className={`transition hover:bg-brand-100/40 ${!it.activo ? "opacity-50" : ""}`}
                >
                  <td className="td py-2.5 font-mono text-[11px] font-bold text-brand-900">
                    {it.codigo}
                  </td>
                  <td className="td max-w-[300px] truncate py-2.5 text-[12px] font-semibold">
                    {it.descripcion}
                  </td>
                  <td className="td py-2.5 capitalize text-ink-600">{it.tipo}</td>
                  <td className="td py-2.5 text-ink-600">{it.unidad}</td>
                  <td className="td py-2.5 font-mono text-[11px]">
                    {it.ultimo_costo != null
                      ? `S/ ${Number(it.ultimo_costo).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="td py-2.5">
                    <span
                      className={
                        it.activo
                          ? "badge-confiable"
                          : "text-[11px] font-bold text-ink-400"
                      }
                    >
                      {it.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="td py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleActivo(it)}
                      title={it.activo ? "Desactivar" : "Activar"}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-page hover:text-ink-950"
                    >
                      <Power className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td className="td py-12 text-center text-ink-400" colSpan={7}>
                    <PackageOpen className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    {iniciales.length === 0
                      ? "Catálogo vacío — agrega ítems o usa la carga masiva con el Excel del ERP"
                      : "Sin resultados para esta búsqueda"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtrados.length > 200 && (
          <p className="border-t border-line px-4 py-2 text-[11px] text-ink-400">
            Mostrando 200 de {filtrados.length} — refina la búsqueda
          </p>
        )}
      </div>
    </div>
  );
}

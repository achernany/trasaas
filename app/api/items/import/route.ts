import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Carga masiva del catálogo de códigos SIG desde el export del ERP.
 * Acepta .xlsx (formato DATA SIG) o .csv. Detecta la fila de cabecera
 * ("COD Material") y toma el precio MÁS RECIENTE por código (última fila).
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("empresa_id")
    .eq("id", user.id)
    .single();
  if (!perfil)
    return NextResponse.json({ error: "Sin perfil" }, { status: 403 });

  const fd = await req.formData();
  const archivo = fd.get("archivo") as File | null;
  if (!archivo)
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });

  // ---------- Leer filas (xlsx o csv) ----------
  let filas: any[][] = [];
  const nombre = archivo.name.toLowerCase();
  const buf = Buffer.from(await archivo.arrayBuffer());

  if (nombre.endsWith(".csv")) {
    const texto = buf.toString("utf-8");
    const sep = texto.includes(";") ? ";" : ",";
    filas = texto
      .split(/\r?\n/)
      .filter((l) => l.trim())
      .map((l) => l.split(sep).map((x) => x.replace(/^"|"$/g, "").trim()));
  } else {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as any);
    const ws = wb.worksheets[0];
    ws.eachRow((row) => {
      const vals: any[] = [];
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        vals[col - 1] = cell.value ?? null;
      });
      filas.push(vals);
    });
  }

  // ---------- Detectar cabecera y mapear columnas ----------
  const norm = (v: any) =>
    String(v ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim();

  let headIdx = -1;
  let col: Record<string, number> = {};
  for (let i = 0; i < Math.min(filas.length, 15); i++) {
    const f = filas[i].map(norm);
    const iCod = f.findIndex((x) => x.includes("cod") && x.includes("material"));
    if (iCod >= 0) {
      headIdx = i;
      col = {
        codigo: iCod,
        descripcion: f.findIndex((x) => x.startsWith("descripcion")),
        tipo: f.findIndex((x) => x === "tipo"),
        grupo: f.findIndex((x) => x.includes("grupo")),
        unidad: f.findIndex((x) => x.includes("u.m") || x === "um" || x.includes("unidad")),
        valor: f.findIndex((x) => x.includes("valor")),
        conIgv: f.findIndex((x) => x.includes("precio") && x.includes("igv")),
      };
      break;
    }
  }
  if (headIdx < 0)
    return NextResponse.json(
      { error: 'No se encontró la cabecera "COD Material" en el archivo' },
      { status: 400 }
    );

  const num = (v: any) => {
    const n = Number(String(v ?? "").replace(/,/g, ""));
    return isNaN(n) ? null : Math.round(n * 100) / 100;
  };

  // Última fila por código = precio más reciente
  const porCodigo = new Map<string, any>();
  let leidas = 0;
  for (let i = headIdx + 1; i < filas.length; i++) {
    const f = filas[i];
    const codigo = String(f[col.codigo] ?? "").trim();
    const desc = String(f[col.descripcion] ?? "").trim();
    if (!codigo || !desc) continue;
    leidas++;
    porCodigo.set(codigo.toUpperCase(), {
      empresa_id: perfil.empresa_id,
      codigo: codigo.toUpperCase(),
      descripcion: desc.toUpperCase(),
      tipo: /serv/i.test(String(f[col.tipo] ?? "")) ? "servicio" : "producto",
      grupo: col.grupo >= 0 ? String(f[col.grupo] ?? "").trim() || null : null,
      unidad:
        col.unidad >= 0 ? String(f[col.unidad] ?? "").trim() || "UND" : "UND",
      ultimo_costo: col.valor >= 0 ? num(f[col.valor]) : null,
      precio_con_igv: col.conIgv >= 0 ? num(f[col.conIgv]) : null,
    });
  }

  const lote = Array.from(porCodigo.values());
  if (lote.length === 0)
    return NextResponse.json(
      { error: "No se encontraron filas válidas" },
      { status: 400 }
    );

  let ok = 0;
  for (let i = 0; i < lote.length; i += 200) {
    const { error } = await supabase
      .from("items")
      .upsert(lote.slice(i, i + 200), { onConflict: "empresa_id,codigo" });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    ok += Math.min(200, lote.length - i);
  }

  await supabase.from("audit_log").insert({
    empresa_id: perfil.empresa_id,
    usuario_id: user.id,
    entidad: "items",
    accion: "carga_masiva",
    detalle: { archivo: archivo.name, filas: leidas, items: ok },
  });

  return NextResponse.json({ ok, filas: leidas });
}

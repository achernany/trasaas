import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CAL_LABEL: Record<string, string> = {
  confiable: "Confiable",
  medianamente_confiable: "Medianamente confiable",
  no_confiable: "No confiable",
};

/** Exportación membretada a Excel (.xlsx) con logo de Alfaco y periodo */
export async function GET(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const tipo = sp.get("tipo") ?? "proveedores";
  const desde = sp.get("desde") || null;
  const hasta = sp.get("hasta") || null;

  let titulo = "";
  let nombre = "export";
  let cabeceras: string[] = [];
  let filas: (string | number | null)[][] = [];

  if (tipo === "proveedores") {
    const { data } = await supabase
      .from("proveedor_categorias")
      .select(
        "suministro, calificacion_actual, nota_actual, proxima_evaluacion, proveedores(ruc, razon_social, distrito, estado, clasificacion), categorias(nombre)"
      )
      .limit(2000);
    titulo = "Padrón de Proveedores por Categoría";
    nombre = "proveedores";
    cabeceras = [
      "RUC",
      "Razón Social",
      "Distrito",
      "Estado",
      "Clasificación",
      "Categoría",
      "Suministro",
      "Calificación",
      "Nota",
      "Próxima evaluación",
    ];
    filas = ((data ?? []) as any[]).map((r) => [
      r.proveedores?.ruc,
      r.proveedores?.razon_social,
      r.proveedores?.distrito,
      r.proveedores?.estado,
      r.proveedores?.clasificacion === "critico" ? "Crítico" : "No crítico",
      r.categorias?.nombre,
      r.suministro,
      CAL_LABEL[r.calificacion_actual] ?? r.calificacion_actual,
      r.nota_actual != null ? Number(r.nota_actual) : null,
      r.proxima_evaluacion,
    ]);
  } else if (tipo === "evaluaciones") {
    let q = supabase
      .from("evaluaciones")
      .select(
        "codigo, proceso, fecha, nota, calificacion, observacion, proveedor_categorias(proveedores(ruc, razon_social), categorias(nombre))"
      )
      .order("fecha", { ascending: false })
      .limit(5000);
    if (desde) q = q.gte("fecha", desde);
    if (hasta) q = q.lte("fecha", hasta);
    const { data } = await q;
    titulo = "Historial de Evaluaciones de Proveedores";
    nombre = "evaluaciones";
    cabeceras = [
      "Código",
      "RUC",
      "Proveedor",
      "Categoría",
      "Proceso",
      "Fecha",
      "Nota",
      "Calificación",
      "Observación",
    ];
    filas = ((data ?? []) as any[]).map((e) => [
      e.codigo,
      e.proveedor_categorias?.proveedores?.ruc,
      e.proveedor_categorias?.proveedores?.razon_social,
      e.proveedor_categorias?.categorias?.nombre,
      e.proceso,
      e.fecha,
      e.nota != null ? Number(e.nota) : null,
      CAL_LABEL[e.calificacion] ?? e.calificacion,
      e.observacion,
    ]);
  } else {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  // ---------- Libro membretado ----------
  const wb = new ExcelJS.Workbook();
  wb.creator = "Trasaas";
  const ws = wb.addWorksheet("Reporte", {
    views: [{ showGridLines: false }],
  });

  try {
    const logo = wb.addImage({
      buffer: readFileSync(
        path.join(process.cwd(), "public", "logo-alfaco.png")
      ) as any,
      extension: "png",
    });
    ws.addImage(logo, {
      tl: { col: 0.2, row: 0.4 } as any,
      ext: { width: 132, height: 69 },
    });
  } catch {
    /* si el logo no está disponible, el reporte sale sin imagen */
  }

  const periodo =
    desde || hasta
      ? `Periodo: ${desde ?? "inicio"} al ${hasta ?? "hoy"}`
      : "Periodo: histórico completo";

  ws.getCell("C2").value = "ALFA CO S.A.C. — RUC 20601832390";
  ws.getCell("C2").font = { bold: true, size: 10, color: { argb: "FF6C7280" } };
  ws.getCell("C3").value = titulo;
  ws.getCell("C3").font = { bold: true, size: 15 };
  ws.getCell("C4").value = `${periodo} · Generado por Trasaas el ${new Date()
    .toISOString()
    .slice(0, 16)
    .replace("T", " ")} UTC · ${filas.length} registros`;
  ws.getCell("C4").font = { size: 9, color: { argb: "FF6C7280" } };

  const HEAD = 6;
  const head = ws.getRow(HEAD);
  cabeceras.forEach((c, i) => {
    const cell = head.getCell(i + 1);
    cell.value = c;
    cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0B0D13" },
    };
    cell.alignment = { vertical: "middle" };
    cell.border = { bottom: { style: "thin", color: { argb: "FF2743C0" } } };
  });
  head.height = 20;

  filas.forEach((f, r) => {
    const row = ws.getRow(HEAD + 1 + r);
    f.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v as any;
      cell.font = { size: 10 };
      if (r % 2 === 1)
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F6F9" },
        };
    });
  });

  ws.columns.forEach((col, i) => {
    let max = cabeceras[i]?.length ?? 10;
    filas.forEach((f) => {
      const l = String(f[i] ?? "").length;
      if (l > max) max = l;
    });
    col.width = Math.min(46, Math.max(10, max + 2));
  });
  ws.autoFilter = {
    from: { row: HEAD, column: 1 },
    to: { row: HEAD, column: cabeceras.length },
  };

  const buf = await wb.xlsx.writeBuffer();
  const fecha = new Date().toISOString().slice(0, 10);
  return new NextResponse(Buffer.from(buf as ArrayBuffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="trasaas-${nombre}-${fecha}.xlsx"`,
    },
  });
}

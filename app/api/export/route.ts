import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function csv(filas: (string | number | null | undefined)[][]): string {
  return filas
    .map((f) =>
      f
        .map((c) => {
          const s = c == null ? "" : String(c);
          return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(";")
    )
    .join("\r\n");
}

export async function GET(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tipo = new URL(req.url).searchParams.get("tipo") ?? "proveedores";
  let contenido = "";
  let nombre = "export";

  if (tipo === "proveedores") {
    const { data } = await supabase
      .from("proveedor_categorias")
      .select(
        "suministro, calificacion_actual, nota_actual, proxima_evaluacion, proveedores(ruc, razon_social, direccion, distrito), categorias(nombre)"
      )
      .limit(1000);
    contenido = csv([
      ["RUC", "Razón Social", "Distrito", "Categoría", "Suministro", "Calificación", "Nota", "Próxima evaluación"],
      ...((data ?? []) as any[]).map((r) => [
        r.proveedores?.ruc,
        r.proveedores?.razon_social,
        r.proveedores?.distrito,
        r.categorias?.nombre,
        r.suministro,
        r.calificacion_actual,
        r.nota_actual,
        r.proxima_evaluacion,
      ]),
    ]);
    nombre = "proveedores";
  } else if (tipo === "evaluaciones") {
    const { data } = await supabase
      .from("evaluaciones")
      .select(
        "codigo, proceso, fecha, nota, calificacion, observacion, proveedor_categorias(proveedores(ruc, razon_social), categorias(nombre))"
      )
      .order("fecha", { ascending: false })
      .limit(2000);
    contenido = csv([
      ["Código", "RUC", "Proveedor", "Categoría", "Proceso", "Fecha", "Nota", "Calificación", "Observación"],
      ...((data ?? []) as any[]).map((e) => [
        e.codigo,
        e.proveedor_categorias?.proveedores?.ruc,
        e.proveedor_categorias?.proveedores?.razon_social,
        e.proveedor_categorias?.categorias?.nombre,
        e.proceso,
        e.fecha,
        e.nota,
        e.calificacion,
        e.observacion,
      ]),
    ]);
    nombre = "evaluaciones";
  } else {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  const hoy = new Date().toISOString().slice(0, 10);
  // BOM para que Excel abra con acentos correctos
  return new NextResponse("﻿" + contenido, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="alfasource-${nombre}-${hoy}.csv"`,
    },
  });
}

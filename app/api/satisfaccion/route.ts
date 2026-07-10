import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PUNTAJES: Record<string, number> = {
  excelente: 10,
  bueno: 7,
  regular: 4,
  malo: 0,
};

export async function POST(req: Request) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const body = await req.json().catch(() => null);
  if (!body?.token || !(body.calificacion in PUNTAJES))
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { data: fila } = await admin
    .from("satisfaccion_respuestas")
    .select("id, empresa_id, respondido_en")
    .eq("token_acceso", body.token)
    .maybeSingle();

  if (!fila)
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  if (fila.respondido_en)
    return NextResponse.json(
      { error: "Esta encuesta ya fue respondida" },
      { status: 409 }
    );

  const { error } = await admin
    .from("satisfaccion_respuestas")
    .update({
      puntaje: PUNTAJES[body.calificacion],
      comentario: body.comentario || null,
      respondente: body.respondente || null,
      area: body.area || null,
      respondido_en: new Date().toISOString(),
    })
    .eq("id", fila.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("audit_log").insert({
    empresa_id: fila.empresa_id,
    entidad: "satisfaccion",
    entidad_id: fila.id,
    accion: "responder",
    detalle: { calificacion: body.calificacion, area: body.area || null },
  });

  return NextResponse.json({ ok: true });
}

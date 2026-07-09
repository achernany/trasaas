import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const fd = await req.formData();
  const token = String(fd.get("token") ?? "");
  const formDataRaw = String(fd.get("form_data") ?? "{}");

  // 1. Validar token
  const { data: registro } = await admin
    .from("proveedor_registros")
    .select("id, empresa_id, estado")
    .eq("token_acceso", token)
    .maybeSingle();

  if (!registro)
    return NextResponse.json({ error: "Enlace no válido" }, { status: 404 });
  if (registro.estado === "enviado" || registro.estado === "validado")
    return NextResponse.json(
      { error: "Este registro ya fue enviado" },
      { status: 409 }
    );

  let form: Record<string, unknown>;
  try {
    form = JSON.parse(formDataRaw);
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // 2. Subir archivos a Storage (bucket privado registro-docs)
  const documentos: { tipo: string; archivo_url: string }[] = [];
  for (const [key, value] of fd.entries()) {
    if (!(value instanceof File)) continue;
    const file = value as File;
    if (file.size === 0) continue;
    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json(
        { error: `Archivo ${file.name} supera 10MB` },
        { status: 400 }
      );
    const path = `${registro.id}/${key}/${Date.now()}_${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error: upErr } = await admin.storage
      .from("registro-docs")
      .upload(path, file, { contentType: file.type || "application/pdf" });
    if (upErr)
      return NextResponse.json(
        { error: "Error subiendo archivo: " + upErr.message },
        { status: 500 }
      );
    documentos.push({ tipo: key, archivo_url: path });
  }

  // 3. Guardar respuestas y marcar enviado
  const { error: updErr } = await admin
    .from("proveedor_registros")
    .update({
      form_data: form,
      estado: "enviado",
      enviado_en: new Date().toISOString(),
    })
    .eq("id", registro.id);
  if (updErr)
    return NextResponse.json({ error: updErr.message }, { status: 500 });

  if (documentos.length) {
    const { error: docErr } = await admin.from("proveedor_documentos").insert(
      documentos.map((d) => ({ registro_id: registro.id, ...d }))
    );
    if (docErr)
      return NextResponse.json({ error: docErr.message }, { status: 500 });
  }

  // 4. Auditoría
  await admin.from("audit_log").insert({
    empresa_id: registro.empresa_id,
    entidad: "proveedor_registro",
    entidad_id: registro.id,
    accion: "enviar",
    detalle: { ruc: form["ruc"], razon_social: form["razon_social"] },
  });

  return NextResponse.json({ ok: true });
}

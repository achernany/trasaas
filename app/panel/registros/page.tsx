import { createClient as createAdmin } from "@supabase/supabase-js";
import { FileText, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ValidarRegistro from "@/components/ValidarRegistro";

export const dynamic = "force-dynamic";

const ESTADO: Record<string, { cls: string; label: string }> = {
  pendiente: { cls: "badge bg-page text-ink-600", label: "Link enviado" },
  enviado: { cls: "badge-medianamente", label: "Por revisar" },
  validado: { cls: "badge-confiable", label: "Validado" },
  observado: { cls: "badge-no-confiable", label: "Observado" },
};

export default async function RegistrosPage() {
  // gate de sesión
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // lectura completa + URLs firmadas con service role (server-side)
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: registros } = await admin
    .from("proveedor_registros")
    .select(
      "id, token_acceso, estado, form_data, enviado_en, creado_en, proveedor_documentos(id, tipo, archivo_url, subido_en)"
    )
    .order("creado_en", { ascending: false })
    .limit(100);

  const rows = await Promise.all(
    ((registros ?? []) as any[]).map(async (r) => {
      const docs = await Promise.all(
        (r.proveedor_documentos ?? []).map(async (d: any) => {
          const { data } = await admin.storage
            .from("registro-docs")
            .createSignedUrl(d.archivo_url, 3600);
          return { ...d, url: data?.signedUrl ?? null };
        })
      );
      return { ...r, docs };
    })
  );

  return (
    <div>
      <div className="page-head flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Registros de proveedores
          </h1>
          <p className="text-[12px] text-ink-400">
            Formularios de registro y debida diligencia recibidos · el
            repositorio documental de cada proveedor vive aquí
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card mt-3 py-14 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-ink-400" />
          <h2 className="text-lg font-semibold">Sin registros aún</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-400">
            Cuando un proveedor complete su formulario de registro, aparecerá
            aquí con sus documentos adjuntos para revisión.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {rows.map((r: any) => {
            const est = ESTADO[r.estado] ?? ESTADO.pendiente;
            const fd = r.form_data ?? {};
            return (
              <div key={r.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold">
                      {fd.razon_social ?? "— formulario sin completar —"}
                    </div>
                    <div className="text-[11px] text-ink-400">
                      {fd.ruc ? `RUC ${fd.ruc} · ` : ""}
                      {fd.tipo_proveedor ?? ""}
                      {fd.actividad ? ` · ${fd.actividad}` : ""}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-ink-400">
                      token: {r.token_acceso} ·{" "}
                      {r.enviado_en
                        ? `enviado ${r.enviado_en.slice(0, 16).replace("T", " ")}`
                        : `creado ${r.creado_en?.slice(0, 10)}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={est.cls}>{est.label}</span>
                    {r.estado === "enviado" && (
                      <ValidarRegistro registroId={r.id} />
                    )}
                  </div>
                </div>
                {r.docs.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                    {r.docs.map((d: any) => (
                      <a
                        key={d.id}
                        href={d.url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-page px-3 py-1.5 text-[11px] font-semibold text-brand-900 transition hover:border-brand-900"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {d.tipo === "doc_dj_veracidad"
                          ? "DJ Veracidad"
                          : d.tipo === "doc_sustento"
                            ? "Doc. sustento"
                            : d.tipo}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

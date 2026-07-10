import { createClient } from "@supabase/supabase-js";
import { AlfaLockup } from "@/components/Logo";
import EncuestaSatisfaccion from "@/components/EncuestaSatisfaccion";
import { CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SatisfaccionPage({
  params,
}: {
  params: { token: string };
}) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: fila } = await admin
    .from("satisfaccion_respuestas")
    .select(
      "id, respondido_en, proveedor_categorias(suministro, proveedores(razon_social), categorias(nombre))"
    )
    .eq("token_acceso", params.token)
    .maybeSingle();

  const pc = (fila as any)?.proveedor_categorias;

  return (
    <main className="flex min-h-screen items-start justify-center bg-page px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <AlfaLockup conEndoso />
        </div>
        {!fila ? (
          <div className="card text-center">
            <h1 className="text-lg font-semibold">Enlace no válido</h1>
            <p className="mt-1 text-sm text-ink-400">
              Esta encuesta no existe o fue desactivada.
            </p>
          </div>
        ) : fila.respondido_en ? (
          <div className="card text-center">
            <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-ok-600" />
            <h1 className="text-lg font-semibold">¡Gracias!</h1>
            <p className="mt-1 text-sm text-ink-400">
              Esta encuesta ya fue respondida. Tu evaluación quedó registrada
              como parte de la calificación del proveedor.
            </p>
          </div>
        ) : (
          <div className="card">
            <h1 className="font-display text-xl font-bold tracking-[-0.5px]">
              ¿Cómo fue el servicio?
            </h1>
            <p className="mb-1 mt-1 text-sm text-ink-600">
              Proveedor:{" "}
              <span className="font-bold">{pc?.proveedores?.razon_social}</span>
            </p>
            <p className="mb-5 text-[12px] text-ink-400">
              {pc?.categorias?.nombre}
              {pc?.suministro ? ` · ${pc.suministro}` : ""} · Tu respuesta toma
              30 segundos y forma parte de la evaluación formal del proveedor.
            </p>
            <EncuestaSatisfaccion token={params.token} />
          </div>
        )}
        <p className="mt-6 text-center text-[11px] text-ink-400">
          AlfaSource · Evaluación de proveedores de Alfa Co S.A.C.
        </p>
      </div>
    </main>
  );
}

import { createClient } from "@supabase/supabase-js";
import RegistroForm from "@/components/RegistroForm";

export const dynamic = "force-dynamic";

export default async function RegistroPage({
  params,
}: {
  params: { token: string };
}) {
  // Validación del token con service role (el proveedor no tiene login)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: registro } = await admin
    .from("proveedor_registros")
    .select("id, estado")
    .eq("token_acceso", params.token)
    .maybeSingle();

  if (!registro) {
    return (
      <Shell>
        <div className="card mx-auto max-w-xl text-center">
          <h2 className="mb-2 text-lg font-semibold">Enlace no válido</h2>
          <p className="text-sm text-slate-600">
            Este enlace de registro no existe o fue desactivado. Solicite uno
            nuevo al área de Logística de Alfa Co S.A.C.
          </p>
        </div>
      </Shell>
    );
  }

  if (registro.estado === "enviado" || registro.estado === "validado") {
    return (
      <Shell>
        <div className="card mx-auto max-w-xl text-center">
          <h2 className="mb-2 text-lg font-semibold">Registro ya enviado</h2>
          <p className="text-sm text-slate-600">
            Este formulario ya fue completado y está en proceso de validación.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto mb-6 max-w-2xl text-center">
        <h1 className="text-xl font-semibold">
          Registro de Proveedores y Debida Diligencia
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Alfa Co S.A.C. — LOG-GN-F-P02-09 · Tiempo aproximado: 30 minutos ·
          Toda la información tiene carácter de Declaración Jurada
        </p>
      </div>
      <RegistroForm token={params.token} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen px-4 py-10">{children}</main>;
}

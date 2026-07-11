import { createClient } from "@supabase/supabase-js";
import RegistroForm from "@/components/RegistroForm";
import FondoObra from "@/components/FondoObra";

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
      <Lobby>
        <Aviso
          titulo="Enlace no válido"
          texto="Este enlace de registro no existe o fue desactivado. Solicite uno nuevo al área de Logística de Alfa Co S.A.C."
        />
      </Lobby>
    );
  }

  if (registro.estado === "enviado" || registro.estado === "validado") {
    return (
      <Lobby>
        <Aviso
          titulo="Registro ya enviado"
          texto="Este formulario ya fue completado y está en proceso de validación por el área de Logística."
        />
      </Lobby>
    );
  }

  return (
    <Lobby>
      <RegistroForm token={params.token} />
    </Lobby>
  );
}

/** El lobby: fotos de obra full-screen + modal glass centrado, one-view */
function Lobby({ children }: { children: React.ReactNode }) {
  return (
    <main className="fixed inset-0 overflow-hidden">
      <FondoObra />
      <div
        aria-hidden="true"
        className="wm-shine pointer-events-none absolute inset-x-0 bottom-0 translate-y-[46%] select-none text-center font-display text-[17vw] font-bold leading-none tracking-[-0.06em]"
      >
        alfasource
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6 lg:p-10">
        <div className="modal-lobby relative z-10 flex h-full max-h-[780px] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Header del brand */}
          <div className="flex shrink-0 items-center gap-3 bg-ink-950 px-6 py-4">
            <svg viewBox="0 0 120 120" width={30} height={30} aria-hidden="true">
              <defs>
                <linearGradient
                  id="reg-g"
                  x1="24"
                  y1="20"
                  x2="98"
                  y2="102"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0" stopColor="#6E8BFF" />
                  <stop offset="0.52" stopColor="#B06AE0" />
                  <stop offset="1" stopColor="#FF6E8C" />
                </linearGradient>
              </defs>
              <path
                className="chev-anim-1"
                d="M38 34 L66 62 L38 90"
                fill="none"
                stroke="url(#reg-g)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                className="chev-anim-2"
                d="M64 34 L92 62 L64 90"
                fill="none"
                stroke="url(#reg-g)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="min-w-0">
              <h1 className="truncate font-display text-[15px] font-bold leading-5 tracking-[-0.3px] text-white">
                Registro de Proveedores y Debida Diligencia
              </h1>
              <p className="truncate text-[11px] leading-4 text-white/50">
                Alfa Co S.A.C. · LOG-GN-F-P02-09 · ~30 min · Carácter de
                Declaración Jurada
              </p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="px-8 py-14 text-center">
      <h2 className="font-display text-xl font-bold tracking-[-0.5px]">
        {titulo}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-600">
        {texto}
      </p>
    </div>
  );
}

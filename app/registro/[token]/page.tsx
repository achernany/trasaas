import { createClient } from "@supabase/supabase-js";
import RegistroForm from "@/components/RegistroForm";
import { AlfaLockup, AlfaMark } from "@/components/Logo";
import { ShieldCheck, Clock3, FileCheck2 } from "lucide-react";

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
        <Aviso
          titulo="Enlace no válido"
          texto="Este enlace de registro no existe o fue desactivado. Solicite uno nuevo al área de Logística de Alfa Co S.A.C."
        />
      </Shell>
    );
  }

  if (registro.estado === "enviado" || registro.estado === "validado") {
    return (
      <Shell>
        <Aviso
          titulo="Registro ya enviado"
          texto="Este formulario ya fue completado y está en proceso de validación por el área de Logística."
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-[-0.8px] sm:text-3xl">
          Registro de Proveedores
          <span className="block text-ink-400">y Debida Diligencia</span>
        </h1>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] font-semibold text-ink-400">
          <span className="inline-flex items-center gap-1.5">
            <FileCheck2 className="h-3.5 w-3.5 text-brand-900" />
            Formato LOG-GN-F-P02-09
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5 text-brand-900" />~30 minutos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-900" />
            Carácter de Declaración Jurada
          </span>
        </div>
      </div>
      <RegistroForm token={params.token} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen bg-page">
      {/* Columna del formulario */}
      <div className="min-h-screen w-full lg:w-[58%] xl:w-[55%]">
        <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
          <div className="mb-8">
            <AlfaLockup conEndoso />
          </div>
          {children}
          <p className="mt-10 text-[11px] leading-5 text-ink-400">
            La información se rige por la Política de Privacidad de Alfa Co
            S.A.C. y su Sistema de Gestión Antisoborno (ISO 37001 · Ley N°
            30424). AlfaSource registra cada envío con sello de fecha y hora
            para fines de auditoría.
          </p>
        </div>
      </div>

      {/* Panel de marca (solo desktop) */}
      <aside className="relative hidden min-h-screen flex-1 overflow-hidden lg:block">
        <div className="fixed inset-y-0 right-0 w-[42%] xl:w-[45%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://alfaco.com.pe/wp-content/uploads/2023/03/alfaco-800x600-A3.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="anim-gradient absolute inset-0 opacity-80" />
          <div className="absolute inset-0 bg-ink-950/35" />
          <div className="absolute -bottom-24 -right-16 opacity-[0.16]">
            <AlfaMark size={460} mono="white" />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-10">
            <p className="font-display text-3xl font-bold leading-[1.08] tracking-[-1px] text-white xl:text-4xl">
              Un solo registro.
              <br />
              Trazabilidad total.
            </p>
            <p className="mt-3 max-w-sm text-[13px] leading-6 text-white/70">
              Tu expediente entra directo al sistema de evaluación de
              proveedores de Alfa Co: sin papeles, sin reenvíos, con evidencia
              auditable de cada paso.
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="card text-center">
      <h2 className="font-display text-xl font-bold tracking-[-0.5px]">
        {titulo}
      </h2>
      <p className="mt-2 text-sm leading-6 text-ink-400">{texto}</p>
    </div>
  );
}

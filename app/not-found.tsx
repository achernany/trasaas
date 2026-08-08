import Link from "next/link";
import { Compass } from "lucide-react";
import { TrasaasLockup } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="card w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
          <Compass className="h-7 w-7 text-brand-900" />
        </div>
        <h1 className="font-display text-xl font-bold tracking-[-0.5px]">
          Esta página no existe
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-400">
          El enlace puede haber cambiado o el recurso fue movido. Si llegaste
          aquí desde un correo o un link compartido, verifica que esté completo.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/panel" className="btn">
            Ir al panel
          </Link>
          <Link href="/login" className="btn-secondary min-h-[40px]">
            Iniciar sesión
          </Link>
        </div>
        <div className="mt-8 flex justify-center opacity-50">
          <TrasaasLockup />
        </div>
      </div>
    </main>
  );
}

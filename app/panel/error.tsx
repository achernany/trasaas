"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CloudOff, RotateCcw } from "lucide-react";
import { AlfaMark } from "@/components/Logo";

export default function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AlfaSource]", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="card w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-100">
          <CloudOff className="h-7 w-7 text-danger-600" />
        </div>
        <h1 className="font-display text-xl font-bold tracking-[-0.5px]">
          No pudimos cargar esta vista
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-400">
          Puede ser un problema momentáneo de conexión con la base de datos o
          con tu red. Tus datos están a salvo: nada se pierde por reintentar.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[10px] text-ink-400/60">
            Ref. {error.digest}
          </p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" className="btn" onClick={() => reset()}>
            <RotateCcw className="h-4 w-4" /> Reintentar
          </button>
          <Link href="/panel" className="btn-secondary min-h-[40px]">
            Ir al dashboard
          </Link>
        </div>
        <div className="mt-8 flex items-center justify-center gap-2 opacity-40">
          <AlfaMark size={16} mono="ink" />
          <span className="text-[11px] font-bold text-ink-600">AlfaSource</span>
        </div>
      </div>
    </div>
  );
}

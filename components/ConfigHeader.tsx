import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Hint from "@/components/Hint";

/**
 * Cabecera ESTÁNDAR de todas las páginas de Configuración:
 * breadcrumb + flecha de volver junto al título + hint pedagógico opcional.
 */
export default function ConfigHeader({
  titulo,
  desc,
  hint,
}: {
  titulo: string;
  desc: string;
  hint?: string;
}) {
  return (
    <div className="page-head space-y-2">
      <nav className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-400">
        <Link href="/panel/configuracion" className="hover:text-brand-900">
          Configuración
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ink-600">{titulo}</span>
      </nav>
      <div className="flex items-start gap-3">
        <Link
          href="/panel/configuracion"
          aria-label="Volver a Configuración"
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-ink-600 transition hover:border-brand-900 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            {titulo}
            {hint && <Hint texto={hint} />}
          </h1>
          <p className="text-[12px] text-ink-400">{desc}</p>
        </div>
      </div>
    </div>
  );
}

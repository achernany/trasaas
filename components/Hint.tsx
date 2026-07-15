"use client";

import { Info } from "lucide-react";

/**
 * Iconito pedagógico: tooltip con información del proceso (contenido del
 * instructivo). `roles` restringe a quién se muestra; hasta que exista la
 * matriz de permisos, si no se pasa `rolActual` se muestra siempre.
 */
export default function Hint({
  texto,
  roles,
  rolActual,
}: {
  texto: string;
  roles?: string[];
  rolActual?: string | null;
}) {
  if (roles && rolActual && !roles.includes(rolActual) && rolActual !== "admin")
    return null;

  return (
    <span className="group relative inline-flex align-middle">
      <Info className="h-4 w-4 cursor-help text-ink-400 transition group-hover:text-brand-900" />
      <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 hidden w-64 -translate-x-1/2 rounded-xl bg-ink-950 px-3.5 py-2.5 text-left text-[11.5px] font-medium leading-5 text-white/90 shadow-xl group-hover:block">
        {texto}
      </span>
    </span>
  );
}

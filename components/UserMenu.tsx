"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu({
  nombre,
  rol,
}: {
  nombre: string;
  rol?: string | null;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const iniciales = nombre
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex min-h-[44px] items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-white/10"
        aria-haspopup="menu"
        aria-expanded={abierto}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
          {iniciales}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold leading-4 text-white">
            {nombre}
          </span>
          {rol && (
            <span className="block text-[11px] capitalize leading-4 text-white/60">
              {rol}
            </span>
          )}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 text-white/60 transition ${abierto ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg"
        >
          <div className="border-b border-line px-4 py-3">
            <div className="text-sm font-bold text-ink-900">{nombre}</div>
            {rol && (
              <div className="text-xs capitalize text-ink-400">{rol}</div>
            )}
          </div>
          <button
            role="menuitem"
            onClick={salir}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-danger-600 transition hover:bg-danger-100/50"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

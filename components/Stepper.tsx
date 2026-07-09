"use client";

import { Check } from "lucide-react";

export default function Stepper({
  pasos,
  paso,
  alcanzable,
  onIr,
}: {
  pasos: string[];
  paso: number;
  alcanzable: (i: number) => boolean;
  onIr: (i: number) => void;
}) {
  return (
    <div className="mb-4 flex items-center">
      {pasos.map((nombre, i) => {
        const activo = i === paso;
        const hecho = i < paso;
        const ok = alcanzable(i);
        return (
          <div key={nombre} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => ok && onIr(i)}
              className={`group flex items-center gap-1.5 ${ok ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all duration-300 ${
                  activo
                    ? "scale-110 border-brand-900 bg-brand-900 text-white shadow-md shadow-brand-900/30"
                    : hecho
                      ? "border-ok-600 bg-ok-600 text-white"
                      : "border-line bg-white text-ink-400"
                }`}
              >
                {hecho ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={`hidden text-[11px] font-bold sm:block ${activo ? "text-brand-900" : "text-ink-400"}`}
              >
                {nombre}
              </span>
            </button>
            {i < pasos.length - 1 && (
              <div className="mx-1.5 h-0.5 flex-1 overflow-hidden rounded bg-line">
                <div
                  className="h-full bg-ok-600 transition-all duration-500"
                  style={{ width: hecho ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

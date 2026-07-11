"use client";

import { useEffect, useState } from "react";

const FOTOS = [
  "https://alfaco.com.pe/wp-content/uploads/2023/03/alfaco-800x600-A3.jpg",
  "https://alfaco.com.pe/wp-content/uploads/2024/05/alfaco-multifamiliares-constructoras-06.jpg",
  "https://alfaco.com.pe/wp-content/uploads/2023/04/alfaco-800x600-B12.jpg",
];

/**
 * Fondo full-screen con crossfade + zoom-out continuo.
 * El zoom usa transition (no keyframes) para que nunca haya salto al
 * reiniciar: la foto saliente sigue su deriva mientras se desvanece.
 */
export default function FondoObra() {
  const [activa, setActiva] = useState(0);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    const t = setInterval(() => setActiva((a) => (a + 1) % FOTOS.length), 7000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-ink-950">
      {FOTOS.map((src, i) => {
        const visible = i === activa && montado;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover blur-[7px]"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "scale(1.06)" : "scale(1.18)",
              transition: "opacity 2200ms ease, transform 9000ms ease-out",
            }}
          />
        );
      })}
      <div className="anim-gradient absolute inset-0 opacity-60" />
      <div className="absolute inset-0 bg-ink-950/45" />
    </div>
  );
}

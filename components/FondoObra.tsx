"use client";

import { useEffect, useState } from "react";

const FOTOS = [
  "https://alfaco.com.pe/wp-content/uploads/2023/03/alfaco-800x600-A3.jpg",
  "https://alfaco.com.pe/wp-content/uploads/2024/05/alfaco-multifamiliares-constructoras-06.jpg",
  "https://alfaco.com.pe/wp-content/uploads/2023/04/alfaco-800x600-B12.jpg",
];

/** Fondo full-screen con crossfade + Ken Burns de fotos reales de obra */
export default function FondoObra() {
  const [activa, setActiva] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiva((a) => (a + 1) % FOTOS.length), 7000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-ink-950">
      {FOTOS.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          className={`absolute inset-0 h-full w-full scale-110 object-cover blur-[7px] transition-opacity duration-[2200ms] ${
            i === activa ? "kenburns opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="anim-gradient absolute inset-0 opacity-60" />
      <div className="absolute inset-0 bg-ink-950/45" />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

/** Watermark "alfasource" de punta a punta de la pantalla, mitad visible, con shimmer */
export default function Watermark() {
  const ref = useRef<HTMLSpanElement>(null);
  const [sx, setSx] = useState(1);

  useEffect(() => {
    function ajustar() {
      const el = ref.current;
      if (el) setSx(window.innerWidth / el.scrollWidth);
    }
    ajustar();
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-[46%] select-none"
    >
      <span
        ref={ref}
        className="wm-shine block w-max whitespace-nowrap font-display text-[17vw] font-bold leading-none tracking-[-0.06em]"
        style={{ transform: `scaleX(${sx})`, transformOrigin: "bottom left" }}
      >
        alfasource
      </span>
    </div>
  );
}

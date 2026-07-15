"use client";

import { useState } from "react";
import { CheckCircle2, ThumbsUp, Minus, ThumbsDown, Star } from "lucide-react";

const OPCIONES = [
  { v: "excelente", t: "Excelente", Icon: Star, on: "border-ok-600 bg-ok-100 text-ok-600" },
  { v: "bueno", t: "Bueno", Icon: ThumbsUp, on: "border-ok-600 bg-ok-100 text-ok-600" },
  { v: "regular", t: "Regular", Icon: Minus, on: "border-warn-700 bg-warn-100 text-warn-700" },
  { v: "malo", t: "Malo", Icon: ThumbsDown, on: "border-danger-600 bg-danger-100 text-danger-600" },
];

export default function EncuestaSatisfaccion({ token }: { token: string }) {
  const [calificacion, setCalificacion] = useState("");
  const [comentario, setComentario] = useState("");
  const [respondente, setRespondente] = useState("");
  const [area, setArea] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completo = Boolean(calificacion && respondente.trim() && area.trim());

  async function enviar() {
    if (!completo) return;
    setEnviando(true);
    setError(null);
    const res = await fetch("/api/satisfaccion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, calificacion, comentario, respondente, area }),
    });
    if (res.ok) setEnviado(true);
    else {
      const j = await res.json().catch(() => null);
      setError(j?.error ?? "Error al enviar");
      setEnviando(false);
    }
  }

  if (enviado)
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-ok-600" />
        <p className="font-semibold">¡Gracias! Tu evaluación quedó registrada.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {OPCIONES.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => setCalificacion(o.v)}
            className={`flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 text-[12px] font-bold transition ${
              calificacion === o.v
                ? o.on
                : "border-line text-ink-600 hover:bg-page"
            }`}
          >
            <o.Icon className="h-5 w-5" />
            {o.t}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label text-[12px]">Tu nombre *</label>
          <input
            className="input h-9 text-[13px]"
            value={respondente}
            onChange={(e) => setRespondente(e.target.value)}
            placeholder="Nombre y apellido"
          />
        </div>
        <div>
          <label className="label text-[12px]">Área *</label>
          <input
            className="input h-9 text-[13px]"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Ej. Operaciones"
          />
        </div>
      </div>
      <div>
        <label className="label text-[12px]">Observaciones (opcional)</label>
        <textarea
          className="input text-[13px]"
          rows={2}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="¿Algo que debamos saber?"
        />
      </div>
      {error && <p className="text-[12px] text-danger-600">{error}</p>}
      <button
        className="btn w-full"
        disabled={!completo || enviando}
        onClick={enviar}
      >
        {enviando ? "Enviando…" : "Enviar evaluación"}
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TrasaasMark, TrasaasLockup } from "@/components/Logo";

const SLIDES = [
  {
    img: "https://alfaco.com.pe/wp-content/uploads/2024/05/alfaco-multifamiliares-constructoras-06.jpg",
    titulo: "Tu abastecimiento, con trazabilidad total.",
    texto:
      "Registro de proveedores, evaluación con matriz y trazabilidad completa para tus auditorías.",
  },
  {
    img: "https://alfaco.com.pe/wp-content/uploads/2023/03/alfaco-800x600-A3.jpg",
    titulo: "Solo proveedores aprobados en tus compras.",
    texto:
      "El comparativo aplica el procedimiento por ti: mínimo 3 cotizaciones y matriz ponderada automática.",
  },
  {
    img: "https://alfaco.com.pe/wp-content/uploads/2023/04/alfaco-800x600-B12.jpg",
    titulo: "Auditorías sin sustos.",
    texto:
      "Cada evaluación queda con ficha firmada, historial y re-evaluación programada según su calificación.",
  },
];
const INTERVALO = 6000;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setSlide((s) => (s + 1) % SLIDES.length),
      INTERVALO
    );
    return () => clearInterval(t);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    try {
      const timeout = new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("timeout")), 15000)
      );
      const { error } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        timeout,
      ]);
      if (error) {
        setError(
          error.message?.toLowerCase().includes("invalid")
            ? "Credenciales incorrectas. Verifica tu correo y contraseña."
            : `Error de autenticación: ${error.message}`
        );
        setLoading(false);
        return;
      }
      router.push("/panel");
      router.refresh();
    } catch (err: any) {
      setError(
        err?.message === "timeout" || String(err).includes("fetch")
          ? "No se pudo contactar al servidor. Verifica tu conexión e intenta de nuevo."
          : `Error inesperado: ${err?.message ?? err}`
      );
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-page lg:grid-cols-[minmax(420px,40%)_1fr]">
      {/* Izquierda: acceso */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <TrasaasLockup conEndoso />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-[-1px]">
            Bienvenido de nuevo
          </h1>
          <p className="mb-6 mt-1 text-sm text-ink-400">
            Accede y gestiona tu abastecimiento
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Correo</label>
              <input
                type="email"
                className="input min-h-[48px]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tucorreo@empresa.com"
              />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                className="input min-h-[48px]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Tu contraseña"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-danger-100 px-3 py-2 text-[12px] leading-4 text-danger-600">
                {error}
              </p>
            )}
            <button type="submit" className="btn w-full" disabled={loading}>
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
          <p className="mt-8 text-[11px] text-ink-400">
            © 2026 Trasaas · Módulo de procurement de Alfa Co S.A.C. · ISO
            9001
          </p>
        </div>
      </div>

      {/* Derecha: carrusel de marca (slot de banners/comunicaciones a futuro) */}
      <div className="hidden p-4 lg:block">
        <div className="relative h-full w-full overflow-hidden rounded-3xl bg-ink-950 shadow-brand">
          {/* gradiente animado de marca */}
          <div className="anim-gradient absolute inset-0" />
          {/* fotos del carrusel */}
          {SLIDES.map((s, i) => (
            <img
              key={s.img}
              src={s.img}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              className={`absolute inset-0 h-full w-full object-cover mix-blend-luminosity transition-opacity duration-1000 ${
                i === slide ? "opacity-30" : "opacity-0"
              }`}
            />
          ))}
          {/* chevrons gigantes */}
          <div className="pointer-events-none absolute -right-16 -top-16 opacity-15">
            <TrasaasMark size={420} mono="white" />
          </div>

          <div className="relative flex h-full flex-col justify-between p-10">
            <TrasaasLockup invertido />

            <div>
              <div key={slide} className="step-enter">
                <h2 className="max-w-md font-display text-4xl font-bold leading-[1.1] tracking-[-1.5px] text-white">
                  {SLIDES[slide].titulo}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">
                  {SLIDES[slide].texto}
                </p>
              </div>

              {/* dots temporales */}
              <div className="mt-8 flex items-center gap-2">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => setSlide(i)}
                    className={`h-1.5 overflow-hidden rounded-full transition-all duration-500 ${
                      i === slide ? "w-14 bg-white/25" : "w-6 bg-white/25 hover:bg-white/40"
                    }`}
                  >
                    {i === slide && (
                      <span
                        key={`fill-${slide}`}
                        className="dot-fill block h-full rounded-full bg-white"
                      />
                    )}
                  </button>
                ))}
              </div>

              <p className="mt-5 font-mono text-[10px] uppercase tracking-[3px] text-white/50">
                Alfaco · alfaco.com.pe
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

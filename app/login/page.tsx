"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AlfaMark, AlfaLockup } from "@/components/Logo";

const FOTOS = [
  "https://alfaco.com.pe/wp-content/uploads/2024/05/alfaco-multifamiliares-constructoras-06.jpg",
  "https://alfaco.com.pe/wp-content/uploads/2023/03/alfaco-800x600-A3.jpg",
  "https://alfaco.com.pe/wp-content/uploads/2023/04/alfaco-800x600-B12.jpg",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          ? "No se pudo contactar al servidor de autenticación. Si estás en una red corporativa, es posible que el firewall bloquee la conexión — intenta desde otra red o compartiendo datos del celular."
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
            <AlfaLockup conEndoso />
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
            © 2026 AlfaSource · Módulo de procurement de Alfa Co S.A.C. · ISO
            9001
          </p>
        </div>
      </div>

      {/* Derecha: panel de marca (espacio para banners/comunicaciones a futuro) */}
      <div className="hidden p-4 lg:block">
        <div className="relative h-full w-full overflow-hidden rounded-3xl bg-alfa-gradient shadow-brand">
          {/* foto de Alfaco con mezcla al gradiente */}
          <img
            src={FOTOS[0]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-luminosity"
          />
          {/* chevrons gigantes de marca */}
          <div className="absolute -right-16 -top-16 opacity-15">
            <AlfaMark size={420} mono="white" />
          </div>

          <div className="relative flex h-full flex-col justify-between p-10">
            <AlfaLockup invertido />

            <div>
              <h2 className="max-w-md font-display text-4xl font-bold leading-[1.1] tracking-[-1.5px] text-white">
                Tu abastecimiento, llevado a su punto alfa.
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">
                Registro de proveedores, evaluación con matriz, comparativos y
                trazabilidad completa para tus auditorías.
              </p>
              <div className="mt-6 flex gap-3">
                {FOTOS.slice(1).map((f) => (
                  <img
                    key={f}
                    src={f}
                    alt="Proyectos Alfaco"
                    className="h-20 w-28 rounded-xl border border-white/20 object-cover"
                  />
                ))}
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[3px] text-white/50">
                Alfaco · alfaco.com.pe
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
      setLoading(false);
      return;
    }
    router.push("/panel");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-page p-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-900 font-display text-xl font-bold text-white shadow-card">
            S
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Scorecard de Proveedores
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            Evaluación y selección de proveedores auditable
          </p>
        </div>
        <div className="card">
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
              />
            </div>
            {error && <p className="text-sm text-danger-600">{error}</p>}
            <button type="submit" className="btn w-full" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-ink-400">
          Alfa Co S.A.C. · Sistema de gestión de compras · ISO 9001
        </p>
      </div>
    </main>
  );
}

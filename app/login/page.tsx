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
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-xl font-bold text-white shadow-lg shadow-emerald-600/30">
            S
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Scorecard de Proveedores
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Evaluación y selección de proveedores auditable
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Correo
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Contraseña
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Alfa Co S.A.C. · Sistema de gestión de compras · ISO 9001
        </p>
      </div>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("nombre, rol")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <span className="font-semibold">Scorecard de Proveedores</span>
            <nav className="flex gap-5 text-sm text-slate-600">
              <Link href="/panel" className="hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/panel/proveedores" className="hover:text-slate-900">
                Proveedores
              </Link>
              <Link href="/panel/evaluaciones" className="hover:text-slate-900">
                Evaluaciones
              </Link>
              <Link href="/panel/cuadros" className="hover:text-slate-900">
                Comparativos
              </Link>
            </nav>
          </div>
          <div className="text-sm text-slate-500">
            {perfil?.nombre ?? user.email}
            {perfil?.rol ? ` · ${perfil.rol}` : ""}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

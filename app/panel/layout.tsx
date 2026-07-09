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

  const links = [
    { href: "/panel", label: "Dashboard" },
    { href: "/panel/proveedores", label: "Proveedores" },
    { href: "/panel/evaluaciones", label: "Evaluaciones" },
    { href: "/panel/cuadros", label: "Comparativos" },
  ];

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-20 border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <Link href="/panel" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                S
              </span>
              <span className="font-semibold tracking-tight text-white">
                Scorecard de Proveedores
              </span>
            </Link>
            <nav className="hidden gap-1 md:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-400 sm:block">
              {perfil?.nombre ?? user.email}
            </span>
            {perfil?.rol && (
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-400">
                {perfil.rol}
              </span>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

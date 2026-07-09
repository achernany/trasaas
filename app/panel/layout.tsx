import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import UserMenu from "@/components/UserMenu";

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
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="no-print sticky top-0 z-20 border-b border-brand-700/30 bg-brand-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <Link href="/panel" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 font-display text-sm font-bold text-white">
                S
              </span>
              <span className="font-display font-semibold tracking-tight text-white">
                Scorecard
              </span>
            </Link>
            <nav className="hidden gap-1 md:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <UserMenu
            nombre={perfil?.nombre ?? user.email ?? "Usuario"}
            rol={perfil?.rol}
          />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <BottomNav />
    </div>
  );
}

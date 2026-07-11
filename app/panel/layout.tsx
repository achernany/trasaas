import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import UserMenu from "@/components/UserMenu";
import { AlfaMark } from "@/components/Logo";
import { Bell, Settings } from "lucide-react";

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

  const [{ data: perfil }, { count: registrosNuevos }] = await Promise.all([
    supabase.from("usuarios").select("nombre, rol").eq("id", user.id).single(),
    supabase
      .from("proveedor_registros")
      .select("*", { count: "exact", head: true })
      .eq("estado", "enviado"),
  ]);

  const links = [
    { href: "/panel", label: "Dashboard" },
    { href: "/panel/proveedores", label: "Proveedores" },
    { href: "/panel/evaluaciones", label: "Evaluaciones" },
    { href: "/panel/cuadros", label: "Comparativos" },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="no-print sticky top-0 z-20 border-b border-white/10 bg-ink-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <Link href="/panel" className="flex items-center gap-2">
              <AlfaMark size={26} />
              <span className="font-display text-[16px] font-bold tracking-[-0.5px] text-white">
                AlfaSource
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
          <div className="flex items-center gap-1">
            <Link
              href="/panel/registros"
              title="Registros de proveedores pendientes de revisión"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <Bell className="h-[18px] w-[18px]" />
              {(registrosNuevos ?? 0) > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-alfa-red px-1 text-[9px] font-bold text-white">
                  {registrosNuevos}
                </span>
              )}
            </Link>
            <Link
              href="/panel/configuracion"
              title="Configuración del sistema"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <Settings className="h-[18px] w-[18px]" />
            </Link>
            <UserMenu
              nombre={perfil?.nombre ?? user.email ?? "Usuario"}
              rol={perfil?.rol}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <BottomNav />
    </div>
  );
}

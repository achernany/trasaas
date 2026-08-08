import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import UserMenu from "@/components/UserMenu";
import { TrasaasMark } from "@/components/Logo";
import NavItem from "@/components/NavItem";

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

  const [{ data: perfil }, { count: registrosNuevos }, { count: pendientes }] =
    await Promise.all([
      supabase.from("usuarios").select("nombre, rol").eq("id", user.id).single(),
      supabase
        .from("proveedor_registros")
        .select("*", { count: "exact", head: true })
        .eq("estado", "enviado"),
      supabase
        .from("cuadro_items")
        .select("*", { count: "exact", head: true })
        .eq("estado_aprobacion", "no_aprobado"),
    ]);

  const links = [
    { href: "/panel", label: "Dashboard", icon: "dashboard" },
    {
      href: "/panel/registros",
      label: "Registro",
      icon: "registro",
      badge: registrosNuevos ?? 0,
    },
    { href: "/panel/seleccion", label: "Selección", icon: "seleccion" },
    { href: "/panel/cuadros", label: "Comparativos", icon: "cuadros" },
    {
      href: "/panel/pendientes",
      label: "Ítems pendientes",
      icon: "pendientes",
      badge: pendientes ?? 0,
    },
    { href: "/panel/proveedores", label: "Proveedores", icon: "proveedores" },
    { href: "/panel/evaluaciones", label: "Evaluaciones", icon: "evaluaciones" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="no-print hidden w-[232px] shrink-0 flex-col bg-ink-950 md:flex">
        <Link href="/panel" className="flex items-center gap-2.5 px-5 pb-6 pt-5">
          <TrasaasMark size={28} />
          <span className="font-display text-[17px] font-bold tracking-[-0.5px] text-white">
            Trasaas
          </span>
        </Link>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">
            Flujo de compra
          </p>
          {links.map((l) => (
            <NavItem key={l.href} {...l} />
          ))}
        </nav>

        <div className="space-y-0.5 px-3 pb-3">
          <NavItem
            href="/panel/configuracion"
            label="Configuración"
            icon="config"
          />
          <div className="mt-2 border-t border-white/10 px-1 pt-3">
            <UserMenu
              nombre={perfil?.nombre ?? user.email ?? "Usuario"}
              rol={perfil?.rol}
            />
          </div>
        </div>
      </aside>

      {/* Contenido */}
      <div className="min-w-0 flex-1 overflow-y-auto bg-page pb-20 md:pb-0">
        <main className="mx-auto min-h-full max-w-6xl px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

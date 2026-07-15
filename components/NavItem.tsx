"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  UserCheck,
  Scale,
  Users,
  ClipboardList,
  Settings,
} from "lucide-react";

const ICONS: Record<string, any> = {
  dashboard: LayoutDashboard,
  registro: Inbox,
  seleccion: UserCheck,
  cuadros: Scale,
  proveedores: Users,
  evaluaciones: ClipboardList,
  config: Settings,
};

export default function NavItem({
  href,
  label,
  icon,
  badge,
}: {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}) {
  const pathname = usePathname();
  const activo =
    href === "/panel" ? pathname === "/panel" : pathname.startsWith(href);
  const Icon = ICONS[icon] ?? LayoutDashboard;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition ${
        activo
          ? "bg-white/10 text-white"
          : "text-white/55 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon
        className={`h-[17px] w-[17px] shrink-0 ${activo ? "text-white" : ""}`}
      />
      <span className="flex-1">{label}</span>
      {(badge ?? 0) > 0 && (
        <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-alfa-red px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
      {activo && <span className="h-4 w-1 rounded-full bg-alfa-gradient" />}
    </Link>
  );
}

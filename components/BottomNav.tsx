"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/panel",
    label: "Inicio",
    icon: (
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z" />
    ),
  },
  {
    href: "/panel/proveedores",
    label: "Proveedores",
    icon: (
      <path d="M16 14a4 4 0 1 0-8 0M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 11v-1a4 4 0 0 0-3-3.87M4 21v-1a4 4 0 0 1 3-3.87" />
    ),
  },
  {
    href: "/panel/evaluaciones",
    label: "Evaluaciones",
    icon: (
      <path d="M9 5h6m-6 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-6 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1m-5 7 2 2 4-4" />
    ),
  },
  {
    href: "/panel/cuadros",
    label: "Comparativos",
    icon: (
      <path d="M8 20V10m8 10V4M4 20h16" />
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid grid-cols-4">
        {TABS.map((t) => {
          const activo =
            t.href === "/panel"
              ? pathname === "/panel"
              : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
                activo ? "text-brand-900" : "text-ink-400"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {t.icon}
              </svg>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

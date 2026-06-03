"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Users,
  CalendarDays,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Painel",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/leagues",
    label: "Minhas Ligas",
    icon: Trophy,
  },
  {
    href: "/dashboard/matches",
    label: "Jogos",
    icon: CalendarDays,
  },
  {
    href: "/dashboard/ranking",
    label: "Ranking",
    icon: Users,
  },
  {
    href: "/dashboard/settings",
    label: "Configurações",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r border-pitch-border bg-pitch-bg-alt">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-pitch-border">
        <span className="text-xl font-extrabold tracking-tight">
          Stat<span className="text-verde">Pitch</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-verde/10 text-verde"
                      : "text-text-secondary hover:bg-pitch-surface hover:text-text-primary"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-pitch-border p-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-pitch-surface hover:text-vermelho">
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}

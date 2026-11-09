"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CreditCard,
  CalendarClock,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Visão Geral",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/students",
    label: "Alunos",
    icon: Users,
  },
  {
    href: "/dashboard/classes",
    label: "Turmas & Categorias",
    icon: GraduationCap,
  },
  {
    href: "/dashboard/payments",
    label: "Calendário de Pagamentos",
    icon: CreditCard,
  },
  {
    href: "/dashboard/court",
    label: "Agenda da Quadra",
    icon: CalendarClock,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  const handleCopyEnrollmentLink = () => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${origin}/matricula`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-pitch-border bg-pitch-bg-alt lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-pitch-border px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-verde/15 text-verde font-mono font-bold text-sm">
            SP
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-text-primary">
              Stat<span className="text-verde">Pitch</span>
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Escolinha & Quadra
            </span>
          </div>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Gestão Esportiva
        </div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-verde/15 text-verde border border-verde/30"
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

        {/* Atalho Link Público de Matrícula */}
        <div className="mt-8 px-1">
          <div className="rounded-xl border border-pitch-border bg-pitch-surface p-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-bold text-verde">
                Link de Matrícula
              </span>
              <span className="rounded bg-verde/15 px-1.5 py-0.5 text-[10px] font-semibold text-verde">
                Público
              </span>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-text-secondary">
              Envie no WhatsApp dos pais para cadastro de atletas + 1ª cobrança Stripe.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleCopyEnrollmentLink}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-verde px-3 py-2 text-xs font-bold text-[#0a0f0b] transition hover:bg-verde-light cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Link Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copiar Link (/matricula)
                  </>
                )}
              </button>
              <Link
                href="/matricula"
                target="_blank"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-pitch-border py-1.5 text-xs font-medium text-text-secondary transition hover:border-pitch-border-hover hover:text-text-primary"
              >
                Abrir Formulário
                <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-pitch-border p-4">
        <div className="flex items-center gap-2.5 text-xs text-text-muted">
          <ShieldCheck size={16} className="text-verde shrink-0" />
          <span className="truncate">Integrado a Supabase + Stripe</span>
        </div>
      </div>
    </aside>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Trophy,
  CreditCard,
  CalendarClock,
  ArrowUpRight,
  Copy,
  Check,
  ShieldCheck,
  QrCode,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { isSupabaseConfigured } from "@/lib/supabase";

export const navItems = [
  { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/dashboard/alunos", label: "Alunos", icon: Users },
  { href: "/dashboard/turmas", label: "Turmas & Categorias", icon: Trophy },
  { href: "/dashboard/financeiro", label: "Conciliação & Caixa", icon: CreditCard },
  { href: "/dashboard/quadra", label: "Agenda da Quadra", icon: CalendarClock },
];

export function isNavActive(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

export function Sidebar() {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  const handleCopyEnrollmentLink = () => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    navigator.clipboard.writeText(`${origin}/matricula`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col liquid-glass-dark lg:flex">
      {/* Top Brand */}
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <Logo href="/dashboard" subtitle="Escolinha & Quadra" inverted />
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          Painel Operacional
        </div>
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-950/50 border border-white/20"
                      : "text-slate-300 hover:bg-white/8 hover:text-white border border-transparent"
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.4 : 1.9}
                    className={`shrink-0 transition-colors ${
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-emerald-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Card de Link Público de Matrícula (Liquid Glass translúcido escuro) */}
        <div className="mt-7 px-2">
          <div className="rounded-2xl border border-white/12 bg-white/6 backdrop-blur-md p-4 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                <QrCode size={13} />
                Link de Matrícula
              </span>
              <Link
                href="/matricula"
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <span>Abrir</span>
                <ArrowUpRight size={12} />
              </Link>
            </div>
            <p className="text-xs leading-relaxed text-slate-300/90">
              Envie no WhatsApp dos pais para inscrição rápida sem senha e conciliação via PIX.
            </p>
            <button
              type="button"
              onClick={handleCopyEnrollmentLink}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-white/20 px-3 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copiar Link /matricula</span>
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom Status */}
      <div className="border-t border-white/10 p-4 bg-black/20">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isSupabaseConfigured
                  ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                  : "bg-amber-400"
              }`}
            />
            <span className="font-medium text-slate-300">
              {isSupabaseConfigured ? "Supabase Conectado" : "Modo Local Ativo"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Conciliação PIX</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

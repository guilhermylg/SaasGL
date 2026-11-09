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
} from "lucide-react";
import { Logo } from "@/components/logo";
import { isSupabaseConfigured } from "@/lib/supabase";

export const navItems = [
  { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/dashboard/alunos", label: "Alunos", icon: Users },
  { href: "/dashboard/turmas", label: "Turmas & Categorias", icon: Trophy },
  { href: "/dashboard/financeiro", label: "Calendário Financeiro", icon: CreditCard },
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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-900 border-r border-slate-800 lg:flex">
      {/* Top Brand */}
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <Logo href="/dashboard" subtitle="Escolinha & Quadra" inverted />
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          Menu de Gestão
        </div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    active
                      ? "bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-900/50"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon
                    size={18}
                    className={active ? "text-white" : "text-slate-400"}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Link Público de Matrícula (Card Prominente) */}
        <div className="mt-8 px-1">
          <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Link de Matrícula
              </span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                WhatsApp
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Envie aos pais para inscrição rápida sem login + 1ª mensalidade via Stripe.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleCopyEnrollmentLink}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 active:scale-95 cursor-pointer shadow-xs"
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span>Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar Link (/matricula)</span>
                  </>
                )}
              </button>
              <Link
                href="/matricula"
                target="_blank"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
              >
                <span>Abrir Formulário</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Footer Status */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-500" />
            <span>Supabase + Stripe</span>
          </span>
          <span
            className={`h-2 w-2 rounded-full ${
              isSupabaseConfigured ? "bg-emerald-500" : "bg-amber-400"
            }`}
            title={isSupabaseConfigured ? "Conectado" : "Modo Local"}
          />
        </div>
      </div>
    </aside>
  );
}

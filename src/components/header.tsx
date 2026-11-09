"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Share2, Check, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { navItems, isNavActive } from "@/components/sidebar";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Visão Geral",
  "/dashboard/alunos": "Gestão de Alunos",
  "/dashboard/turmas": "Turmas & Categorias",
  "/dashboard/financeiro": "Calendário Financeiro",
  "/dashboard/quadra": "Agenda da Quadra",
};

export function Header() {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  const handleCopyEnrollment = () => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    navigator.clipboard.writeText(`${origin}/matricula`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTitle =
    PAGE_TITLES[pathname] ||
    navItems.find((item) => isNavActive(pathname, item.href))?.label ||
    "Painel de Controle";

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-2xs">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile Brand & Page Title */}
        <div className="flex items-center gap-4">
          <div className="lg:hidden">
            <Logo href="/dashboard" size="sm" />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-[family-name:var(--font-montserrat)] text-lg font-bold text-slate-900 tracking-tight">
              {currentTitle}
            </h1>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyEnrollment}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-400 cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-700">Link Copiado!</span>
              </>
            ) : (
              <>
                <Share2 size={14} className="text-emerald-600" />
                <span>Link de Matrícula</span>
              </>
            )}
          </button>

          <Link
            href="/matricula"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
          >
            <span>Ver /matricula</span>
            <ArrowUpRight size={13} />
          </Link>

          {/* Admin Avatar */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-2xs">
              AD
            </div>
            <div className="hidden md:block leading-tight">
              <div className="text-xs font-bold text-slate-900">Coordenação</div>
              <div className="text-[11px] text-slate-500">Administrador</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-200 bg-slate-900 px-3 py-2 lg:hidden">
        {navItems.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-emerald-600 text-white font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon size={14} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}

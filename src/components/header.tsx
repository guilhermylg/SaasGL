"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Share2, Check, ArrowUpRight, Landmark } from "lucide-react";
import { Logo } from "@/components/logo";
import { navItems, isNavActive } from "@/components/sidebar";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Visão Geral",
  "/dashboard/alunos": "Gestão de Alunos",
  "/dashboard/turmas": "Turmas & Categorias",
  "/dashboard/financeiro": "Conciliação Bancária & Caixa",
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
    <header className="sticky top-0 z-20 liquid-glass border-b border-white/70">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile Brand & Page Title */}
        <div className="flex items-center gap-4">
          <div className="lg:hidden">
            <Logo href="/dashboard" size="sm" />
          </div>
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <h1 className="font-[family-name:var(--font-montserrat)] text-lg font-extrabold text-slate-900 tracking-tight">
              {currentTitle}
            </h1>
            <span className="liquid-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              <Landmark size={12} className="text-emerald-600" />
              Conciliação Manual Ativa
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyEnrollment}
            className="btn-secondary !py-2 !px-3 !text-xs"
            title="Copiar link público de matrícula para enviar no WhatsApp"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-700 font-bold">
                  Link Copiado!
                </span>
              </>
            ) : (
              <>
                <Share2 size={14} className="text-emerald-600" />
                <span className="hidden sm:inline">Compartilhar</span>
                <span>/matricula</span>
              </>
            )}
          </button>

          <Link
            href="/matricula"
            target="_blank"
            className="btn-primary !py-2 !px-3.5 !text-xs"
          >
            <span>Formulário dos Pais</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <nav
        aria-label="Navegação mobile"
        className="flex gap-1.5 overflow-x-auto border-t border-white/10 bg-slate-900/95 backdrop-blur-md px-3 py-2 lg:hidden"
      >
        {navItems.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                active
                  ? "bg-emerald-600 text-white font-bold shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

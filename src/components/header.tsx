"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Share2,
  Check,
  ExternalLink,
  LayoutDashboard,
  Users,
  GraduationCap,
  CreditCard,
  CalendarClock,
} from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

const mobileLinks = [
  { href: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/dashboard/students", label: "Alunos", icon: Users },
  { href: "/dashboard/classes", label: "Turmas", icon: GraduationCap },
  { href: "/dashboard/payments", label: "Pagamentos", icon: CreditCard },
  { href: "/dashboard/court", label: "Quadra", icon: CalendarClock },
];

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

  return (
    <header className="sticky top-0 z-20 border-b border-pitch-border bg-pitch-bg-alt/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand on mobile + Context badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-lg font-extrabold tracking-tight lg:hidden"
          >
            Stat<span className="text-verde">Pitch</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-pitch-border bg-pitch-surface px-3 py-1 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                isSupabaseConfigured ? "bg-verde" : "bg-amarelo"
              }`}
            />
            <span className="text-text-secondary">
              {isSupabaseConfigured
                ? "Supabase Conectado"
                : "Modo Demo Local (Pronto p/ Supabase)"}
            </span>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={handleCopyEnrollment}
            className="inline-flex items-center gap-2 rounded-lg border border-pitch-border bg-pitch-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition hover:border-verde hover:text-verde cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} className="text-verde" />
                <span>Link /matricula copiado</span>
              </>
            ) : (
              <>
                <Share2 size={14} className="text-verde" />
                <span>Link de Matrícula</span>
              </>
            )}
          </button>

          <Link
            href="/matricula"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-verde/15 px-3 py-1.5 text-xs font-bold text-verde transition hover:bg-verde/25"
          >
            <span>Ver /matricula</span>
            <ExternalLink size={13} />
          </Link>

          {/* Admin Avatar */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-verde/20 text-xs font-bold text-verde">
              AD
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-text-primary leading-tight">
                Coordenação
              </div>
              <div className="text-[11px] text-text-muted leading-tight">
                Escolinha & Quadra
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-t border-pitch-border px-3 py-2 lg:hidden">
        {mobileLinks.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? "bg-verde/15 text-verde"
                  : "text-text-secondary hover:bg-pitch-surface"
              }`}
            >
              <item.icon size={14} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Lock,
  Trophy,
  Users,
  Landmark,
  CalendarClock,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/logo";

const steps = [
  {
    n: "01",
    title: "Matrícula Digital sem Login",
    text: "Envie o link público pelo WhatsApp. Os pais informam atleta, posição, restrições médicas e a turma é calculada na hora.",
    icon: Smartphone,
  },
  {
    n: "02",
    title: "Bloqueio Automático da Quadra",
    text: "Terça e quinta, 18h às 19h com o Sub-11? Esse horário é bloqueado na hora para evitar conflito com aluguel avulso.",
    icon: Lock,
  },
  {
    n: "03",
    title: "Conciliação Bancária PIX",
    text: "Dispare a chave PIX oficial pelo WhatsApp e concilie o recebimento manualmente com 1 clique no calendário financeiro.",
    icon: Landmark,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen text-slate-900">
      {/* Navbar Fixa Liquid Glass */}
      <header className="sticky top-0 z-40 liquid-glass border-b border-white/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo subtitle="SportTech · Escolinha & Quadra" />

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <a href="#solucao" className="transition hover:text-emerald-600">
              Solução
            </a>
            <a href="#modulos" className="transition hover:text-emerald-600">
              Módulos
            </a>
            <Link href="/matricula" className="transition hover:text-emerald-600">
              Matrícula Pública
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/matricula"
              className="btn-secondary !text-xs !py-2 hidden sm:inline-flex"
            >
              Link dos Pais
            </Link>
            <Link
              href="/dashboard"
              className="btn-primary !text-xs sm:!text-sm !py-2"
            >
              <span>Acessar Painel</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full liquid-pill px-3.5 py-1.5 text-xs font-bold text-emerald-800 font-mono mb-6">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>ArenaGL · Gestão de Escolinha de Futebol & Locação de Quadras</span>
          </div>

          <h1 className="font-[family-name:var(--font-montserrat)] text-4xl font-black tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.08]">
            Sua Escolinha e Sua Quadra em uma{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Única Grade & Caixa
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
            Elimine fichas em papel e conflitos de horários na quadra. Matricule
            atletas pelo WhatsApp com triagem automática por idade (Sub-7 a
            Sub-17), bloqueie horários de treino e faça a{" "}
            <strong className="text-slate-900 font-bold">
              conciliação bancária via PIX
            </strong>{" "}
            em segundos.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="btn-primary !h-12 !px-7 !text-base"
            >
              <span>Entrar no Painel Administrativo</span>
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/matricula"
              target="_blank"
              className="btn-secondary !h-12 !px-6 !text-base"
            >
              <span>Testar Matrícula dos Pais</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        {/* Imagem do Hero com Badges Flutuantes em Liquid Glass */}
        <div className="relative mt-12 sm:mt-16">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-white/80 shadow-2xl">
            <Image
              src="/hero-court.jpg"
              alt="Quadra de futebol iluminada à noite com treino esportivo"
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1152px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-900/15 to-transparent" />
          </div>

          {/* Badge Flutuante 1: Horário Bloqueado da Escolinha (Liquid Glass) */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 rounded-2xl liquid-glass p-4 max-w-xs">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
              <span className="flex items-center gap-1.5 uppercase tracking-wider font-mono">
                <Lock size={12} /> Treino Bloqueado
              </span>
              <span className="font-mono rounded-md bg-indigo-100/80 px-1.5 py-0.5 text-[11px]">
                18:00
              </span>
            </div>
            <div className="mt-1.5 font-[family-name:var(--font-montserrat)] font-extrabold text-sm text-slate-900">
              Sub-11 Formação Tarde
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Terça & Quinta · Quadra bloqueada contra double booking
            </div>
          </div>

          {/* Badge Flutuante 2: Conciliação Bancária PIX (Liquid Glass) */}
          <div className="absolute right-4 top-4 sm:right-6 sm:top-6 hidden sm:block rounded-2xl liquid-glass p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 border border-emerald-300/60">
                <CheckCircle2 size={17} />
              </span>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Mensalidade Conciliada
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold">
                  ✓ PIX Conferido no Extrato
                </div>
              </div>
            </div>
            <div className="mt-2 font-[family-name:var(--font-montserrat)] text-xl font-black text-emerald-700">
              R$ 175,00
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona em 3 Passos */}
      <section id="solucao" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Sparkles size={13} /> Fluxo Unificado SportTech
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-montserrat)] text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Como o ArenaGL resolve o dia a dia da quadra
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.n}
                className="card p-6 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 font-[family-name:var(--font-montserrat)] text-sm font-bold text-white shadow-sm">
                    {step.n}
                  </span>
                  <step.icon size={20} className="text-emerald-600" />
                </div>
                <h3 className="font-[family-name:var(--font-montserrat)] text-lg font-bold text-slate-900 pt-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Módulos do Sistema */}
      <section id="modulos" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
        <div className="max-w-2xl mb-12">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-700">
            Módulos Completos
          </span>
          <h2 className="mt-2 font-[family-name:var(--font-montserrat)] text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Tudo o que sua escolinha e quadra precisam
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Alunos & Cromos",
              desc: "Ficha do atleta em estilo cromo esportivo, categoria Sub, posição de jogo, ficha médica e WhatsApp direto.",
              icon: Users,
              href: "/dashboard/alunos",
            },
            {
              title: "Turmas & Categorias",
              desc: "Crie turmas Sub-7 ao Sub-17 com faixas etárias, professor, dias de treino e valor da mensalidade.",
              icon: Trophy,
              href: "/dashboard/turmas",
            },
            {
              title: "Conciliação & Caixa",
              desc: "Controle por vencimento (dias 5, 10, 15, 20) ou Matriz Anual com cobrança PIX via WhatsApp e baixa manual em 1 clique.",
              icon: Landmark,
              href: "/dashboard/financeiro",
            },
            {
              title: "Agenda Híbrida 07h–23h",
              desc: "Grade unificada: turmas fixas bloqueiam a quadra automaticamente contra double booking em locações avulsas.",
              icon: CalendarClock,
              href: "/dashboard/quadra",
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="card p-6 group flex flex-col justify-between space-y-4 hover:border-emerald-400"
            >
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50/90 text-emerald-700 border border-emerald-200/80 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <item.icon size={22} />
                </div>
                <h3 className="font-[family-name:var(--font-montserrat)] text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 pt-2 border-t border-slate-200/60">
                <span>Acessar Módulo</span>
                <ChevronRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Final Liquid Glass Dark */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="liquid-glass-dark rounded-3xl p-8 sm:p-14 text-white text-center space-y-6 relative overflow-hidden">
          <div className="mx-auto max-w-2xl space-y-4 relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-300 font-mono">
              Pronto para Operação
            </span>
            <h2 className="font-[family-name:var(--font-montserrat)] text-3xl sm:text-5xl font-black tracking-tight">
              Modernize sua escolinha e quadra hoje mesmo
            </h2>
            <p className="mx-auto max-w-xl text-sm sm:text-base text-slate-300">
              Acesse o painel administrativo ou envie o link público de matrícula
              diretamente para os pais pelo WhatsApp.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row pt-3">
              <Link
                href="/dashboard"
                className="btn-primary !h-12 !px-7 !text-sm"
              >
                <span>Abrir Painel Administrativo</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/matricula"
                target="_blank"
                className="h-12 px-6 rounded-xl border border-white/20 bg-white/10 text-white font-[family-name:var(--font-montserrat)] font-semibold text-sm hover:bg-white/15 transition inline-flex items-center gap-2"
              >
                <span>Formulário de Matrícula</span>
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-white/80 liquid-glass py-8 px-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row text-xs text-slate-500">
          <Logo subtitle="Gestão Esportiva & Quadras" size="sm" />
          <div className="flex items-center gap-4">
            <span>© 2026 ArenaGL · Escolinha & Locação de Quadras</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>Conciliação Bancária PIX</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

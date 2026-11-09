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
  CreditCard,
  CalendarClock,
  ShieldCheck,
  Smartphone,
  ChevronRight,
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
    title: "Cobranças com Stripe & Webhook",
    text: "Envie o link Stripe pelo WhatsApp. Assim que o pagamento cai, o status do aluno atualiza sozinho para 'Pago'.",
    icon: CreditCard,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navbar Fixa */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
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
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-emerald-800 font-mono mb-6">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>SaaS Híbrido · Escolinha de Futebol & Locação de Quadras</span>
          </div>

          <h1 className="font-[family-name:var(--font-montserrat)] text-4xl font-black tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.1]">
            Sua Escolinha e Sua Quadra em uma{" "}
            <span className="text-emerald-600">Única Grade & Caixa</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
            Elimine fichas em papel e conflitos de horários na quadra. Matricule
            atletas pelo WhatsApp com triagem automática por idade (Sub-7 a
            Sub-17), bloqueie horários de treino e automatize cobranças via{" "}
            <strong className="text-slate-900 font-bold">Stripe</strong>.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="btn-primary !h-12 !px-7 !text-base shadow-sm"
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

        {/* Imagem do Hero com Badges de Simulação */}
        <div className="relative mt-12 sm:mt-16">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-md">
            <Image
              src="/hero-court.jpg"
              alt="Quadra de futebol iluminada à noite com treino esportivo"
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1152px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
          </div>

          {/* Badge Flutuante 1: Horário Bloqueado da Escolinha */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 rounded-xl border border-indigo-200 bg-white p-3.5 shadow-lg max-w-xs">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
              <span className="flex items-center gap-1.5 uppercase tracking-wider font-mono">
                <Lock size={12} /> Treino Bloqueado
              </span>
              <span className="font-mono">18:00</span>
            </div>
            <div className="mt-1 font-[family-name:var(--font-montserrat)] font-bold text-sm text-slate-900">
              Sub-11 Formação Tarde
            </div>
            <div className="text-xs text-slate-500">
              Terça & Quinta · Quadra indisponível para avulsos
            </div>
          </div>

          {/* Badge Flutuante 2: Mensalidade Stripe Paga */}
          <div className="absolute right-4 top-4 sm:right-6 sm:top-6 hidden sm:block rounded-xl border border-emerald-200 bg-white p-3.5 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={16} />
              </span>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Mensalidade Confirmada
                </div>
                <div className="text-[11px] text-slate-500">
                  via Stripe Webhook
                </div>
              </div>
            </div>
            <div className="mt-2 font-[family-name:var(--font-montserrat)] text-lg font-black text-emerald-700">
              R$ 175,00
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona em 3 Passos */}
      <section id="solucao" className="bg-white border-y border-slate-200 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-700">
              Fluxo Unificado
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-montserrat)] text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Como o SaaS resolve o dia a dia da quadra
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.n}
                className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-[family-name:var(--font-montserrat)] text-sm font-bold text-white shadow-xs">
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
      <section id="modulos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
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
              desc: "Ficha do atleta, categoria Sub, posição de jogo, ficha médica e botão direto no WhatsApp do pai.",
              icon: Users,
              href: "/dashboard/students",
            },
            {
              title: "Turmas & Categorias",
              desc: "Crie turmas Sub-7 ao Sub-17 com faixas etárias, professor, dias de treino e valor da mensalidade.",
              icon: Trophy,
              href: "/dashboard/classes",
            },
            {
              title: "Calendário Financeiro",
              desc: "Controle por vencimento (dias 5, 10, 15, 20) ou Matriz Anual com links Stripe e baixa automática.",
              icon: CreditCard,
              href: "/dashboard/payments",
            },
            {
              title: "Agenda Híbrida 07h–23h",
              desc: "Grade unificada: turmas fixas bloqueiam a quadra, locações avulsas e botão rápido de reserva.",
              icon: CalendarClock,
              href: "/dashboard/court",
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <item.icon size={22} />
                </div>
                <h3 className="font-[family-name:var(--font-montserrat)] text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 pt-2 border-t border-slate-100">
                <span>Acessar Módulo</span>
                <ChevronRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-emerald-600 text-white py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 space-y-6">
          <h2 className="font-[family-name:var(--font-montserrat)] text-3xl sm:text-5xl font-black tracking-tight">
            Pronto para modernizar sua escolinha e quadra?
          </h2>
          <p className="mx-auto max-w-xl text-base text-emerald-100">
            Acesse o painel agora mesmo ou envie o link de matrícula diretamente
            para os pais pelo WhatsApp.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row pt-2">
            <Link
              href="/dashboard"
              className="h-12 px-7 rounded-lg bg-white text-emerald-800 font-[family-name:var(--font-montserrat)] font-bold text-sm hover:bg-emerald-50 transition shadow-sm inline-flex items-center gap-2"
            >
              <span>Abrir Painel Administrativo</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/matricula"
              target="_blank"
              className="h-12 px-6 rounded-lg border border-emerald-400 text-white font-[family-name:var(--font-montserrat)] font-semibold text-sm hover:bg-emerald-500 transition inline-flex items-center gap-2"
            >
              <span>Formulário de Matrícula</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row text-xs text-slate-500">
          <Logo subtitle="Gestão Esportiva" size="sm" />
          <div className="flex items-center gap-4">
            <span>© 2026 StatPitch · Supabase + Stripe</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>Deploy imediato na Vercel</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

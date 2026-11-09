"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  CalendarClock,
  CreditCard,
  Smartphone,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Matrícula Digital sem Login",
    description:
      "Envie o link /matricula no WhatsApp dos pais. Cadastro completo do atleta, ficha médica, sugestão automática de turma Sub e checkout Stripe.",
  },
  {
    icon: CalendarClock,
    title: "Grade Híbrida sem Conflito",
    description:
      "Os horários das turmas da escolinha bloqueiam automaticamente a agenda de locação da quadra, impedindo reservas duplicadas.",
  },
  {
    icon: CreditCard,
    title: "Mensalidades + Stripe Webhook",
    description:
      "Matriz anual e calendário por vencimento (dias 5, 10, 15, 20) com geração de link de pagamento e baixa automática via Webhook.",
  },
  {
    icon: GraduationCap,
    title: "Gestão Técnica por Categoria",
    description:
      "Controle seus atletas por categoria (Sub-7 ao Sub-17), posição em campo, pé dominante, observações médicas e contato direto com os pais.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-pitch-bg">
      {/* Navbar */}
      <header className="relative z-10 border-b border-pitch-border bg-pitch-bg-alt/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-verde/15 font-mono text-sm font-bold text-verde">
              SP
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              Stat<span className="text-verde">Pitch</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/matricula"
              className="btn-secondary px-4 py-2 text-xs sm:text-sm"
            >
              Link de Matrícula (/matricula)
            </Link>
            <Link
              href="/dashboard"
              className="btn-primary px-4 py-2 text-xs sm:text-sm"
            >
              Acessar Painel
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pitch-border bg-pitch-surface px-4 py-1.5 text-xs font-medium text-text-secondary">
            <ShieldCheck size={14} className="text-verde" />
            <span>SaaS Híbrido · Escolinha de Futebol & Locação de Quadras</span>
          </div>

          <h1 className="mx-auto mb-6 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            Sua Escolinha e Sua Quadra em uma{" "}
            <span className="text-verde">Única Agenda e Caixa</span>
          </h1>

          <div className="divider-gradient mx-auto mb-6 w-24" />

          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
            Elimine fichas de papel e conflitos de horários. Matricule alunos via
            link no WhatsApp com triagem automática por idade (<span className="text-amarelo font-semibold">Sub-7 a Sub-17</span>),
            bloqueie horários de treino na quadra e receba via{" "}
            <span className="text-verde font-semibold">Stripe</span>.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="btn-primary w-full px-8 py-3.5 text-base sm:w-auto"
            >
              Entrar no Painel de Gestão
              <ChevronRight size={18} />
            </Link>
            <Link
              href="/matricula"
              className="btn-secondary w-full px-8 py-3.5 text-base sm:w-auto"
            >
              Testar Matrícula Digital dos Pais
            </Link>
          </div>
        </motion.div>

        {/* Quick module pills */}
        <div className="mt-14 grid gap-3 sm:grid-cols-4">
          {[
            { label: "Alunos & Fichas Médicas", href: "/dashboard/students", icon: Users },
            { label: "Turmas & Categorias Sub", href: "/dashboard/classes", icon: GraduationCap },
            { label: "Calendário Mensalidades", href: "/dashboard/payments", icon: CreditCard },
            { label: "Grade Híbrida da Quadra", href: "/dashboard/court", icon: CalendarClock },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="card flex items-center justify-center gap-2.5 px-4 py-3.5 text-xs font-semibold text-text-primary hover:border-verde"
            >
              <item.icon size={16} className="text-verde" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.07, duration: 0.35 }}
              className="card p-6"
            >
              <div className="mb-4 inline-flex rounded-lg bg-verde/10 p-3 text-verde">
                <feature.icon size={22} />
              </div>
              <h2 className="mb-2 text-base font-bold text-text-primary">
                {feature.title}
              </h2>
              <p className="text-sm leading-relaxed text-text-secondary">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-pitch-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-bold">
              Stat<span className="text-verde">Pitch</span>
            </span>
            <span className="rounded bg-pitch-surface px-2 py-0.5 font-mono text-[10px] text-text-muted">
              MVP SaaS · Supabase + Stripe
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 size={13} className="text-verde" /> Pronto para Vercel
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

"use client";

import { motion } from "framer-motion";
import { Trophy, Users, CalendarDays, TrendingUp } from "lucide-react";
import Link from "next/link";

const quickStats = [
  {
    label: "Minhas Ligas",
    value: "3",
    icon: Trophy,
    change: "+1 esta semana",
    color: "text-verde",
    bg: "bg-verde/10",
  },
  {
    label: "Participantes",
    value: "47",
    icon: Users,
    change: "nas suas ligas",
    color: "text-amarelo",
    bg: "bg-amarelo/10",
  },
  {
    label: "Próximo Jogo",
    value: "2h 30m",
    icon: CalendarDays,
    change: "BRA × MEX",
    color: "text-verde-light",
    bg: "bg-verde/10",
  },
  {
    label: "Sua Posição",
    value: "#2",
    icon: TrendingUp,
    change: "Liga Principal",
    color: "text-amarelo-light",
    bg: "bg-amarelo/10",
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">Bem-vindo de volta 👋</h1>
        <p className="text-sm text-text-muted mt-1">
          Copa do Mundo 2026 — acompanhe seus bolões e palpites.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                {stat.label}
              </span>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon size={16} className={stat.color} />
              </div>
            </div>
            <div className="font-mono text-2xl font-bold text-text-primary">
              {stat.value}
            </div>
            <div className="text-xs text-text-muted mt-1">{stat.change}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/leagues" className="block">
          <div className="card group flex items-center gap-4 p-6 cursor-pointer">
            <div className="rounded-lg bg-verde/10 p-3">
              <Trophy size={24} className="text-verde" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary group-hover:text-verde transition-colors">
                Criar Nova Liga
              </h3>
              <p className="text-sm text-text-muted">
                Monte um bolão e convide seus amigos
              </p>
            </div>
          </div>
        </Link>
        <Link href="/dashboard/matches" className="block">
          <div className="card group flex items-center gap-4 p-6 cursor-pointer">
            <div className="rounded-lg bg-amarelo/10 p-3">
              <CalendarDays size={24} className="text-amarelo" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary group-hover:text-amarelo transition-colors">
                Fazer Palpites
              </h3>
              <p className="text-sm text-text-muted">
                Confira os próximos jogos e registre seus palpites
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  Users,
  BarChart3,
  Shield,
  ChevronRight,
  Zap,
  Globe,
  Target,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: Trophy,
    title: "Crie sua Liga",
    description:
      "Monte seu bolão em segundos. Defina valor de entrada e chave PIX do organizador.",
  },
  {
    icon: Users,
    title: "Convide a Galera",
    description:
      "Manda o link no grupo e junta os amigos. Cada um faz o PIX direto pro organizador.",
  },
  {
    icon: BarChart3,
    title: "Ranking Automático",
    description:
      "Acabou o jogo, a pontuação atualiza sozinha. Sem planilha, sem discussão.",
  },
  {
    icon: Shield,
    title: "Custódia Zero",
    description:
      "A gente não toca no dinheiro. Só organiza o bolão. Pagamento é entre vocês.",
  },
];

const stats = [
  { value: "2026", label: "Copa do Mundo", icon: Globe },
  { value: "48", label: "Seleções", icon: Target },
  { value: "104", label: "Partidas", icon: Zap },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      {/* Subtle field texture */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 0%, rgba(34,197,94,0.06) 0%, transparent 60%)`,
        }}
      />

      {/* ===== HERO ===== */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-3xl"
        >
          {/* Status badge */}
          <motion.div
            custom={0}
            variants={fadeUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-pitch-border bg-pitch-surface px-4 py-2 text-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verde opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-verde" />
            </span>
            <span className="text-text-secondary">
              Inscrições abertas — Copa 2026
            </span>
          </motion.div>

          {/* Logo */}
          <motion.h1
            custom={1}
            variants={fadeUp}
            className="mb-5 text-5xl font-extrabold tracking-tight sm:text-7xl"
          >
            Stat
            <span className="text-verde">Pitch</span>
          </motion.h1>

          {/* Gradient bar under title */}
          <motion.div
            custom={2}
            variants={fadeUp}
            className="divider-gradient mx-auto mb-8 w-24"
          />

          <motion.p
            custom={2}
            variants={fadeUp}
            className="mx-auto mb-3 max-w-xl text-lg text-text-secondary leading-relaxed"
          >
            O bolão da{" "}
            <span className="font-semibold text-amarelo">Copa do Mundo 2026</span>{" "}
            que funciona de verdade. Cria a liga, chama os amigos, e deixa a
            pontuação com a gente.
          </motion.p>

          <motion.p
            custom={3}
            variants={fadeUp}
            className="mx-auto mb-10 text-sm text-text-muted"
          >
            Modelo Custódia Zero — a gente organiza, o dinheiro é entre vocês.
          </motion.p>

          {/* CTAs */}
          <motion.div
            custom={4}
            variants={fadeUp}
            className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <button className="btn-primary px-8 py-3 text-base">
              Criar minha Liga
              <ChevronRight size={18} />
            </button>
            <button className="btn-secondary px-8 py-3">
              Entrar em uma Liga
            </button>
          </motion.div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <div className="card flex items-center gap-8 px-8 py-4 sm:gap-12">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <stat.icon size={18} className="text-text-muted" />
                <div>
                  <div className="font-mono text-lg font-bold text-verde">
                    {stat.value}
                  </div>
                  <div className="text-xs text-text-muted">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== COMO FUNCIONA ===== */}
      <section className="relative z-10 px-6 pb-28">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-3 text-3xl font-bold">Como funciona</h2>
            <div className="divider-gradient mx-auto w-16" />
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="card group p-6"
              >
                <div className="mb-4 inline-flex rounded-lg bg-verde/10 p-3 text-verde transition-transform group-hover:scale-110">
                  <feature.icon size={22} />
                </div>
                <h3 className="mb-2 text-base font-semibold text-text-primary">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PONTUAÇÃO ===== */}
      <section className="relative z-10 px-6 pb-28">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-3 text-3xl font-bold">Pontuação</h2>
            <div className="divider-gradient mx-auto w-16" />
          </motion.div>

          <div className="card overflow-hidden divide-y divide-pitch-border">
            {[
              {
                pts: "5",
                label: "Placar Exato",
                desc: "Cravou o resultado certinho",
                color: "text-verde",
                bg: "bg-verde/10",
              },
              {
                pts: "3",
                label: "Vencedor + Saldo",
                desc: "Acertou quem ganhou e a diferença de gols",
                color: "text-amarelo",
                bg: "bg-amarelo/10",
              },
              {
                pts: "1",
                label: "Só o Vencedor",
                desc: "Acertou quem venceu (ou que empatou)",
                color: "text-text-secondary",
                bg: "bg-pitch-surface-hover",
              },
              {
                pts: "0",
                label: "Errou",
                desc: "Não foi dessa vez",
                color: "text-vermelho",
                bg: "bg-vermelho/10",
              },
            ].map((rule, i) => (
              <motion.div
                key={rule.pts}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className="flex items-center gap-5 px-6 py-4"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-mono text-lg font-bold ${rule.color} ${rule.bg}`}
                >
                  {rule.pts}
                </div>
                <div>
                  <div className="font-semibold text-text-primary text-sm">
                    {rule.label}
                  </div>
                  <div className="text-xs text-text-muted">{rule.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 border-t border-pitch-border px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">
              Stat<span className="text-verde">Pitch</span>
            </span>
            <span className="rounded bg-pitch-surface px-2 py-0.5 font-mono text-[10px] text-text-muted">
              MVP
            </span>
          </div>
          <p className="text-xs text-text-muted">
            © 2026 StatPitch · Custódia Zero
          </p>
        </div>
      </footer>
    </main>
  );
}

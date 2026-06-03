"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Copy,
  Check,
  Users,
  DollarSign,
  QrCode,
  ChevronRight,
  X,
  Trophy,
  Eye,
  EyeOff,
  CircleCheckBig,
  CircleAlert,
} from "lucide-react";

// ── Dados dummy ──────────────────────────────────────────────

interface DummyMember {
  id: string;
  name: string;
  paid: boolean;
}

interface DummyLeague {
  id: string;
  name: string;
  pixKey: string;
  entryFee: number;
  inviteCode: string;
  members: DummyMember[];
}

const dummyLeagues: DummyLeague[] = [
  {
    id: "1",
    name: "Bolão da Firma",
    pixKey: "financeiro@empresa.com",
    entryFee: 50,
    inviteCode: "ab12cd34",
    members: [
      { id: "u1", name: "Carlos Silva", paid: true },
      { id: "u2", name: "Ana Oliveira", paid: true },
      { id: "u3", name: "Pedro Santos", paid: false },
      { id: "u4", name: "Julia Costa", paid: true },
      { id: "u5", name: "Lucas Mendes", paid: false },
      { id: "u6", name: "Maria Souza", paid: true },
    ],
  },
  {
    id: "2",
    name: "Família Unida",
    pixKey: "11999887766",
    entryFee: 30,
    inviteCode: "fam2026x",
    members: [
      { id: "u7", name: "Tio Roberto", paid: true },
      { id: "u8", name: "Prima Fernanda", paid: true },
      { id: "u9", name: "Vô Antônio", paid: true },
    ],
  },
  {
    id: "3",
    name: "Pelada FC",
    pixKey: "12345678901",
    entryFee: 100,
    inviteCode: "pelad26z",
    members: [
      { id: "u10", name: "Marcos Pereira", paid: true },
      { id: "u11", name: "Felipe Rocha", paid: false },
      { id: "u12", name: "Diego Lima", paid: true },
      { id: "u13", name: "Thiago Alves", paid: false },
      { id: "u14", name: "Bruno Nunes", paid: true },
      { id: "u15", name: "Rafael Dias", paid: true },
      { id: "u16", name: "Gabriel Moura", paid: false },
      { id: "u17", name: "Vinícius Reis", paid: true },
    ],
  },
];

// ── Componente Principal ─────────────────────────────────────

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState(dummyLeagues);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<DummyLeague | null>(
    null
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPix, setFormPix] = useState("");
  const [formFee, setFormFee] = useState("");

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function handleCreate() {
    if (!formName || !formPix || !formFee) return;
    const newLeague: DummyLeague = {
      id: String(Date.now()),
      name: formName,
      pixKey: formPix,
      entryFee: Number(formFee),
      inviteCode: Math.random().toString(36).substring(2, 10),
      members: [],
    };
    setLeagues([newLeague, ...leagues]);
    setFormName("");
    setFormPix("");
    setFormFee("");
    setShowCreate(false);
  }

  function togglePayment(leagueId: string, memberId: string) {
    setLeagues((prev) =>
      prev.map((l) =>
        l.id === leagueId
          ? {
              ...l,
              members: l.members.map((m) =>
                m.id === memberId ? { ...m, paid: !m.paid } : m
              ),
            }
          : l
      )
    );
    // Atualiza a liga selecionada também
    setSelectedLeague((prev) => {
      if (!prev || prev.id !== leagueId) return prev;
      return {
        ...prev,
        members: prev.members.map((m) =>
          m.id === memberId ? { ...m, paid: !m.paid } : m
        ),
      };
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minhas Ligas</h1>
          <p className="text-sm text-text-muted mt-1">
            Gerencie seus bolões e acompanhe pagamentos
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary"
        >
          <Plus size={16} />
          Nova Liga
        </button>
      </div>

      {/* ── Modal de Criação ── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="card w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Criar Nova Liga</h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg p-1.5 text-text-muted hover:bg-pitch-surface hover:text-text-primary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
                    Nome da Liga
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Bolão da Firma"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="input-pitch w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
                    Chave PIX do Organizador
                  </label>
                  <input
                    type="text"
                    placeholder="CPF, e-mail, telefone ou chave aleatória"
                    value={formPix}
                    onChange={(e) => setFormPix(e.target.value)}
                    className="input-pitch w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
                    Valor de Entrada (R$)
                  </label>
                  <input
                    type="number"
                    placeholder="50"
                    min="0"
                    value={formFee}
                    onChange={(e) => setFormFee(e.target.value)}
                    className="input-pitch w-full"
                  />
                </div>

                <button
                  onClick={handleCreate}
                  disabled={!formName || !formPix || !formFee}
                  className="btn-primary w-full mt-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
                >
                  <Trophy size={16} />
                  Criar Liga
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Grid de Ligas ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {leagues.map((league, i) => {
          const paidCount = league.members.filter((m) => m.paid).length;
          const totalExpected = league.members.length * league.entryFee;
          const totalReceived = paidCount * league.entryFee;

          return (
            <motion.div
              key={league.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="card p-5 cursor-pointer"
              onClick={() => setSelectedLeague(league)}
            >
              {/* League header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-verde/10 p-2.5">
                    <Trophy size={18} className="text-verde" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">
                      {league.name}
                    </h3>
                    <span className="text-xs text-text-muted">
                      {league.members.length} participantes
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-pitch-bg p-3 text-center">
                  <div className="text-xs text-text-muted mb-1">Entrada</div>
                  <div className="font-mono text-sm font-bold text-amarelo">
                    R$ {league.entryFee}
                  </div>
                </div>
                <div className="rounded-lg bg-pitch-bg p-3 text-center">
                  <div className="text-xs text-text-muted mb-1">Recebido</div>
                  <div className="font-mono text-sm font-bold text-verde">
                    R$ {totalReceived}
                  </div>
                </div>
                <div className="rounded-lg bg-pitch-bg p-3 text-center">
                  <div className="text-xs text-text-muted mb-1">Pendente</div>
                  <div className="font-mono text-sm font-bold text-vermelho">
                    R$ {totalExpected - totalReceived}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
                  <span>Pagamentos confirmados</span>
                  <span className="font-mono">
                    {paidCount}/{league.members.length}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-pitch-bg overflow-hidden">
                  <div
                    className="h-full rounded-full bg-verde transition-all duration-500"
                    style={{
                      width: `${
                        league.members.length > 0
                          ? (paidCount / league.members.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Invite code */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 rounded-lg bg-pitch-bg px-3 py-2 font-mono text-xs text-text-secondary">
                  Código: {league.inviteCode}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(league.inviteCode);
                  }}
                  className="rounded-lg bg-pitch-bg p-2 text-text-muted hover:text-verde transition-colors"
                  title="Copiar código"
                >
                  {copiedCode === league.inviteCode ? (
                    <Check size={14} className="text-verde" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Painel Lateral: Detalhes da Liga ── */}
      <AnimatePresence>
        {selectedLeague && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/50"
            onClick={() => setSelectedLeague(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="h-full w-full max-w-lg overflow-y-auto border-l border-pitch-border bg-pitch-bg-alt"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Panel header */}
              <div className="sticky top-0 flex items-center justify-between border-b border-pitch-border bg-pitch-bg-alt px-6 py-4">
                <h2 className="text-lg font-bold">{selectedLeague.name}</h2>
                <button
                  onClick={() => setSelectedLeague(null)}
                  className="rounded-lg p-1.5 text-text-muted hover:bg-pitch-surface hover:text-text-primary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* PIX Info */}
                <PixInfoCard league={selectedLeague} />

                {/* Financeiro */}
                <FinanceCard league={selectedLeague} />

                {/* Membros */}
                <MembersCard
                  league={selectedLeague}
                  onTogglePayment={(memberId) =>
                    togglePayment(selectedLeague.id, memberId)
                  }
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-componentes do painel ────────────────────────────────

function PixInfoCard({ league }: { league: DummyLeague }) {
  const [showPix, setShowPix] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(league.pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <QrCode size={16} className="text-verde" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Chave PIX do Organizador
        </h3>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg bg-pitch-bg px-3 py-2.5 font-mono text-sm text-text-secondary">
          {showPix ? league.pixKey : "••••••••••••"}
        </div>
        <button
          onClick={() => setShowPix(!showPix)}
          className="rounded-lg bg-pitch-bg p-2.5 text-text-muted hover:text-text-primary transition-colors"
          title={showPix ? "Ocultar" : "Mostrar"}
        >
          {showPix ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button
          onClick={handleCopy}
          className="rounded-lg bg-pitch-bg p-2.5 text-text-muted hover:text-verde transition-colors"
          title="Copiar"
        >
          {copied ? (
            <Check size={16} className="text-verde" />
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>

      <p className="text-xs text-text-muted mt-3">
        Compartilhe esta chave para os participantes fazerem o PIX diretamente.
      </p>
    </div>
  );
}

function FinanceCard({ league }: { league: DummyLeague }) {
  const paidCount = league.members.filter((m) => m.paid).length;
  const pendingCount = league.members.length - paidCount;
  const totalReceived = paidCount * league.entryFee;
  const totalPending = pendingCount * league.entryFee;
  const totalExpected = league.members.length * league.entryFee;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign size={16} className="text-amarelo" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Painel Financeiro
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-pitch-bg p-4">
          <div className="text-xs text-text-muted mb-1">Total Esperado</div>
          <div className="font-mono text-xl font-bold text-text-primary">
            R$ {totalExpected}
          </div>
        </div>
        <div className="rounded-lg bg-pitch-bg p-4">
          <div className="text-xs text-text-muted mb-1">Entrada</div>
          <div className="font-mono text-xl font-bold text-amarelo">
            R$ {league.entryFee}
          </div>
        </div>
        <div className="rounded-lg bg-verde/5 border border-verde/20 p-4">
          <div className="text-xs text-verde/70 mb-1">Recebido</div>
          <div className="font-mono text-xl font-bold text-verde">
            R$ {totalReceived}
          </div>
          <div className="text-xs text-text-muted mt-1">
            {paidCount} pagaram
          </div>
        </div>
        <div className="rounded-lg bg-vermelho/5 border border-vermelho/20 p-4">
          <div className="text-xs text-vermelho/70 mb-1">Pendente</div>
          <div className="font-mono text-xl font-bold text-vermelho">
            R$ {totalPending}
          </div>
          <div className="text-xs text-text-muted mt-1">
            {pendingCount} faltam
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 rounded-full bg-pitch-bg overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${
              league.members.length > 0
                ? (paidCount / league.members.length) * 100
                : 0
            }%`,
            background: "linear-gradient(90deg, #22c55e, #4ade80)",
          }}
        />
      </div>
      <div className="text-xs text-text-muted mt-1.5 text-right font-mono">
        {league.members.length > 0
          ? Math.round((paidCount / league.members.length) * 100)
          : 0}
        % confirmado
      </div>
    </div>
  );
}

function MembersCard({
  league,
  onTogglePayment,
}: {
  league: DummyLeague;
  onTogglePayment: (memberId: string) => void;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users size={16} className="text-verde" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Participantes ({league.members.length})
        </h3>
      </div>

      <div className="space-y-1">
        {league.members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-pitch-surface transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-pitch-bg flex items-center justify-center">
                <span className="text-xs font-bold text-text-secondary">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)}
                </span>
              </div>
              <span className="text-sm text-text-primary">{member.name}</span>
            </div>

            <button
              onClick={() => onTogglePayment(member.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                member.paid
                  ? "bg-verde/10 text-verde hover:bg-verde/20"
                  : "bg-vermelho/10 text-vermelho hover:bg-vermelho/20"
              }`}
            >
              {member.paid ? (
                <>
                  <CircleCheckBig size={13} />
                  Pago
                </>
              ) : (
                <>
                  <CircleAlert size={13} />
                  Pendente
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {league.members.length === 0 && (
        <div className="text-center py-8 text-sm text-text-muted">
          Nenhum participante ainda. Compartilhe o código da liga!
        </div>
      )}
    </div>
  );
}

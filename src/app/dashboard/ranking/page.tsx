"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, ChevronDown } from "lucide-react";

// --- Dados dummy de Ranking ---
interface RankingEntry {
  id: string;
  rank: number;
  name: string;
  initials: string;
  totalPoints: number;
  exactScores: number;
  correctWinners: number;
  isCurrentUser?: boolean;
}

const dummyRanking: RankingEntry[] = [
  { id: "u1", rank: 1, name: "Carlos Silva", initials: "CS", totalPoints: 45, exactScores: 5, correctWinners: 20 },
  { id: "u2", rank: 2, name: "Usuário (Você)", initials: "U", totalPoints: 42, exactScores: 4, correctWinners: 22, isCurrentUser: true },
  { id: "u3", rank: 3, name: "Ana Oliveira", initials: "AO", totalPoints: 38, exactScores: 3, correctWinners: 23 },
  { id: "u4", rank: 4, name: "Pedro Santos", initials: "PS", totalPoints: 35, exactScores: 2, correctWinners: 25 },
  { id: "u5", rank: 5, name: "Julia Costa", initials: "JC", totalPoints: 30, exactScores: 1, correctWinners: 25 },
  { id: "u6", rank: 6, name: "Lucas Mendes", initials: "LM", totalPoints: 28, exactScores: 1, correctWinners: 23 },
  { id: "u7", rank: 7, name: "Maria Souza", initials: "MS", totalPoints: 20, exactScores: 0, correctWinners: 20 },
];

export default function RankingPage() {
  const [selectedLeague, setSelectedLeague] = useState("Bolão da Firma");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header do Ranking */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ranking</h1>
          <p className="text-sm text-text-muted mt-1">
            Acompanhe a classificação em tempo real das suas ligas.
          </p>
        </div>

        {/* Seletor de Liga */}
        <div className="relative">
          <select 
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="appearance-none bg-pitch-surface border border-pitch-border rounded-lg pl-4 pr-10 py-2 text-sm font-medium text-text-primary focus:outline-none focus:border-verde transition-colors w-full sm:w-auto cursor-pointer"
          >
            <option value="Bolão da Firma">Bolão da Firma</option>
            <option value="Família Unida">Família Unida</option>
            <option value="Pelada FC">Pelada FC</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* Cards de Top 3 (Podium Visual) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end mt-8 mb-8">
        {/* 2º Lugar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="order-1 card flex flex-col items-center p-4 pb-6 bg-pitch-bg border-t-4 border-t-text-secondary"
        >
          <div className="relative mb-3">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-pitch-surface-hover flex items-center justify-center text-lg sm:text-xl font-bold text-text-secondary border-2 border-text-secondary">
              {dummyRanking[1].initials}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-text-secondary text-pitch-bg rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs border-2 border-pitch-bg">
              2
            </div>
          </div>
          <div className="text-xs sm:text-sm font-bold text-center truncate w-full">{dummyRanking[1].name}</div>
          <div className="font-mono text-lg font-bold text-text-secondary mt-1">{dummyRanking[1].totalPoints} pts</div>
        </motion.div>

        {/* 1º Lugar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="order-2 card flex flex-col items-center p-4 pb-10 bg-pitch-surface border-t-4 border-t-amarelo shadow-[0_-10px_30px_-15px_rgba(234,179,8,0.3)] z-10"
        >
          <div className="relative mb-3">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-amarelo">
              <Trophy size={24} />
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amarelo/10 flex items-center justify-center text-xl sm:text-2xl font-bold text-amarelo border-2 border-amarelo">
              {dummyRanking[0].initials}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amarelo text-pitch-bg rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm border-2 border-pitch-bg">
              1
            </div>
          </div>
          <div className="text-sm sm:text-base font-bold text-center text-amarelo truncate w-full">{dummyRanking[0].name}</div>
          <div className="font-mono text-2xl font-bold text-amarelo mt-1">{dummyRanking[0].totalPoints} pts</div>
        </motion.div>

        {/* 3º Lugar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="order-3 card flex flex-col items-center p-4 pb-4 bg-pitch-bg border-t-4 border-t-[#cd7f32]"
        >
          <div className="relative mb-3">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-pitch-surface-hover flex items-center justify-center text-base sm:text-lg font-bold text-[#cd7f32] border-2 border-[#cd7f32]">
              {dummyRanking[2].initials}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#cd7f32] text-pitch-bg rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] border-2 border-pitch-bg">
              3
            </div>
          </div>
          <div className="text-xs sm:text-sm font-bold text-center truncate w-full">{dummyRanking[2].name}</div>
          <div className="font-mono text-base font-bold text-[#cd7f32] mt-1">{dummyRanking[2].totalPoints} pts</div>
        </motion.div>
      </div>

      {/* Tabela de Ranking */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-pitch-surface-hover text-text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium w-16 text-center">Pos</th>
                <th className="px-6 py-4 font-medium">Participante</th>
                <th className="px-6 py-4 font-medium text-center">Placares Exatos</th>
                <th className="px-6 py-4 font-medium text-center">Vencedores</th>
                <th className="px-6 py-4 font-medium text-right text-verde">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pitch-border">
              {dummyRanking.map((entry, i) => (
                <motion.tr 
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 + 0.3, duration: 0.3 }}
                  className={`hover:bg-pitch-surface transition-colors ${entry.isCurrentUser ? 'bg-verde/5' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`font-mono font-bold ${
                      entry.rank === 1 ? 'text-amarelo' :
                      entry.rank === 2 ? 'text-text-secondary' :
                      entry.rank === 3 ? 'text-[#cd7f32]' : 'text-text-muted'
                    }`}>
                      {entry.rank}º
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        entry.isCurrentUser ? 'bg-verde/20 text-verde' : 'bg-pitch-surface-hover text-text-secondary'
                      }`}>
                        {entry.initials}
                      </div>
                      <span className={`font-medium ${entry.isCurrentUser ? 'text-verde' : 'text-text-primary'}`}>
                        {entry.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-text-muted font-mono">
                    {entry.exactScores}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-text-muted font-mono">
                    {entry.correctWinners}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="font-mono font-bold text-lg text-text-primary">
                      {entry.totalPoints}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

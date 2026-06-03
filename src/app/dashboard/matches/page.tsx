"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Save, CheckCircle2 } from "lucide-react";

// --- Dados dummy de partidas ---
interface DummyMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  date: string;
  time: string;
  group: string;
  status: "SCHEDULED" | "LIVE" | "FINISHED";
  homeScore?: number;
  awayScore?: number;
  // Palpite do usuário logado
  predictionHome?: number;
  predictionAway?: number;
}

const dummyMatches: DummyMatch[] = [
  {
    id: "m1",
    homeTeam: "Brasil",
    awayTeam: "Sérvia",
    homeFlag: "🇧🇷",
    awayFlag: "🇷🇸",
    date: "11 Jun",
    time: "16:00",
    group: "Grupo G",
    status: "SCHEDULED",
  },
  {
    id: "m2",
    homeTeam: "Suíça",
    awayTeam: "Camarões",
    homeFlag: "🇨🇭",
    awayFlag: "🇨🇲",
    date: "11 Jun",
    time: "13:00",
    group: "Grupo G",
    status: "SCHEDULED",
    predictionHome: 1,
    predictionAway: 1,
  },
  {
    id: "m3",
    homeTeam: "Argentina",
    awayTeam: "Arábia Saudita",
    homeFlag: "🇦🇷",
    awayFlag: "🇸🇦",
    date: "10 Jun",
    time: "16:00",
    group: "Grupo C",
    status: "FINISHED",
    homeScore: 1,
    awayScore: 2,
    predictionHome: 3,
    predictionAway: 0,
  },
  {
    id: "m4",
    homeTeam: "França",
    awayTeam: "Austrália",
    homeFlag: "🇫🇷",
    awayFlag: "🇦🇺",
    date: "10 Jun",
    time: "19:00",
    group: "Grupo D",
    status: "LIVE",
    homeScore: 2,
    awayScore: 1,
    predictionHome: 2,
    predictionAway: 1,
  },
];

export default function MatchesPage() {
  const [matches, setMatches] = useState(dummyMatches);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const handleScoreChange = (matchId: string, team: "home" | "away", value: string) => {
    const numValue = value === "" ? undefined : parseInt(value, 10);
    if (value !== "" && isNaN(numValue!)) return;

    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        return {
          ...m,
          [team === "home" ? "predictionHome" : "predictionAway"]: numValue,
        };
      })
    );
  };

  const savePrediction = (matchId: string) => {
    setSavingId(matchId);
    // Simula uma chamada à API
    setTimeout(() => {
      setSavingId(null);
      setSavedId(matchId);
      setTimeout(() => setSavedId(null), 2000);
    }, 600);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jogos e Palpites</h1>
          <p className="text-sm text-text-muted mt-1">
            Preencha seus palpites antes do início de cada partida.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {matches.map((match, i) => {
          const isLiveOrFinished = match.status !== "SCHEDULED";
          const isSaving = savingId === match.id;
          const isSaved = savedId === match.id;
          
          const hasPrediction = match.predictionHome !== undefined && match.predictionAway !== undefined;

          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={`card overflow-hidden ${
                match.status === "LIVE" ? "border-vermelho/30 ring-1 ring-vermelho/20" : ""
              }`}
            >
              {/* Header do Card */}
              <div className="flex items-center justify-between bg-pitch-surface-hover px-4 py-2 border-b border-pitch-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {match.group}
                  </span>
                  <span className="text-text-muted text-xs">•</span>
                  <span className="flex items-center gap-1 text-xs text-text-secondary">
                    <CalendarDays size={12} />
                    {match.date} às {match.time}
                  </span>
                </div>
                <div>
                  {match.status === "LIVE" && (
                    <span className="badge-live animate-pulse-dot">Ao Vivo</span>
                  )}
                  {match.status === "FINISHED" && (
                    <span className="rounded bg-pitch-bg px-2 py-1 text-[10px] font-bold text-text-muted uppercase">
                      Encerrado
                    </span>
                  )}
                </div>
              </div>

              {/* Corpo do Card: Times e Placar */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 gap-6">
                {/* Time da Casa */}
                <div className="flex flex-1 items-center justify-end gap-3 w-full sm:w-auto">
                  <span className="text-lg font-semibold text-text-primary">
                    {match.homeTeam}
                  </span>
                  <span className="text-3xl">{match.homeFlag}</span>
                </div>

                {/* Placar / Inputs */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      disabled={isLiveOrFinished}
                      value={match.predictionHome ?? ""}
                      onChange={(e) => handleScoreChange(match.id, "home", e.target.value)}
                      className="score-input disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-text-muted font-mono text-lg">X</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      disabled={isLiveOrFinished}
                      value={match.predictionAway ?? ""}
                      onChange={(e) => handleScoreChange(match.id, "away", e.target.value)}
                      className="score-input disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  
                  {/* Resultado real (se finalizado/ao vivo) */}
                  {isLiveOrFinished && match.homeScore !== undefined && (
                    <div className="text-xs text-text-muted bg-pitch-bg px-2 py-1 rounded-md border border-pitch-border">
                      Placar Real: <span className="font-mono text-text-primary">{match.homeScore} x {match.awayScore}</span>
                    </div>
                  )}
                </div>

                {/* Time Visitante */}
                <div className="flex flex-1 items-center justify-start gap-3 w-full sm:w-auto">
                  <span className="text-3xl">{match.awayFlag}</span>
                  <span className="text-lg font-semibold text-text-primary">
                    {match.awayTeam}
                  </span>
                </div>
              </div>

              {/* Footer do Card (Ações) */}
              {!isLiveOrFinished && (
                <div className="bg-pitch-bg px-4 py-3 border-t border-pitch-border flex items-center justify-end">
                  <button
                    onClick={() => savePrediction(match.id)}
                    disabled={!hasPrediction || isSaving || isSaved}
                    className={`btn-primary py-2 px-4 text-xs ${
                      isSaved ? "bg-verde-dark text-white" : ""
                    }`}
                  >
                    {isSaving ? (
                      "Salvando..."
                    ) : isSaved ? (
                      <>
                        <CheckCircle2 size={14} />
                        Salvo
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Salvar Palpite
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

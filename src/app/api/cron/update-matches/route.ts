import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MatchStatus } from "@/types/database";

// ============================================================
// StatPitch — Cron Job: Atualização de Partidas (Resiliente)
// Implementa um sistema de Fallback em Cascata:
// 1. TheSportsDB (Oficial/Grátis)
// 2. Sofascore via ScraperAPI (Proxy Bypass)
// 3. Sofascore Direto (Spoofing Headers)
// ============================================================

// --- Tipos Unificados ---
interface MatchData {
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
}

// ── 1. TheSportsDB ──────────────────────────────────────────
async function fetchTheSportsDB(): Promise<MatchData[]> {
  console.log("[CRON] 📡 Tentando Provedor 1: TheSportsDB...");
  const url = "https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4362&s=2026";
  
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`TheSportsDB falhou com status ${res.status}`);
  
  const data = await res.json();
  // Se retornou 200 mas não tem eventos, é sucesso mas sem dados.
  if (!data.events) return [];

  const matches: MatchData[] = [];
  
  for (const event of data.events) {
    let mappedStatus: MatchStatus | null = null;
    const s = event.strStatus?.toLowerCase();
    
    if (s === "match finished") mappedStatus = "FINISHED";
    else if (s === "in progress" || s === "halftime") mappedStatus = "LIVE";
    else if (s === "not started") mappedStatus = "SCHEDULED";
    
    if (mappedStatus) {
      matches.push({
        homeTeam: event.strHomeTeam,
        awayTeam: event.strAwayTeam,
        homeScore: event.intHomeScore !== null ? parseInt(event.intHomeScore) : null,
        awayScore: event.intAwayScore !== null ? parseInt(event.intAwayScore) : null,
        status: mappedStatus,
      });
    }
  }
  
  return matches;
}

// ── 2. Sofascore via ScraperAPI ──────────────────────────────
async function fetchSofascoreViaProxy(): Promise<MatchData[]> {
  console.log("[CRON] 📡 Tentando Provedor 2: Sofascore via ScraperAPI...");
  const scraperKey = process.env.SCRAPER_API_KEY;
  if (!scraperKey) throw new Error("SCRAPER_API_KEY não configurada");

  const targetUrl = encodeURIComponent("https://api.sofascore.com/api/v1/sport/football/scheduled-events/2026-06-11");
  const url = `http://api.scraperapi.com/?api_key=${scraperKey}&url=${targetUrl}`;
  
  const res = await fetch(url, { cache: "no-store", timeout: 30000 } as RequestInit);
  if (!res.ok) throw new Error(`ScraperAPI falhou com status ${res.status}`);
  
  const data = await res.json();
  if (!data.events) return []; // Retorna array vazio se não houver jogos, não joga erro!

  return parseSofascoreData(data.events);
}

// ── 3. Sofascore Direto (Headers Spoofing) ───────────────────
async function fetchSofascoreDirect(): Promise<MatchData[]> {
  console.log("[CRON] 📡 Tentando Provedor 3: Sofascore Direto (Spoofing)...");
  const url = "https://api.sofascore.com/api/v1/sport/football/scheduled-events/2026-06-11";
  
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "/",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://www.sofascore.com/",
    "Origin": "https://www.sofascore.com",
    "Cache-Control": "no-cache",
  };

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`Sofascore Direto falhou com status ${res.status}`);
  
  const data = await res.json();
  if (!data.events) return [];

  return parseSofascoreData(data.events);
}

// ── Helpers ──────────────────────────────────────────────────
function parseSofascoreData(events: any[]): MatchData[] {
  const matches: MatchData[] = [];
  
  for (const event of events) {
    // Filtra apenas eventos da Copa do Mundo (ID 16)
    if (event.tournament?.uniqueTournament?.id !== 16) continue;

    const code = event.status?.code;
    const type = event.status?.type;
    
    let mappedStatus: MatchStatus | null = null;
    if (code === 100 || type === "finished") mappedStatus = "FINISHED";
    else if (type === "inprogress" || [6, 7, 31, 32, 33, 34].includes(code)) mappedStatus = "LIVE";
    else if (type === "notstarted" || code === 0) mappedStatus = "SCHEDULED";
    
    if (mappedStatus) {
      matches.push({
        homeTeam: event.homeTeam?.name,
        awayTeam: event.awayTeam?.name,
        homeScore: event.homeScore?.current ?? null,
        awayScore: event.awayScore?.current ?? null,
        status: mappedStatus,
      });
    }
  }
  
  return matches;
}

// ============================================================
// Main Route Handler
// ============================================================
export async function GET(request: Request) {
  // ── Segurança ──────────────────────────────────────────────
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Inicializar Supabase Admin ─────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // ── Motor de Fallback (Tentativas em cascata) ──────────────
  let matchesToUpdate: MatchData[] | null = null;
  let providerUsed = "";
  const errorLogs: string[] = [];

  // Tentativa 1
  try {
    matchesToUpdate = await fetchTheSportsDB();
    providerUsed = "TheSportsDB";
  } catch (err1: any) {
    errorLogs.push(`Provider 1 (TheSportsDB): ${err1.message}`);
    
    // Tentativa 2
    try {
      matchesToUpdate = await fetchSofascoreViaProxy();
      providerUsed = "SofascoreViaScraperAPI";
    } catch (err2: any) {
      errorLogs.push(`Provider 2 (ScraperAPI): ${err2.message}`);
      
      // Tentativa 3
      try {
        matchesToUpdate = await fetchSofascoreDirect();
        providerUsed = "SofascoreDirect";
      } catch (err3: any) {
        errorLogs.push(`Provider 3 (Sofascore Direct): ${err3.message}`);
      }
    }
  }

  // Se matchesToUpdate continuar null, todas falharam
  if (matchesToUpdate === null) {
    console.error("[CRON] ❌ Todas as tentativas de conexão falharam.");
    return NextResponse.json(
      { error: "Todos os provedores de dados falharam HTTP.", logs: errorLogs },
      { status: 500 }
    );
  }

  // Se a requisição foi OK (HTTP 200), mas a API apenas informou que não há jogos (array vazio):
  if (matchesToUpdate.length === 0) {
    console.log(`[CRON] ✓ Conexão via ${providerUsed} bem-sucedida, mas nenhum jogo foi retornado.`);
    return NextResponse.json({
      success: true,
      provider_used: providerUsed,
      message: "Nenhum jogo para atualizar no momento",
      updated_matches: 0
    });
  }

  // ── Atualização no Banco de Dados ──────────────────────────
  let updatedCount = 0;
  
  for (const match of matchesToUpdate) {
    const updatePayload: Record<string, unknown> = {
      status: match.status,
    };
    if (match.homeScore !== null) updatePayload.home_score = match.homeScore;
    if (match.awayScore !== null) updatePayload.away_score = match.awayScore;

    // Removemos a verificação .neq("status", "FINISHED") para garantir que o 
    // update reflita qualquer coisa (incluso SCHEDULED, se precisar ajustar hora ou algo do tipo),
    // ou deixamos, mas para SCHEDULED é importante poder atualizar para SCHEDULED se mudou de campo.
    // Vamos apenas não re-atualizar partidas se já estão iguais, mas para simplificar, atualizamos.
    // Só não atualizamos FINISHED para FINISHED para economizar trigger caso quisessemos, 
    // mas a instrução é fazer update para SCHEDULED também.
    const { data: updatedRows, error } = await supabase
      .from("matches")
      .update(updatePayload)
      .eq("home_team", match.homeTeam)
      .eq("away_team", match.awayTeam)
      .select("id");

    if (error) {
      console.error(`[CRON] Erro ao atualizar ${match.homeTeam} x ${match.awayTeam}:`, error.message);
    } else if (updatedRows && updatedRows.length > 0) {
      updatedCount++;
      console.log(`[CRON] ✓ Atualizado via ${providerUsed}: ${match.homeTeam} ${match.homeScore ?? "?"} x ${match.awayScore ?? "?"} ${match.awayTeam} (${match.status})`);
    }
  }

  // ── Resposta de Sucesso ────────────────────────────────────
  return NextResponse.json({
    success: true,
    provider_used: providerUsed,
    updated_matches: updatedCount,
    events_found: matchesToUpdate.length,
    timestamp: new Date().toISOString()
  });
}

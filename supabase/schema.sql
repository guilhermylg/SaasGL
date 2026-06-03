-- ============================================================
-- StatPitch — Schema Completo para Supabase
-- Copa do Mundo 2026 · Modelo Custódia Zero
-- ============================================================
-- Execute este script no SQL Editor do Supabase (Dashboard > SQL Editor)
-- ============================================================

-- 0. Extensões necessárias
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- 1. Tipo ENUM para status da partida
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_status') THEN
    CREATE TYPE match_status AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED');
  END IF;
END
$$;


-- 2. Tabela: users (perfil público, referencia auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.users IS 'Perfil público dos usuários, vinculado ao auth.users do Supabase';


-- 3. Tabela: leagues
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leagues (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  admin_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pix_key    TEXT NOT NULL DEFAULT '',
  entry_fee  NUMERIC(10,2) NOT NULL DEFAULT 0,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.leagues IS 'Ligas/bolões criados pelos organizadores';

CREATE INDEX IF NOT EXISTS idx_leagues_admin ON public.leagues(admin_id);
CREATE INDEX IF NOT EXISTS idx_leagues_invite ON public.leagues(invite_code);


-- 4. Tabela: league_members
-- ============================================================
CREATE TABLE IF NOT EXISTS public.league_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id       UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payment_status  BOOLEAN NOT NULL DEFAULT false,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(league_id, user_id)
);

COMMENT ON TABLE public.league_members IS 'Membros de cada liga, com status de pagamento';

CREATE INDEX IF NOT EXISTS idx_league_members_league ON public.league_members(league_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user   ON public.league_members(user_id);


-- 5. Tabela: matches
-- ============================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_team    TEXT NOT NULL,
  away_team    TEXT NOT NULL,
  match_date   TIMESTAMPTZ NOT NULL,
  home_score   INT,
  away_score   INT,
  status       match_status NOT NULL DEFAULT 'SCHEDULED',
  group_label  TEXT,
  stadium      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.matches IS 'Partidas da Copa do Mundo 2026';

CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_date   ON public.matches(match_date);


-- 6. Tabela: predictions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.predictions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  match_id         UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  league_id        UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  home_prediction  INT NOT NULL,
  away_prediction  INT NOT NULL,
  points_earned    INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, match_id, league_id)
);

COMMENT ON TABLE public.predictions IS 'Palpites dos participantes por partida e liga';

CREATE INDEX IF NOT EXISTS idx_predictions_user   ON public.predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match  ON public.predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_league ON public.predictions(league_id);


-- ============================================================
-- 7. FUNCTION + TRIGGER: Cálculo automático de pontuação
-- ============================================================
-- Dispara quando uma partida muda para 'FINISHED'.
-- Percorre todos os palpites daquela partida e calcula os pontos.
--
-- Regras:
--   5 pts → Placar exato
--   3 pts → Acertou vencedor E saldo de gols
--   1 pt  → Acertou apenas o vencedor (ou empate)
--   0 pts → Errou
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_prediction_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  actual_diff INT;
  pred_diff   INT;
  actual_winner INT; -- -1 = away, 0 = draw, 1 = home
  pred_winner   INT;
  pts INT;
BEGIN
  -- Só calcula quando o status muda para FINISHED
  IF NEW.status <> 'FINISHED' THEN
    RETURN NEW;
  END IF;

  -- Se já era FINISHED antes, não recalcula
  IF OLD.status = 'FINISHED' THEN
    RETURN NEW;
  END IF;

  -- Precisa ter placar definido
  IF NEW.home_score IS NULL OR NEW.away_score IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calcular resultado real
  actual_diff := NEW.home_score - NEW.away_score;

  IF actual_diff > 0 THEN
    actual_winner := 1;   -- Home venceu
  ELSIF actual_diff < 0 THEN
    actual_winner := -1;  -- Away venceu
  ELSE
    actual_winner := 0;   -- Empate
  END IF;

  -- Percorrer todos os palpites desta partida
  FOR rec IN
    SELECT id, home_prediction, away_prediction
    FROM public.predictions
    WHERE match_id = NEW.id
  LOOP
    pred_diff := rec.home_prediction - rec.away_prediction;

    IF pred_diff > 0 THEN
      pred_winner := 1;
    ELSIF pred_diff < 0 THEN
      pred_winner := -1;
    ELSE
      pred_winner := 0;
    END IF;

    -- 5 pts: Placar exato
    IF rec.home_prediction = NEW.home_score
       AND rec.away_prediction = NEW.away_score THEN
      pts := 5;

    -- 3 pts: Acertou vencedor + saldo de gols
    ELSIF pred_winner = actual_winner AND pred_diff = actual_diff THEN
      pts := 3;

    -- 1 pt: Acertou apenas o vencedor
    ELSIF pred_winner = actual_winner THEN
      pts := 1;

    -- 0 pts: Errou
    ELSE
      pts := 0;
    END IF;

    UPDATE public.predictions
    SET points_earned = pts
    WHERE id = rec.id;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Remover trigger antiga caso exista (para re-deploy seguro)
DROP TRIGGER IF EXISTS trg_calculate_points ON public.matches;

-- Criar a trigger
CREATE TRIGGER trg_calculate_points
  AFTER UPDATE OF status ON public.matches
  FOR EACH ROW
  WHEN (NEW.status = 'FINISHED')
  EXECUTE FUNCTION public.calculate_prediction_points();

COMMENT ON FUNCTION public.calculate_prediction_points IS
  'Calcula pontos dos palpites quando uma partida é marcada como FINISHED';


-- ============================================================
-- 8. VIEW: Ranking por liga
-- ============================================================
-- Facilita a consulta do ranking sem queries complexas no frontend.

CREATE OR REPLACE VIEW public.league_rankings AS
SELECT
  p.league_id,
  p.user_id,
  u.full_name,
  u.avatar_url,
  COALESCE(SUM(p.points_earned), 0)::INT                                 AS total_points,
  COUNT(*) FILTER (WHERE p.points_earned = 5)::INT                       AS exact_scores,
  COUNT(*) FILTER (WHERE p.points_earned >= 1)::INT                      AS correct_results,
  COUNT(*) FILTER (WHERE p.points_earned IS NOT NULL)::INT               AS total_scored,
  COUNT(*)::INT                                                           AS total_predictions,
  RANK() OVER (
    PARTITION BY p.league_id
    ORDER BY COALESCE(SUM(p.points_earned), 0) DESC,
             COUNT(*) FILTER (WHERE p.points_earned = 5) DESC
  )::INT AS rank
FROM public.predictions p
JOIN public.users u ON u.id = p.user_id
GROUP BY p.league_id, p.user_id, u.full_name, u.avatar_url;

COMMENT ON VIEW public.league_rankings IS
  'Ranking dos participantes por liga, ordenado por pontos e placares exatos como critério de desempate';


-- ============================================================
-- 9. FUNCTION: Auto-criar perfil ao registrar (auth hook)
-- ============================================================
-- Quando alguém se cadastra via Supabase Auth, cria automaticamente
-- o registro na tabela public.users.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions    ENABLE ROW LEVEL SECURITY;

-- ─── USERS ─────────────────────────────────────────────────
-- Qualquer autenticado pode ver perfis
CREATE POLICY "users_select_authenticated"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Usuário só edita o próprio perfil
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── LEAGUES ───────────────────────────────────────────────
-- Qualquer autenticado pode ver ligas (para buscar por código)
CREATE POLICY "leagues_select_authenticated"
  ON public.leagues FOR SELECT
  TO authenticated
  USING (true);

-- Qualquer autenticado pode criar liga (vira admin)
CREATE POLICY "leagues_insert_authenticated"
  ON public.leagues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = admin_id);

-- Só o admin da liga pode editar
CREATE POLICY "leagues_update_admin"
  ON public.leagues FOR UPDATE
  TO authenticated
  USING (auth.uid() = admin_id)
  WITH CHECK (auth.uid() = admin_id);

-- Só o admin pode deletar
CREATE POLICY "leagues_delete_admin"
  ON public.leagues FOR DELETE
  TO authenticated
  USING (auth.uid() = admin_id);

-- ─── LEAGUE_MEMBERS ───────────────────────────────────────
-- Membros podem ver quem está na mesma liga
CREATE POLICY "league_members_select"
  ON public.league_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      WHERE lm.league_id = league_members.league_id
        AND lm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.leagues l
      WHERE l.id = league_members.league_id
        AND l.admin_id = auth.uid()
    )
  );

-- Qualquer autenticado pode entrar numa liga
CREATE POLICY "league_members_insert"
  ON public.league_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin da liga pode atualizar status de pagamento
CREATE POLICY "league_members_update_admin"
  ON public.league_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leagues l
      WHERE l.id = league_members.league_id
        AND l.admin_id = auth.uid()
    )
  );

-- Membro pode sair (deletar a si mesmo) OU admin pode remover
CREATE POLICY "league_members_delete"
  ON public.league_members FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.leagues l
      WHERE l.id = league_members.league_id
        AND l.admin_id = auth.uid()
    )
  );

-- ─── MATCHES ──────────────────────────────────────────────
-- Qualquer autenticado pode ver partidas
CREATE POLICY "matches_select_authenticated"
  ON public.matches FOR SELECT
  TO authenticated
  USING (true);

-- Partidas só são criadas/atualizadas pelo service_role (cron job).
-- Não criamos policies de INSERT/UPDATE para authenticated.

-- ─── PREDICTIONS ──────────────────────────────────────────
-- Ver palpites: só de ligas onde o usuário participa
CREATE POLICY "predictions_select_league_member"
  ON public.predictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      WHERE lm.league_id = predictions.league_id
        AND lm.user_id = auth.uid()
    )
  );

-- Criar palpite: usuário autenticado, para si mesmo,
-- apenas se a partida ainda não começou
CREATE POLICY "predictions_insert_own"
  ON public.predictions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.league_members lm
      WHERE lm.league_id = predictions.league_id
        AND lm.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = predictions.match_id
        AND m.status = 'SCHEDULED'
    )
  );

-- Atualizar palpite: só o dono, e só antes do jogo começar
CREATE POLICY "predictions_update_own"
  ON public.predictions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = predictions.match_id
        AND m.status = 'SCHEDULED'
    )
  );

-- Deletar palpite: só o dono, e só antes do jogo começar
CREATE POLICY "predictions_delete_own"
  ON public.predictions FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = predictions.match_id
        AND m.status = 'SCHEDULED'
    )
  );


-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
-- Para testar a trigger, rode:
--
-- UPDATE public.matches
-- SET home_score = 2, away_score = 1, status = 'FINISHED'
-- WHERE id = '<match_id>';
--
-- E confira: SELECT * FROM public.predictions WHERE match_id = '<match_id>';
-- ============================================================

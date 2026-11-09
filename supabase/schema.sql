-- ============================================================
-- StatPitch Academy & Court SaaS — Schema Completo para Supabase
-- Gestão de Escolinha de Futebol e Locação de Quadra + Stripe
-- ============================================================
-- Execute este script no SQL Editor do Supabase (Dashboard > SQL Editor)
-- ============================================================

-- 0. Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Remover tabelas legadas caso existam no projeto Supabase
DROP VIEW IF EXISTS public.league_rankings CASCADE;
DROP TABLE IF EXISTS public.predictions CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.league_members CASCADE;
DROP TABLE IF EXISTS public.leagues CASCADE;

-- ============================================================
-- 1. Tabela: classes (Turmas da Escolinha)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  min_age           INT NOT NULL CHECK (min_age >= 3),
  max_age           INT NOT NULL CHECK (max_age >= min_age),
  coach_name        TEXT NOT NULL,
  days_of_week      TEXT[] NOT NULL DEFAULT '{}',
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  monthly_fee_cents INT NOT NULL DEFAULT 15000 CHECK (monthly_fee_cents >= 0),
  max_students      INT NOT NULL DEFAULT 25 CHECK (max_students > 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.classes IS 'Turmas e categorias da escolinha de futebol (bloqueiam automaticamente a agenda da quadra nos dias/horários definidos)';

CREATE INDEX IF NOT EXISTS idx_classes_age_range ON public.classes(min_age, max_age);

-- ============================================================
-- 2. Tabela: students (Alunos e Dados do Responsável)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.students (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name          TEXT NOT NULL,
  birth_date         DATE NOT NULL,
  position           TEXT NOT NULL CHECK (position IN ('Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante')),
  dominant_foot      TEXT NOT NULL DEFAULT 'Direito' CHECK (dominant_foot IN ('Direito', 'Esquerdo', 'Ambidestro')),
  health_notes       TEXT DEFAULT '',
  guardian_name      TEXT NOT NULL,
  guardian_phone     TEXT NOT NULL,
  guardian_email     TEXT DEFAULT '',
  guardian_cpf       TEXT NOT NULL,
  billing_day        INT NOT NULL DEFAULT 10 CHECK (billing_day IN (5, 10, 15, 20)),
  class_id           UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  stripe_customer_id TEXT,
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.students IS 'Alunos matriculados na escolinha e dados financeiros do responsável';

CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_status   ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_students_position ON public.students(position);

-- ============================================================
-- 3. Tabela: student_payments (Calendário de Pagamento dos Alunos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_payments (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id               UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  reference_month          INT NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
  reference_year           INT NOT NULL CHECK (reference_year >= 2024),
  due_date                 DATE NOT NULL,
  amount_cents             INT NOT NULL CHECK (amount_cents >= 0),
  status                   TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  stripe_checkout_url      TEXT,
  stripe_payment_intent_id TEXT,
  paid_at                  TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(student_id, reference_month, reference_year)
);

COMMENT ON TABLE public.student_payments IS 'Mensalidades e cobranças dos alunos da escolinha sincronizadas com a Stripe';

CREATE INDEX IF NOT EXISTS idx_student_payments_student ON public.student_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_payments_period  ON public.student_payments(reference_year, reference_month);
CREATE INDEX IF NOT EXISTS idx_student_payments_status  ON public.student_payments(status);
CREATE INDEX IF NOT EXISTS idx_student_payments_due     ON public.student_payments(due_date);

-- ============================================================
-- 4. Tabela: court_bookings (Aluguel de Horários da Quadra)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.court_bookings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name         TEXT NOT NULL,
  client_phone        TEXT NOT NULL,
  booking_date        DATE NOT NULL,
  start_time          TIME NOT NULL,
  end_time            TIME NOT NULL,
  booking_type        TEXT NOT NULL DEFAULT 'avulso' CHECK (booking_type IN ('avulso', 'mensalista', 'aula_escolinha')),
  price_cents         INT NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  payment_status      TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'cancelled')),
  stripe_checkout_url TEXT,
  notes               TEXT DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.court_bookings IS 'Reservas e locações avulsas/mensalistas da quadra';

CREATE INDEX IF NOT EXISTS idx_court_bookings_date   ON public.court_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_court_bookings_status ON public.court_bookings(payment_status);

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS) — MVP Policies
-- ============================================================
ALTER TABLE public.classes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_bookings   ENABLE ROW LEVEL SECURITY;

-- Policies para classes (leitura pública para /matricula, escrita para painel)
DROP POLICY IF EXISTS "classes_all_access" ON public.classes;
CREATE POLICY "classes_all_access"
  ON public.classes FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Policies para students (matrícula pública sem login + gestão no painel)
DROP POLICY IF EXISTS "students_all_access" ON public.students;
CREATE POLICY "students_all_access"
  ON public.students FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Policies para student_payments (geração na matrícula + painel + webhook)
DROP POLICY IF EXISTS "student_payments_all_access" ON public.student_payments;
CREATE POLICY "student_payments_all_access"
  ON public.student_payments FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Policies para court_bookings (gestão de quadra e checkout)
DROP POLICY IF EXISTS "court_bookings_all_access" ON public.court_bookings;
CREATE POLICY "court_bookings_all_access"
  ON public.court_bookings FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 6. SEED INICIAL DE TURMAS (OPCIONAL PARA TESTE IMEDIATO)
-- ============================================================
INSERT INTO public.classes (id, name, min_age, max_age, coach_name, days_of_week, start_time, end_time, monthly_fee_cents, max_students)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'Sub-7 Iniciação Manhã', 5, 7, 'Prof. Carlos Eduardo', ARRAY['Terça', 'Quinta'], '09:00', '10:00', 14000, 20),
  ('11111111-1111-4111-8111-111111111102', 'Sub-9 Base Manhã', 8, 9, 'Prof. Carlos Eduardo', ARRAY['Segunda', 'Quarta', 'Sexta'], '09:00', '10:00', 16000, 22),
  ('11111111-1111-4111-8111-111111111103', 'Sub-11 Formação Tarde', 10, 11, 'Prof. Marcos Vinícius', ARRAY['Terça', 'Quinta'], '18:00', '19:00', 17500, 24),
  ('11111111-1111-4111-8111-111111111104', 'Sub-13 Competição Noite', 12, 13, 'Prof. Marcos Vinícius', ARRAY['Segunda', 'Quarta', 'Sexta'], '18:00', '19:00', 19000, 25),
  ('11111111-1111-4111-8111-111111111105', 'Sub-15 Alto Rendimento', 14, 15, 'Prof. Renato Gaúcho Jr.', ARRAY['Terça', 'Quinta'], '19:00', '20:00', 21000, 25)
ON CONFLICT (id) DO NOTHING;

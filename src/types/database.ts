// ============================================================
// StatPitch Academy & Court — Database Types (Supabase)
// ============================================================

export type PlayerPosition =
  | "Goleiro"
  | "Zagueiro"
  | "Lateral"
  | "Volante"
  | "Meia"
  | "Atacante";

export type DominantFoot = "Direito" | "Esquerdo" | "Ambidestro";

export type StudentStatus = "active" | "pending" | "inactive";

export type BillingDay = 5 | 10 | 15 | 20;

export type StudentPaymentStatus = "paid" | "pending" | "overdue";

export type BookingType = "avulso" | "mensalista" | "aula_escolinha";

export type CourtPaymentStatus = "paid" | "pending" | "cancelled";

export type DayOfWeek =
  | "Segunda"
  | "Terça"
  | "Quarta"
  | "Quinta"
  | "Sexta"
  | "Sábado"
  | "Domingo";

export const PLAYER_POSITIONS: PlayerPosition[] = [
  "Goleiro",
  "Zagueiro",
  "Lateral",
  "Volante",
  "Meia",
  "Atacante",
];

export const DOMINANT_FEET: DominantFoot[] = [
  "Direito",
  "Esquerdo",
  "Ambidestro",
];

export const BILLING_DAYS: BillingDay[] = [5, 10, 15, 20];

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

// 1. classes (Turmas da Escolinha)
export interface SchoolClass {
  id: string;
  name: string;
  min_age: number;
  max_age: number;
  coach_name: string;
  days_of_week: string[];
  start_time: string; // HH:MM or HH:MM:SS
  end_time: string;   // HH:MM or HH:MM:SS
  monthly_fee_cents: number;
  max_students: number;
  created_at: string;
}

// 2. students (Alunos e Dados do Responsável)
export interface Student {
  id: string;
  full_name: string;
  birth_date: string; // YYYY-MM-DD
  position: PlayerPosition;
  dominant_foot: DominantFoot;
  health_notes: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  guardian_cpf: string;
  billing_day: BillingDay;
  class_id: string | null;
  stripe_customer_id: string | null;
  status: StudentStatus;
  created_at: string;
  // Relação opcional carregada via join ou lookup
  school_class?: SchoolClass | null;
}

// 3. student_payments (Calendário de Pagamento dos Alunos)
export interface StudentPayment {
  id: string;
  student_id: string;
  reference_month: number; // 1 a 12
  reference_year: number;  // ex: 2026
  due_date: string;        // YYYY-MM-DD
  amount_cents: number;
  status: StudentPaymentStatus;
  stripe_checkout_url: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  created_at: string;
  student?: Student;
}

// 4. court_bookings (Aluguel de Horários da Quadra)
export interface CourtBooking {
  id: string;
  client_name: string;
  client_phone: string;
  booking_date: string; // YYYY-MM-DD
  start_time: string;   // HH:MM or HH:MM:SS
  end_time: string;     // HH:MM or HH:MM:SS
  booking_type: BookingType;
  price_cents: number;
  payment_status: CourtPaymentStatus;
  stripe_checkout_url: string | null;
  notes: string;
  created_at: string;
}

// ============================================================
// Funções Utilitárias de Domínio
// ============================================================

export function calculateAge(birthDateStr: string, refDate = new Date()): number {
  if (!birthDateStr) return 0;
  const [year, month, day] = birthDateStr.split("-").map(Number);
  if (!year || !month || !day) return 0;
  let age = refDate.getFullYear() - year;
  const m = refDate.getMonth() + 1 - month;
  if (m < 0 || (m === 0 && refDate.getDate() < day)) {
    age--;
  }
  return Math.max(0, age);
}

export function getSubCategory(age: number): string {
  if (age <= 7) return "Sub-7";
  if (age <= 9) return "Sub-9";
  if (age <= 11) return "Sub-11";
  if (age <= 13) return "Sub-13";
  if (age <= 15) return "Sub-15";
  return "Sub-17";
}

export function formatCurrencyBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents || 0) / 100);
}

export function formatTimeShort(timeStr: string): string {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
}

export function formatPhoneWhatsApp(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

export const MONTH_NAMES_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export const MONTH_NAMES_FULL = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

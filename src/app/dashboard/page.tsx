"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  CreditCard,
  CalendarClock,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageCircle,
  GraduationCap,
  ArrowRight,
  Plus,
} from "lucide-react";
import {
  Student,
  SchoolClass,
  StudentPayment,
  CourtBooking,
  DayOfWeek,
  formatCurrencyBRL,
  formatPhoneWhatsApp,
  formatTimeShort,
} from "@/types/database";
import {
  fetchStudents,
  fetchClasses,
  fetchStudentPayments,
  fetchCourtBookings,
} from "@/lib/data-service";

const JS_DAY_TO_PT: Record<number, DayOfWeek> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [bookings, setBookings] = useState<CourtBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchStudents(),
      fetchClasses(),
      fetchStudentPayments(new Date().getFullYear()),
      fetchCourtBookings(),
    ])
      .then(([sData, cData, pData, bData]) => {
        setStudents(sData);
        setClasses(cData);
        setPayments(pData);
        setBookings(bData);
      })
      .finally(() => setLoading(false));
  }, []);

  const currentMonth = new Date().getMonth() + 1;
  const todayIso = new Date().toISOString().split("T")[0];
  const todayDayName = JS_DAY_TO_PT[new Date().getDay()];

  const classMap = useMemo(() => {
    const map = new Map<string, SchoolClass>();
    classes.forEach((c) => map.set(c.id, c));
    return map;
  }, [classes]);

  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  // KPIs
  const metrics = useMemo(() => {
    const activeStudents = students.filter((s) => s.status === "active").length;
    const pendingStudents = students.filter(
      (s) => s.status === "pending"
    ).length;

    // Receita Mensal da Escolinha (mês atual)
    const monthPayments = payments.filter(
      (p) => p.reference_month === currentMonth
    );
    const schoolPaidCents = monthPayments
      .filter((p) => p.status === "paid")
      .reduce((acc, p) => acc + p.amount_cents, 0);
    const schoolPendingOrOverdueCents = monthPayments
      .filter((p) => p.status !== "paid")
      .reduce((acc, p) => acc + p.amount_cents, 0);

    // Receita de Aluguel de Quadra
    const activeBookings = bookings.filter(
      (b) => b.payment_status !== "cancelled"
    );
    const courtPaidCents = activeBookings
      .filter((b) => b.payment_status === "paid")
      .reduce((acc, b) => acc + b.price_cents, 0);
    const courtPendingCents = activeBookings
      .filter((b) => b.payment_status === "pending")
      .reduce((acc, b) => acc + b.price_cents, 0);

    // Taxa de Ocupação Semanal (16h/dia * 7 dias = 112 slots semanais)
    let classHoursPerWeek = 0;
    classes.forEach((cls) => {
      const startH = parseInt(cls.start_time.split(":")[0], 10);
      const endH = parseInt(cls.end_time.split(":")[0], 10);
      const duration = Math.max(1, endH - startH);
      classHoursPerWeek += duration * cls.days_of_week.length;
    });

    const bookingHours = activeBookings.reduce((acc, b) => {
      const startH = parseInt(b.start_time.split(":")[0], 10);
      const endH = parseInt(b.end_time.split(":")[0], 10);
      return acc + Math.max(1, endH - startH);
    }, 0);

    const totalWeeklySlots = 16 * 7; // 112 horas (07h às 23h)
    const occupancyRate = Math.min(
      100,
      Math.round(((classHoursPerWeek + bookingHours) / totalWeeklySlots) * 100)
    );

    return {
      activeStudents,
      pendingStudents,
      schoolPaidCents,
      schoolPendingOrOverdueCents,
      courtPaidCents,
      courtPendingCents,
      classHoursPerWeek,
      bookingHours,
      occupancyRate,
    };
  }, [students, classes, payments, bookings, currentMonth]);

  // Lista de Próximos Vencimentos / Alunos em Atraso
  const dueAndOverduePayments = useMemo(() => {
    return payments
      .filter(
        (p) => p.reference_month === currentMonth && p.status !== "paid"
      )
      .sort((a, b) => {
        if (a.status === "overdue" && b.status !== "overdue") return -1;
        if (a.status !== "overdue" && b.status === "overdue") return 1;
        return a.due_date.localeCompare(b.due_date);
      });
  }, [payments, currentMonth]);

  // Agenda da Quadra de Hoje (Treinos da Escolinha de Hoje + Aluguéis de Hoje)
  const todayClasses = useMemo(
    () => classes.filter((c) => c.days_of_week.includes(todayDayName)),
    [classes, todayDayName]
  );

  const todayBookings = useMemo(
    () =>
      bookings.filter(
        (b) => b.booking_date === todayIso && b.payment_status !== "cancelled"
      ),
    [bookings, todayIso]
  );

  const kpiCards = [
    {
      label: "Total de Alunos Ativos",
      value: String(metrics.activeStudents),
      sub: `${metrics.pendingStudents} aguardando 1ª mensalidade`,
      icon: Users,
      color: "text-verde",
      bg: "bg-verde/10",
    },
    {
      label: "Receita Mensal Escolinha",
      value: formatCurrencyBRL(metrics.schoolPaidCents),
      sub: `${formatCurrencyBRL(metrics.schoolPendingOrOverdueCents)} pendente / atraso`,
      icon: CreditCard,
      color: "text-verde-light",
      bg: "bg-verde/10",
    },
    {
      label: "Receita Aluguel de Quadra",
      value: formatCurrencyBRL(
        metrics.courtPaidCents + metrics.courtPendingCents
      ),
      sub: `${formatCurrencyBRL(metrics.courtPaidCents)} pago · ${formatCurrencyBRL(metrics.courtPendingCents)} pendente`,
      icon: CalendarClock,
      color: "text-amarelo",
      bg: "bg-amarelo/10",
    },
    {
      label: "Ocupação Semanal da Quadra",
      value: `${metrics.occupancyRate}%`,
      sub: `${metrics.classHoursPerWeek}h escolinha + ${metrics.bookingHours}h locações`,
      icon: TrendingUp,
      color: "text-amarelo-light",
      bg: "bg-amarelo/10",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Topo */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">
            Visão Geral · Escolinha & Quadra
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Acompanhe em tempo real as matrículas, mensalidades Stripe e a
            ocupação da quadra.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/court"
            className="btn-secondary px-4 py-2 text-xs sm:text-sm"
          >
            <CalendarClock size={16} />
            Reservar Quadra
          </Link>
          <Link
            href="/dashboard/students"
            className="btn-primary px-4 py-2 text-xs sm:text-sm"
          >
            <Plus size={16} />
            Gerenciar Alunos
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.35 }}
            className="card p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                {stat.label}
              </span>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon size={17} className={stat.color} />
              </div>
            </div>
            <div className="font-mono text-2xl font-extrabold text-text-primary">
              {loading ? "..." : stat.value}
            </div>
            <div className="mt-1.5 text-xs text-text-secondary">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Duas Colunas: Próximos Vencimentos / Em Atraso & Aluguéis da Quadra de Hoje */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Coluna 1: Próximos Vencimentos / Alunos em Atraso */}
        <div className="card flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between border-b border-pitch-border bg-pitch-bg-alt px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <AlertTriangle size={17} className="text-amarelo" />
                  Próximos Vencimentos & Alunos em Atraso
                </h2>
                <p className="text-xs text-text-muted">
                  Cobranças pendentes ou vencidas no mês atual
                </p>
              </div>
              <Link
                href="/dashboard/payments"
                className="inline-flex items-center gap-1 text-xs font-bold text-verde hover:underline"
              >
                Ver Calendário
                <ArrowRight size={13} />
              </Link>
            </div>

            {dueAndOverduePayments.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-muted">
                Todas as mensalidades deste mês estão pagas! 🎉
              </div>
            ) : (
              <div className="divide-y divide-pitch-border">
                {dueAndOverduePayments.map((payment) => {
                  const student = studentMap.get(payment.student_id);
                  if (!student) return null;
                  const cls = student.class_id
                    ? classMap.get(student.class_id)
                    : null;
                  const waPhone = formatPhoneWhatsApp(student.guardian_phone);
                  const msg = encodeURIComponent(
                    `Olá ${student.guardian_name}, tudo bem? Passando para lembrar da mensalidade da escolinha do atleta ${student.full_name} (${formatCurrencyBRL(payment.amount_cents)}), com vencimento dia ${student.billing_day}.`
                  );

                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-text-primary">
                            {student.full_name}
                          </span>
                          {payment.status === "overdue" ? (
                            <span className="rounded-full bg-vermelho/15 px-2 py-0.5 text-[10px] font-bold text-vermelho-light">
                              Atrasado (Dia {student.billing_day})
                            </span>
                          ) : (
                            <span className="rounded-full bg-amarelo/15 px-2 py-0.5 text-[10px] font-bold text-amarelo-light">
                              Vence Dia {student.billing_day}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-text-muted">
                          Resp: {student.guardian_name} ·{" "}
                          {cls?.name || "Sem turma"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-verde">
                          {formatCurrencyBRL(payment.amount_cents)}
                        </span>
                        <a
                          href={`https://wa.me/${waPhone}?text=${msg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Cobrar via WhatsApp"
                          className="inline-flex items-center gap-1 rounded-lg bg-verde/15 px-2.5 py-1.5 text-xs font-bold text-verde transition hover:bg-verde hover:text-[#0a0f0b]"
                        >
                          <MessageCircle size={13} />
                          Cobrar
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Coluna 2: Aluguéis e Treinos da Quadra de Hoje */}
        <div className="card flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between border-b border-pitch-border bg-pitch-bg-alt px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <CalendarClock size={17} className="text-verde" />
                  Agenda da Quadra de Hoje ({todayDayName})
                </h2>
                <p className="text-xs text-text-muted">
                  Locações avulsas/mensalistas e treinos fixos do dia
                </p>
              </div>
              <Link
                href="/dashboard/court"
                className="inline-flex items-center gap-1 text-xs font-bold text-verde hover:underline"
              >
                Abrir Grade 07h–23h
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="divide-y divide-pitch-border">
              {/* Treinos de hoje */}
              {todayClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 bg-sky-500/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-sky-500/15 p-2 text-sky-400">
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-text-primary">
                        {cls.name}
                      </div>
                      <div className="text-xs text-text-muted">
                        Treino Escolinha · {cls.coach_name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-sky-400">
                      {formatTimeShort(cls.start_time)} -{" "}
                      {formatTimeShort(cls.end_time)}
                    </span>
                    <div className="text-[10px] text-sky-300/80 uppercase font-semibold">
                      Horário Bloqueado
                    </div>
                  </div>
                </div>
              ))}

              {/* Locações externas de hoje */}
              {todayBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg p-2 ${
                        booking.payment_status === "paid"
                          ? "bg-verde/15 text-verde"
                          : "bg-amarelo/15 text-amarelo-light"
                      }`}
                    >
                      {booking.payment_status === "paid" ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Clock size={16} />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-text-primary">
                        {booking.client_name}
                      </div>
                      <div className="text-xs text-text-muted">
                        Locação {booking.booking_type} · Tel:{" "}
                        {booking.client_phone}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-xs font-bold text-text-primary">
                      {formatTimeShort(booking.start_time)} -{" "}
                      {formatTimeShort(booking.end_time)}
                    </div>
                    <div className="font-mono text-xs font-semibold text-verde">
                      {formatCurrencyBRL(booking.price_cents)}
                    </div>
                  </div>
                </div>
              ))}

              {todayClasses.length === 0 && todayBookings.length === 0 && (
                <div className="p-8 text-center text-sm text-text-muted">
                  Nenhuma reserva ou treino registrado para hoje ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

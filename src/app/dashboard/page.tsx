"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  CalendarClock,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageCircle,
  Trophy,
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

    // Receita da Escolinha
    const monthPayments = payments.filter(
      (p) => p.reference_month === currentMonth
    );
    const schoolPaidCents = monthPayments
      .filter((p) => p.status === "paid")
      .reduce((acc, p) => acc + p.amount_cents, 0);
    const schoolPendingOrOverdueCents = monthPayments
      .filter((p) => p.status !== "paid")
      .reduce((acc, p) => acc + p.amount_cents, 0);

    // Receita da Quadra
    const activeBookings = bookings.filter(
      (b) => b.payment_status !== "cancelled"
    );
    const courtPaidCents = activeBookings
      .filter((b) => b.payment_status === "paid")
      .reduce((acc, b) => acc + b.price_cents, 0);
    const courtPendingCents = activeBookings
      .filter((b) => b.payment_status === "pending")
      .reduce((acc, b) => acc + b.price_cents, 0);

    // Ocupação da Quadra
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

    const totalWeeklySlots = 16 * 7; // 112 horas semanais
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

  // Lista de Próximos Vencimentos / Em Atraso
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

  // Agenda da Quadra de Hoje
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
      color: "text-emerald-700",
      bg: "bg-emerald-100",
      border: "border-emerald-200",
    },
    {
      label: "Receita Mensal da Escolinha",
      value: formatCurrencyBRL(metrics.schoolPaidCents),
      sub: `${formatCurrencyBRL(metrics.schoolPendingOrOverdueCents)} pendente / atraso`,
      icon: CreditCard,
      color: "text-emerald-700",
      bg: "bg-emerald-100",
      border: "border-emerald-200",
    },
    {
      label: "Receita Aluguel da Quadra",
      value: formatCurrencyBRL(
        metrics.courtPaidCents + metrics.courtPendingCents
      ),
      sub: `${formatCurrencyBRL(metrics.courtPaidCents)} pago · ${formatCurrencyBRL(metrics.courtPendingCents)} pendente`,
      icon: CalendarClock,
      color: "text-amber-700",
      bg: "bg-amber-100",
      border: "border-amber-200",
    },
    {
      label: "Taxa de Ocupação da Quadra",
      value: `${metrics.occupancyRate}%`,
      sub: `${metrics.classHoursPerWeek}h escolinha + ${metrics.bookingHours}h locações`,
      icon: TrendingUp,
      color: "text-indigo-700",
      bg: "bg-indigo-100",
      border: "border-indigo-200",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-[family-name:var(--font-montserrat)] text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Painel Geral · Escolinha & Quadra
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Acompanhe o fluxo financeiro em tempo real e a ocupação da grade
            esportiva.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/quadra"
            className="btn-secondary !text-xs sm:!text-sm"
          >
            <CalendarClock size={16} />
            <span>Reservar Horário</span>
          </Link>
          <Link
            href="/dashboard/alunos"
            className="btn-primary !text-xs sm:!text-sm"
          >
            <Plus size={16} />
            <span>Cadastrar Aluno</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards em Liquid Glass */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((stat) => (
          <div
            key={stat.label}
            className="card p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
                {stat.label}
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg} ${stat.color} shadow-2xs`}
              >
                <stat.icon size={18} />
              </div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-montserrat)] text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {loading ? "..." : stat.value}
              </div>
              <div className="mt-1 text-xs text-slate-500 font-medium">
                {stat.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Duas Colunas: Vencimentos/Atrasos & Quadra de Hoje */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Coluna 1: Próximos Vencimentos & Alunos em Atraso */}
        <div className="card overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/60 px-5 py-4">
              <div>
                <h2 className="font-[family-name:var(--font-montserrat)] text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-600" />
                  Próximos Vencimentos & Atrasos
                </h2>
                <p className="text-xs text-slate-500">
                  Cobranças pendentes de conciliação PIX neste mês
                </p>
              </div>
              <Link
                href="/dashboard/financeiro"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                <span>Ver Tudo</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {dueAndOverduePayments.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Todas as mensalidades do mês estão em dia! 🎉
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {dueAndOverduePayments.slice(0, 6).map((payment) => {
                  const student = studentMap.get(payment.student_id);
                  if (!student) return null;
                  const cls = student.class_id
                    ? classMap.get(student.class_id)
                    : null;
                  const waPhone = formatPhoneWhatsApp(student.guardian_phone);
                  const msg = encodeURIComponent(
                    `Olá ${student.guardian_name}! Passando para lembrar da mensalidade da escolinha do atleta ${student.full_name} (${formatCurrencyBRL(payment.amount_cents)}), com vencimento dia ${student.billing_day}.`
                  );

                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-[family-name:var(--font-montserrat)] font-bold text-sm text-slate-900">
                            {student.full_name}
                          </span>
                          {payment.status === "overdue" ? (
                            <span className="rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                              Atrasado
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              Vence Dia {student.billing_day}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          Resp: {student.guardian_name} ·{" "}
                          <span className="text-slate-600 font-medium">
                            {cls?.name || "Sem turma"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-[family-name:var(--font-montserrat)] text-xs font-black text-emerald-700">
                          {formatCurrencyBRL(payment.amount_cents)}
                        </span>
                        <a
                          href={`https://wa.me/${waPhone}?text=${msg}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Cobrar via WhatsApp"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500 shadow-2xs"
                        >
                          <MessageCircle size={13} />
                          <span>Cobrar</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Coluna 2: Agenda da Quadra de Hoje */}
        <div className="card overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/60 px-5 py-4">
              <div>
                <h2 className="font-[family-name:var(--font-montserrat)] text-base font-bold text-slate-900 flex items-center gap-2">
                  <CalendarClock size={18} className="text-emerald-600" />
                  Agenda da Quadra de Hoje ({todayDayName})
                </h2>
                <p className="text-xs text-slate-500">
                  Treinos fixos da escolinha e aluguéis do dia
                </p>
              </div>
              <Link
                href="/dashboard/quadra"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                <span>Grade Completa</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Treinos fixos de hoje (Indigo hachurado) */}
              {todayClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 court-locked-stripe"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700 border border-indigo-200">
                      <Trophy size={16} />
                    </div>
                    <div>
                      <div className="font-[family-name:var(--font-montserrat)] font-bold text-sm text-indigo-950">
                        {cls.name}
                      </div>
                      <div className="text-xs text-indigo-700 font-medium">
                        Treino Escolinha · {cls.coach_name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-indigo-900">
                      {formatTimeShort(cls.start_time)} -{" "}
                      {formatTimeShort(cls.end_time)}
                    </span>
                    <div className="text-[10px] text-indigo-700 uppercase font-bold tracking-wider">
                      Trava Quadra
                    </div>
                  </div>
                </div>
              ))}

              {/* Locações externas de hoje */}
              {todayBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg p-2 ${
                        booking.payment_status === "paid"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-amber-100 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {booking.payment_status === "paid" ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Clock size={16} />
                      )}
                    </div>
                    <div>
                      <div className="font-[family-name:var(--font-montserrat)] font-bold text-sm text-slate-900">
                        {booking.client_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        Aluguel {booking.booking_type} · Tel:{" "}
                        {booking.client_phone}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-xs font-bold text-slate-900">
                      {formatTimeShort(booking.start_time)} -{" "}
                      {formatTimeShort(booking.end_time)}
                    </div>
                    <div className="font-[family-name:var(--font-montserrat)] text-xs font-black text-emerald-700">
                      {formatCurrencyBRL(booking.price_cents)}
                    </div>
                  </div>
                </div>
              ))}

              {todayClasses.length === 0 && todayBookings.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-500">
                  Nenhum treino ou reserva agendado para hoje ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

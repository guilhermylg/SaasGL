"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Landmark,
  Calendar,
  Grid,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageCircle,
  Copy,
  Check,
  QrCode,
  X,
  Receipt,
} from "lucide-react";
import {
  Student,
  SchoolClass,
  StudentPayment,
  StudentPaymentStatus,
  BILLING_DAYS,
  MONTH_NAMES_SHORT,
  MONTH_NAMES_FULL,
  ARENA_PIX_CONFIG,
  formatCurrencyBRL,
  formatPhoneWhatsApp,
} from "@/types/database";
import {
  fetchStudents,
  fetchClasses,
  fetchStudentPayments,
  ensureOrUpdateStudentPayment,
} from "@/lib/data-service";

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

export default function FinanceiroReconciliationPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modo de visualização e filtros
  const [viewMode, setViewMode] = useState<"due_calendar" | "annual_matrix">(
    "due_calendar"
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(CURRENT_MONTH);
  const selectedYear = CURRENT_YEAR;
  const [filterClassId, setFilterClassId] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Estado de cópia PIX e modal de conciliação
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedArenaPix, setCopiedArenaPix] = useState(false);
  const [activeCellModal, setActiveCellModal] = useState<{
    student: Student;
    month: number;
    payment: StudentPayment | null;
  } | null>(null);

  const loadAll = async () => {
    const [sData, cData, pData] = await Promise.all([
      fetchStudents(),
      fetchClasses(),
      fetchStudentPayments(selectedYear),
    ]);
    setStudents(sData);
    setClasses(cData);
    setPayments(pData);
  };

  useEffect(() => {
    Promise.all([
      fetchStudents(),
      fetchClasses(),
      fetchStudentPayments(selectedYear),
    ])
      .then(([sData, cData, pData]) => {
        setStudents(sData);
        setClasses(cData);
        setPayments(pData);
      })
      .finally(() => setLoading(false));
  }, [selectedYear]);

  const classMap = useMemo(() => {
    const map = new Map<string, SchoolClass>();
    classes.forEach((c) => map.set(c.id, c));
    return map;
  }, [classes]);

  // Mapa rápido: `${student_id}-${month}` -> StudentPayment
  const paymentLookup = useMemo(() => {
    const map = new Map<string, StudentPayment>();
    payments.forEach((p) => {
      if (p.reference_year === CURRENT_YEAR) {
        map.set(`${p.student_id}-${p.reference_month}`, p);
      }
    });
    return map;
  }, [payments]);

  const getStudentFee = (student: Student): number => {
    if (student.class_id && classMap.has(student.class_id)) {
      return classMap.get(student.class_id)!.monthly_fee_cents;
    }
    return 16000;
  };

  const getEffectivePaymentForMonth = (
    student: Student,
    month: number
  ): {
    payment: StudentPayment | null;
    status: StudentPaymentStatus;
    amountCents: number;
    dueDate: string;
  } => {
    const existing = paymentLookup.get(`${student.id}-${month}`) || null;
    const pad = (n: number) => String(n).padStart(2, "0");
    const dueDate =
      existing?.due_date ||
      `${selectedYear}-${pad(month)}-${pad(student.billing_day)}`;
    const amountCents = existing?.amount_cents || getStudentFee(student);

    if (existing) {
      return {
        payment: existing,
        status: existing.status,
        amountCents,
        dueDate,
      };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const defaultStatus: StudentPaymentStatus =
      dueDate < todayStr ? "overdue" : "pending";
    return {
      payment: null,
      status: defaultStatus,
      amountCents,
      dueDate,
    };
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (student.status === "inactive") return false;
      if (filterClassId !== "ALL" && student.class_id !== filterClassId) {
        return false;
      }
      if (filterStatus !== "ALL") {
        const { status } = getEffectivePaymentForMonth(student, selectedMonth);
        if (status !== filterStatus) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, filterClassId, filterStatus, selectedMonth, paymentLookup]);

  const monthSummary = useMemo(() => {
    let paidCents = 0;
    let pendingCents = 0;
    let overdueCents = 0;

    filteredStudents.forEach((student) => {
      const { status, amountCents } = getEffectivePaymentForMonth(
        student,
        selectedMonth
      );
      if (status === "paid") paidCents += amountCents;
      else if (status === "overdue") overdueCents += amountCents;
      else pendingCents += amountCents;
    });

    return { paidCents, pendingCents, overdueCents };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredStudents, selectedMonth, paymentLookup]);

  const handleCopyArenaPix = () => {
    navigator.clipboard.writeText(ARENA_PIX_CONFIG.pixKey);
    setCopiedArenaPix(true);
    setTimeout(() => setCopiedArenaPix(false), 2200);
  };

  const handleChargePixWhatsApp = (
    student: Student,
    month: number,
    openWhatsApp = true
  ) => {
    const key = `${student.id}-${month}`;
    const { amountCents, dueDate } = getEffectivePaymentForMonth(
      student,
      month
    );
    const formattedDue = dueDate.split("-").reverse().join("/");
    const textMessage = `Olá ${student.guardian_name}! Tudo bem?\n\nSegue o lembrete da mensalidade de *${MONTH_NAMES_FULL[month - 1]}/${selectedYear}* do atleta *${student.full_name}*:\n\n💰 Valor: *${formatCurrencyBRL(amountCents)}*\n📅 Vencimento: *${formattedDue}*\n🔑 Chave PIX: *${ARENA_PIX_CONFIG.pixKey}*\n🏦 Favorecido: ${ARENA_PIX_CONFIG.beneficiary}\n\nAssim que realizar o pagamento, por gentileza nos envie o comprovante por aqui para darmos baixa na conciliação. Obrigado! ⚽`;

    navigator.clipboard.writeText(textMessage);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2400);

    if (openWhatsApp) {
      const waPhone = formatPhoneWhatsApp(student.guardian_phone);
      window.open(
        `https://wa.me/${waPhone}?text=${encodeURIComponent(textMessage)}`,
        "_blank"
      );
    }
  };

  const handleSetPaymentStatus = async (
    student: Student,
    month: number,
    newStatus: StudentPaymentStatus,
    paymentMethod = "PIX"
  ) => {
    const { payment, amountCents, dueDate } = getEffectivePaymentForMonth(
      student,
      month
    );
    const updated = await ensureOrUpdateStudentPayment({
      paymentId: payment?.id,
      studentId: student.id,
      referenceMonth: month,
      referenceYear: selectedYear,
      dueDate,
      amountCents,
      status: newStatus,
      paymentMethod,
    });
    await loadAll();
    if (activeCellModal) {
      setActiveCellModal({
        student,
        month,
        payment: updated,
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="font-[family-name:var(--font-montserrat)] text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Landmark size={24} className="text-emerald-600" />
            Conciliação Bancária & Mensalidades
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Controle de vencimentos por dia (5, 10, 15, 20), envio de chave PIX no WhatsApp e conciliação manual de comprovantes.
          </p>
        </div>

        {/* Toggle de Visão em Liquid Glass */}
        <div className="inline-flex rounded-xl liquid-glass p-1">
          <button
            type="button"
            onClick={() => setViewMode("due_calendar")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
              viewMode === "due_calendar"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar size={14} />
            <span>Por Vencimento (Dias 5, 10, 15, 20)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("annual_matrix")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
              viewMode === "annual_matrix"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Grid size={14} />
            <span>Matriz Anual (Jan a Dez)</span>
          </button>
        </div>
      </div>

      {/* Barra Liquid Glass de Dados Bancários / PIX para Conciliação */}
      <div className="liquid-glass-emerald rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <QrCode size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Conta Oficial para Conciliação PIX
              </span>
              <span className="rounded-full bg-white/80 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-800 border border-emerald-200">
                {ARENA_PIX_CONFIG.pixKey}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              {ARENA_PIX_CONFIG.beneficiary} · {ARENA_PIX_CONFIG.bankName}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyArenaPix}
          className="btn-secondary !py-2 !px-3.5 !text-xs shrink-0"
        >
          {copiedArenaPix ? (
            <>
              <Check size={14} className="text-emerald-600" />
              <span className="text-emerald-700 font-bold">Chave PIX Copiada!</span>
            </>
          ) : (
            <>
              <Copy size={14} className="text-emerald-600" />
              <span>Copiar Chave PIX</span>
            </>
          )}
        </button>
      </div>

      {/* Filtros + KPIs do Mês Selecionado */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Filtros */}
        <div className="lg:col-span-5 card p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Mês de Referência ({selectedYear})
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 cursor-pointer"
            >
              {MONTH_NAMES_FULL.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name} / {selectedYear}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                Filtrar Turma
              </label>
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white/90 px-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">Todas as Turmas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                Status Conciliação
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white/90 px-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">Todos</option>
                <option value="paid">Conciliados (Pagos)</option>
                <option value="pending">Aguardando PIX</option>
                <option value="overdue">Em Atraso</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3 Cards de Resumo do Mês */}
        <div className="lg:col-span-7 grid gap-3 sm:grid-cols-3">
          <div className="card p-4">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>Conciliado ({MONTH_NAMES_SHORT[selectedMonth - 1]})</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={15} />
              </span>
            </div>
            <div className="mt-2 font-[family-name:var(--font-montserrat)] text-2xl font-black text-slate-900">
              {formatCurrencyBRL(monthSummary.paidCents)}
            </div>
            <div className="mt-1 text-[11px] font-medium text-emerald-700">
              Comprovantes conferidos no banco
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between text-xs font-bold text-amber-700">
              <span>Aguardando ({MONTH_NAMES_SHORT[selectedMonth - 1]})</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Clock size={15} />
              </span>
            </div>
            <div className="mt-2 font-[family-name:var(--font-montserrat)] text-2xl font-black text-slate-900">
              {formatCurrencyBRL(monthSummary.pendingCents)}
            </div>
            <div className="mt-1 text-[11px] font-medium text-amber-700">
              Dentro do prazo de vencimento
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between text-xs font-bold text-rose-700">
              <span>Inadimplente ({MONTH_NAMES_SHORT[selectedMonth - 1]})</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <AlertTriangle size={15} />
              </span>
            </div>
            <div className="mt-2 font-[family-name:var(--font-montserrat)] text-2xl font-black text-slate-900">
              {formatCurrencyBRL(monthSummary.overdueCents)}
            </div>
            <div className="mt-1 text-[11px] font-medium text-rose-700">
              Acionar responsável no WhatsApp
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-72 rounded-2xl border border-slate-200 bg-white/80 animate-pulse"
            />
          ))}
        </div>
      ) : viewMode === "due_calendar" ? (
        /* VISÃO 1: COLUNAS POR DIA DE VENCIMENTO (5, 10, 15, 20) */
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {BILLING_DAYS.map((day) => {
            const dayStudents = filteredStudents.filter(
              (s) => s.billing_day === day
            );

            return (
              <div
                key={day}
                className="flex flex-col card overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/60 px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 font-[family-name:var(--font-montserrat)] text-xs font-black text-white shadow-xs">
                      {day}
                    </span>
                    <div>
                      <h2 className="font-[family-name:var(--font-montserrat)] text-sm font-bold text-slate-900">
                        Todo Dia {day}
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        {MONTH_NAMES_FULL[selectedMonth - 1]} {selectedYear}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-700">
                    {dayStudents.length} alunos
                  </span>
                </div>

                <div className="flex-1 divide-y divide-slate-100 p-3 space-y-2.5">
                  {dayStudents.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-400">
                      Nenhum aluno neste vencimento.
                    </div>
                  ) : (
                    dayStudents.map((student) => {
                      const { status, amountCents, payment } =
                        getEffectivePaymentForMonth(student, selectedMonth);
                      const cls = student.class_id
                        ? classMap.get(student.class_id)
                        : null;
                      const key = `${student.id}-${selectedMonth}`;

                      return (
                        <div
                          key={student.id}
                          className="rounded-xl border border-slate-200/90 bg-white/90 p-3.5 space-y-3 hover:border-emerald-300 transition shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-[family-name:var(--font-montserrat)] font-bold text-slate-900 text-sm leading-snug">
                                {student.full_name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Resp: {student.guardian_name}
                              </div>
                              {cls && (
                                <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                  {cls.name}
                                </span>
                              )}
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                status === "paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : status === "overdue"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {status === "paid"
                                ? "Conciliado"
                                : status === "overdue"
                                  ? "Atrasado"
                                  : "Pendente"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                            <div>
                              <span className="font-[family-name:var(--font-montserrat)] text-sm font-black text-slate-900">
                                {formatCurrencyBRL(amountCents)}
                              </span>
                              {status === "paid" && payment?.payment_method && (
                                <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                                  {payment.payment_method}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {status !== "paid" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetPaymentStatus(
                                      student,
                                      selectedMonth,
                                      "paid",
                                      "PIX"
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-200 transition cursor-pointer"
                                  title="Dar baixa manual após conferir comprovante no banco"
                                >
                                  <CheckCircle2 size={12} />
                                  <span>Conciliar</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetPaymentStatus(
                                      student,
                                      selectedMonth,
                                      "pending"
                                    )
                                  }
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                  Reabrir
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  handleChargePixWhatsApp(
                                    student,
                                    selectedMonth,
                                    true
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 transition cursor-pointer shadow-2xs"
                                title="Enviar cobrança com Chave PIX no WhatsApp do responsável"
                              >
                                <MessageCircle size={12} />
                                <span>
                                  {copiedId === key ? "Copiado!" : "Cobrar PIX"}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISÃO 2: MATRIZ ANUAL DE MENSALIDADES (JAN A DEZ) */
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200/80 bg-white/60 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-[family-name:var(--font-montserrat)] text-sm font-bold text-slate-900">
                Matriz Anual de Conciliação Bancária ({selectedYear})
              </h2>
              <p className="text-xs text-slate-500">
                Clique em qualquer mês para dar baixa manual (PIX, Dinheiro ou Transferência) ou enviar lembrete no WhatsApp.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-emerald-800">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Conciliado
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-800">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Pendente
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-800">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                Atrasado
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase text-slate-600">
                  <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 min-w-[210px]">
                    Atleta / Responsável
                  </th>
                  <th className="px-3 py-3 text-center">Venc.</th>
                  {MONTH_NAMES_SHORT.map((mName, idx) => (
                    <th
                      key={mName}
                      className={`px-2 py-3 text-center min-w-[68px] ${
                        idx + 1 === selectedMonth
                          ? "bg-emerald-50/90 text-emerald-800"
                          : ""
                      }`}
                    >
                      {mName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-white/80 transition-colors"
                  >
                    <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-xs px-4 py-3 font-medium text-slate-900 border-r border-slate-100">
                      <div className="font-[family-name:var(--font-montserrat)] font-bold text-slate-900">
                        {student.full_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {student.guardian_name}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-slate-600">
                      Dia {student.billing_day}
                    </td>
                    {MONTH_NAMES_SHORT.map((_, idx) => {
                      const monthNum = idx + 1;
                      const { payment, status } = getEffectivePaymentForMonth(
                        student,
                        monthNum
                      );

                      return (
                        <td
                          key={monthNum}
                          className={`p-1.5 text-center ${
                            monthNum === selectedMonth ? "bg-emerald-50/40" : ""
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setActiveCellModal({
                                student,
                                month: monthNum,
                                payment,
                              })
                            }
                            className={`w-full rounded-lg py-1.5 px-1 text-[10px] font-bold uppercase transition cursor-pointer ${
                              status === "paid"
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : status === "overdue"
                                  ? "bg-rose-100 text-rose-800 hover:bg-rose-200"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            }`}
                          >
                            {status === "paid"
                              ? "Pago"
                              : status === "overdue"
                                ? "Atraso"
                                : "Pend."}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Liquid Glass de Conciliação Bancária Manual */}
      {activeCellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl liquid-glass p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <span className="font-mono text-xs font-bold uppercase text-emerald-700">
                  Conciliação · {MONTH_NAMES_FULL[activeCellModal.month - 1]} / {selectedYear}
                </span>
                <h3 className="font-[family-name:var(--font-montserrat)] text-lg font-bold text-slate-900">
                  {activeCellModal.student.full_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCellModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {(() => {
              const { status, amountCents, dueDate, payment } =
                getEffectivePaymentForMonth(
                  activeCellModal.student,
                  activeCellModal.month
                );
              const key = `${activeCellModal.student.id}-${activeCellModal.month}`;

              return (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200/90 bg-white/80 p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Responsável:</span>
                      <span className="font-semibold text-slate-900">
                        {activeCellModal.student.guardian_name} (
                        {activeCellModal.student.guardian_phone})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Vencimento:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {dueDate.split("-").reverse().join("/")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Valor Mensal:</span>
                      <span className="font-[family-name:var(--font-montserrat)] font-black text-emerald-700">
                        {formatCurrencyBRL(amountCents)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Status de Caixa:</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-bold uppercase text-[11px] ${
                          status === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : status === "overdue"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {status === "paid"
                          ? `Conciliado (${payment?.payment_method || "PIX"})`
                          : status === "overdue"
                            ? "Atrasado"
                            : "Pendente"}
                      </span>
                    </div>
                  </div>

                  {/* Ações de Cobrança Manual via PIX + WhatsApp */}
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleChargePixWhatsApp(
                          activeCellModal.student,
                          activeCellModal.month,
                          true
                        )
                      }
                      className="btn-primary w-full !text-xs !py-2.5 shadow-sm"
                    >
                      <MessageCircle size={15} />
                      <span>Enviar Chave PIX & Cobrar no WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleChargePixWhatsApp(
                          activeCellModal.student,
                          activeCellModal.month,
                          false
                        )
                      }
                      className="btn-secondary w-full !text-xs !py-2"
                    >
                      {copiedId === key ? (
                        <>
                          <Check size={14} className="text-emerald-600" />
                          <span>Mensagem PIX Copiada!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copiar Mensagem com Chave PIX</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Baixa de Conciliação Bancária Manual */}
                  <div className="border-t border-slate-200/80 pt-3">
                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                      Dar Baixa Manual (Meio de Recebimento):
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {["PIX", "Transferência", "Dinheiro"].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() =>
                            handleSetPaymentStatus(
                              activeCellModal.student,
                              activeCellModal.month,
                              "paid",
                              method
                            )
                          }
                          className={`rounded-xl border py-2 text-xs font-bold cursor-pointer transition ${
                            status === "paid" &&
                            (payment?.payment_method || "PIX") === method
                              ? "border-emerald-600 bg-emerald-100 text-emerald-800 shadow-2xs"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-emerald-50"
                          }`}
                        >
                          ✓ {method}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleSetPaymentStatus(
                            activeCellModal.student,
                            activeCellModal.month,
                            "pending"
                          )
                        }
                        className={`rounded-xl border py-2 text-xs font-bold cursor-pointer transition ${
                          status === "pending"
                            ? "border-amber-500 bg-amber-100 text-amber-800"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Marcar Pendente
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSetPaymentStatus(
                            activeCellModal.student,
                            activeCellModal.month,
                            "overdue"
                          )
                        }
                        className={`rounded-xl border py-2 text-xs font-bold cursor-pointer transition ${
                          status === "overdue"
                            ? "border-rose-500 bg-rose-100 text-rose-800"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Marcar Atrasado
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Rodapé de Conciliação Bancária */}
      <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-slate-600">
          <Receipt size={18} className="text-emerald-600 shrink-0" />
          <span>
            <strong>Modo de Conciliação Bancária Manual:</strong> Confira o extrato PIX do banco e clique em{" "}
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-800">
              Conciliar
            </span>{" "}
            para dar baixa imediata e ativar o aluno no sistema.
          </span>
        </div>
      </div>
    </div>
  );
}

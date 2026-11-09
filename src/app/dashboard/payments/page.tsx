"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Calendar,
  Grid,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  X,
} from "lucide-react";
import {
  Student,
  SchoolClass,
  StudentPayment,
  StudentPaymentStatus,
  BILLING_DAYS,
  MONTH_NAMES_SHORT,
  MONTH_NAMES_FULL,
  formatCurrencyBRL,
  formatPhoneWhatsApp,
} from "@/types/database";
import {
  fetchStudents,
  fetchClasses,
  fetchStudentPayments,
  ensureOrUpdateStudentPayment,
  requestStripeCheckoutLink,
} from "@/lib/data-service";

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

export default function PaymentsCalendarPage() {
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

  // Estado de geração Stripe / modal de célula da matriz
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
      if (p.reference_year === selectedYear) {
        map.set(`${p.student_id}-${p.reference_month}`, p);
      }
    });
    return map;
  }, [payments, selectedYear]);

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

    // Caso ainda não tenha registro salvo naquele mês, calcula status padrão
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

  // Filtra alunos conforme turma e status no mês selecionado
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

  // Totais do mês selecionado
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

  // Gera link Stripe e abre WhatsApp do responsável
  const handleStripeAndWhatsApp = async (
    student: Student,
    month: number,
    openWhatsApp = true
  ) => {
    const key = `${student.id}-${month}`;
    setGeneratingKey(key);
    try {
      const { payment, status, amountCents, dueDate } =
        getEffectivePaymentForMonth(student, month);

      // Garante que o registro exista em student_payments
      const ensured = await ensureOrUpdateStudentPayment({
        paymentId: payment?.id,
        studentId: student.id,
        referenceMonth: month,
        referenceYear: selectedYear,
        dueDate,
        amountCents,
        status: status === "paid" ? "paid" : status,
      });

      let checkoutUrl = ensured.stripe_checkout_url;
      if (!checkoutUrl) {
        const cls = student.class_id ? classMap.get(student.class_id) : null;
        const res = await requestStripeCheckoutLink({
          type: "student_payment",
          recordId: ensured.id,
          studentId: student.id,
          title: `Mensalidade ${MONTH_NAMES_FULL[month - 1]}/${selectedYear} — ${student.full_name}`,
          description: cls
            ? `Turma: ${cls.name}`
            : "Mensalidade Escolinha de Futebol",
          amountCents,
          customerEmail: student.guardian_email || undefined,
          customerName: student.guardian_name,
        });
        checkoutUrl = res.url;

        await ensureOrUpdateStudentPayment({
          paymentId: ensured.id,
          studentId: student.id,
          referenceMonth: month,
          referenceYear: selectedYear,
          dueDate,
          amountCents,
          status: ensured.status,
          stripeCheckoutUrl: checkoutUrl,
        });
      }

      await loadAll();

      if (checkoutUrl) {
        navigator.clipboard.writeText(checkoutUrl);
        setCopiedId(key);
        setTimeout(() => setCopiedId(null), 2500);

        if (openWhatsApp) {
          const waPhone = formatPhoneWhatsApp(student.guardian_phone);
          const msg = encodeURIComponent(
            `Olá ${student.guardian_name}! Segue o link da mensalidade de ${MONTH_NAMES_FULL[month - 1]}/${selectedYear} do atleta ${student.full_name} (${formatCurrencyBRL(amountCents)}), com vencimento em ${dueDate.split("-").reverse().join("/")}:\n\n${checkoutUrl}`
          );
          window.open(`https://wa.me/${waPhone}?text=${msg}`, "_blank");
        }
      }
    } finally {
      setGeneratingKey(null);
    }
  };

  const handleSetPaymentStatus = async (
    student: Student,
    month: number,
    newStatus: StudentPaymentStatus
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
          <h1 className="text-2xl font-extrabold text-text-primary flex items-center gap-2.5">
            <CreditCard size={24} className="text-verde" />
            Calendário de Mensalidades + Stripe
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Acompanhe vencimentos nos dias 5, 10, 15 e 20 ou na Matriz Anual
            (Jan–Dez) e envie links de pagamento Stripe via WhatsApp.
          </p>
        </div>

        {/* Seletor de Visão */}
        <div className="inline-flex rounded-xl border border-pitch-border bg-pitch-surface p-1">
          <button
            type="button"
            onClick={() => setViewMode("due_calendar")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
              viewMode === "due_calendar"
                ? "bg-verde text-[#0a0f0b]"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Calendar size={14} />
            Calendário por Vencimento (5, 10, 15, 20)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("annual_matrix")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
              viewMode === "annual_matrix"
                ? "bg-verde text-[#0a0f0b]"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Grid size={14} />
            Matriz Anual (Jan a Dez)
          </button>
        </div>
      </div>

      {/* Resumo Financeiro do Mês + Filtros */}
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="card p-4 border-verde/30">
          <span className="text-xs font-semibold uppercase text-text-muted">
            Recebido ({MONTH_NAMES_SHORT[selectedMonth - 1]}/{selectedYear})
          </span>
          <div className="mt-1 font-mono text-2xl font-extrabold text-verde">
            {formatCurrencyBRL(monthSummary.paidCents)}
          </div>
          <span className="text-[11px] text-text-secondary">
            Confirmado via Stripe / Manual
          </span>
        </div>

        <div className="card p-4 border-amarelo/30">
          <span className="text-xs font-semibold uppercase text-text-muted">
            A Receber / Pendente
          </span>
          <div className="mt-1 font-mono text-2xl font-extrabold text-amarelo-light">
            {formatCurrencyBRL(monthSummary.pendingCents)}
          </div>
          <span className="text-[11px] text-text-secondary">
            Aguardando pagamento do link
          </span>
        </div>

        <div className="card p-4 border-vermelho/30">
          <span className="text-xs font-semibold uppercase text-text-muted">
            Em Atraso (Inadimplência)
          </span>
          <div className="mt-1 font-mono text-2xl font-extrabold text-vermelho-light">
            {formatCurrencyBRL(monthSummary.overdueCents)}
          </div>
          <span className="text-[11px] text-text-secondary">
            Cobrar via botão WhatsApp
          </span>
        </div>

        {/* Filtros rápidos */}
        <div className="card p-4 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="input-pitch w-full py-1.5 text-xs"
            >
              {MONTH_NAMES_FULL.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m} {selectedYear}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-pitch w-full py-1.5 text-xs"
            >
              <option value="ALL">Todos Status</option>
              <option value="paid">Pago</option>
              <option value="pending">Pendente</option>
              <option value="overdue">Atrasado</option>
            </select>
          </div>

          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="input-pitch w-full py-1.5 text-xs"
          >
            <option value="ALL">Todas as Turmas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VISÃO 1: CALENDÁRIO POR DATA DE VENCIMENTO (DIAS 5, 10, 15, 20) */}
      {loading ? (
        <div className="card p-12 text-center text-sm text-text-muted">
          Carregando calendário financeiro...
        </div>
      ) : viewMode === "due_calendar" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {BILLING_DAYS.map((bDay) => {
            const dayStudents = filteredStudents.filter(
              (s) => s.billing_day === bDay
            );

            return (
              <div key={bDay} className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-pitch-border bg-pitch-bg-alt px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-verde/15 font-mono text-sm font-extrabold text-verde">
                      {String(bDay).padStart(2, "0")}
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-text-primary">
                        Vencimento Dia {bDay} de{" "}
                        {MONTH_NAMES_FULL[selectedMonth - 1]}
                      </h2>
                      <p className="text-[11px] text-text-muted">
                        {dayStudents.length} atleta(s) neste vencimento
                      </p>
                    </div>
                  </div>
                </div>

                {dayStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-text-muted">
                    Nenhum aluno com vencimento no dia {bDay} para este filtro.
                  </div>
                ) : (
                  <div className="divide-y divide-pitch-border">
                    {dayStudents.map((student) => {
                      const { payment, status, amountCents } =
                        getEffectivePaymentForMonth(student, selectedMonth);
                      const cls = student.class_id
                        ? classMap.get(student.class_id)
                        : null;
                      const key = `${student.id}-${selectedMonth}`;
                      const isGenerating = generatingKey === key;

                      return (
                        <div
                          key={student.id}
                          className="p-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-sm text-text-primary">
                                {student.full_name}
                              </span>
                              {status === "paid" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-verde/15 px-2.5 py-0.5 text-[11px] font-bold text-verde">
                                  <CheckCircle2 size={11} />
                                  Pago
                                </span>
                              )}
                              {status === "pending" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amarelo/15 px-2.5 py-0.5 text-[11px] font-bold text-amarelo-light">
                                  <Clock size={11} />
                                  Pendente
                                </span>
                              )}
                              {status === "overdue" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-vermelho/15 px-2.5 py-0.5 text-[11px] font-bold text-vermelho-light">
                                  <AlertTriangle size={11} />
                                  Atrasado
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-text-secondary">
                              Resp: {student.guardian_name} ·{" "}
                              <span className="text-text-muted">
                                {cls?.name || "Sem turma"}
                              </span>
                            </div>
                            <div className="font-mono text-xs font-bold text-verde">
                              {formatCurrencyBRL(amountCents)}
                            </div>
                          </div>

                          {/* Ações Stripe / Status */}
                          <div className="flex flex-wrap items-center gap-2">
                            {status !== "paid" ? (
                              <>
                                <button
                                  type="button"
                                  disabled={isGenerating}
                                  onClick={() =>
                                    handleStripeAndWhatsApp(
                                      student,
                                      selectedMonth,
                                      true
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-verde px-3 py-2 text-xs font-bold text-[#0a0f0b] transition hover:bg-verde-light cursor-pointer disabled:opacity-50"
                                >
                                  <MessageCircle size={14} />
                                  {isGenerating
                                    ? "Gerando Stripe..."
                                    : "Gerar Link Stripe / Enviar WhatsApp"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetPaymentStatus(
                                      student,
                                      selectedMonth,
                                      "paid"
                                    )
                                  }
                                  className="rounded-lg border border-pitch-border bg-pitch-bg-alt px-2.5 py-2 text-xs font-semibold text-text-secondary hover:border-verde hover:text-verde cursor-pointer"
                                >
                                  Dar Baixa
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono text-text-muted">
                                  {payment?.paid_at
                                    ? `Pago em ${new Date(payment.paid_at).toLocaleDateString("pt-BR")}`
                                    : "Quitado"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetPaymentStatus(
                                      student,
                                      selectedMonth,
                                      "pending"
                                    )
                                  }
                                  className="text-[11px] text-text-muted underline hover:text-text-primary cursor-pointer"
                                >
                                  Reabrir
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* VISÃO 2: MATRIZ ANUAL DE PAGAMENTOS (JAN A DEZ) */
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-pitch-border bg-pitch-bg-alt px-5 py-3.5">
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                Matriz Anual de Mensalidades ({selectedYear})
              </h2>
              <p className="text-xs text-text-muted">
                Clique em qualquer mês para gerar cobrança Stripe, enviar no
                WhatsApp ou atualizar status.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-verde font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-verde" /> Pago
              </span>
              <span className="inline-flex items-center gap-1 text-amarelo-light font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-amarelo" />{" "}
                Pendente
              </span>
              <span className="inline-flex items-center gap-1 text-vermelho-light font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-vermelho" />{" "}
                Atrasado
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-pitch-border bg-pitch-bg-alt/60 text-text-muted">
                  <th className="sticky left-0 z-10 bg-pitch-bg-alt px-4 py-3 font-bold">
                    Atleta / Turma
                  </th>
                  <th className="px-3 py-3 font-bold text-center">Venc.</th>
                  {MONTH_NAMES_SHORT.map((mName, idx) => (
                    <th
                      key={mName}
                      className={`px-2.5 py-3 text-center font-mono font-bold ${
                        idx + 1 === CURRENT_MONTH
                          ? "text-verde bg-verde/5"
                          : "text-text-secondary"
                      }`}
                    >
                      {mName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-pitch-border">
                {filteredStudents.map((student) => {
                  const cls = student.class_id
                    ? classMap.get(student.class_id)
                    : null;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-pitch-surface-hover/60"
                    >
                      <td className="sticky left-0 z-10 bg-pitch-surface px-4 py-3">
                        <div className="font-bold text-text-primary">
                          {student.full_name}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {cls?.name || "Sem turma"} ·{" "}
                          {formatCurrencyBRL(getStudentFee(student))}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-text-secondary">
                        Dia {student.billing_day}
                      </td>
                      {MONTH_NAMES_SHORT.map((_, idx) => {
                        const m = idx + 1;
                        const { payment, status } = getEffectivePaymentForMonth(
                          student,
                          m
                        );

                        return (
                          <td key={m} className="px-1.5 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveCellModal({
                                  student,
                                  month: m,
                                  payment,
                                })
                              }
                              className={`w-full rounded-md px-2 py-1.5 font-mono text-[11px] font-bold transition cursor-pointer ${
                                status === "paid"
                                  ? "bg-verde/15 text-verde border border-verde/30 hover:bg-verde/25"
                                  : status === "overdue"
                                    ? "bg-vermelho/15 text-vermelho-light border border-vermelho/30 hover:bg-vermelho/25"
                                    : "bg-amarelo/15 text-amarelo-light border border-amarelo/30 hover:bg-amarelo/25"
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalhe da Mensalidade (ao clicar na célula da Matriz Anual) */}
      {activeCellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="card w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-pitch-border pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-verde">
                  {MONTH_NAMES_FULL[activeCellModal.month - 1]} / {selectedYear}
                </span>
                <h3 className="text-lg font-bold text-text-primary">
                  {activeCellModal.student.full_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCellModal(null)}
                className="rounded-lg p-1 text-text-muted hover:text-text-primary cursor-pointer"
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
                  <div className="rounded-xl border border-pitch-border bg-pitch-bg-alt p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Responsável:</span>
                      <span className="font-semibold text-text-primary">
                        {activeCellModal.student.guardian_name} (
                        {activeCellModal.student.guardian_phone})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Data Vencimento:</span>
                      <span className="font-mono text-text-primary">
                        {dueDate.split("-").reverse().join("/")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Valor:</span>
                      <span className="font-mono font-bold text-verde">
                        {formatCurrencyBRL(amountCents)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Status Atual:</span>
                      <span className="font-bold uppercase text-text-primary">
                        {status === "paid"
                          ? "Pago"
                          : status === "overdue"
                            ? "Atrasado"
                            : "Pendente"}
                      </span>
                    </div>
                  </div>

                  {/* Ações Stripe + WhatsApp */}
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      disabled={generatingKey === key}
                      onClick={() =>
                        handleStripeAndWhatsApp(
                          activeCellModal.student,
                          activeCellModal.month,
                          true
                        )
                      }
                      className="btn-primary w-full py-2.5 text-xs"
                    >
                      <MessageCircle size={15} />
                      {generatingKey === key
                        ? "Gerando Checkout Stripe..."
                        : "Gerar Link Stripe & Enviar no WhatsApp"}
                    </button>

                    <button
                      type="button"
                      disabled={generatingKey === key}
                      onClick={() =>
                        handleStripeAndWhatsApp(
                          activeCellModal.student,
                          activeCellModal.month,
                          false
                        )
                      }
                      className="btn-secondary w-full py-2 text-xs"
                    >
                      {copiedId === key ? (
                        <>
                          <Check size={14} className="text-verde" />
                          Link Stripe Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Apenas Gerar e Copiar Link Stripe
                        </>
                      )}
                    </button>

                    {payment?.stripe_checkout_url && (
                      <a
                        href={payment.stripe_checkout_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 text-xs font-semibold text-verde hover:underline pt-1"
                      >
                        Abrir Link Stripe Gerado <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {/* Alterar Status Manualmente */}
                  <div className="border-t border-pitch-border pt-3">
                    <span className="mb-2 block text-[11px] font-semibold uppercase text-text-muted">
                      Alterar Status Manualmente:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleSetPaymentStatus(
                            activeCellModal.student,
                            activeCellModal.month,
                            "paid"
                          )
                        }
                        className={`rounded-lg border py-2 text-xs font-bold cursor-pointer ${
                          status === "paid"
                            ? "border-verde bg-verde/20 text-verde"
                            : "border-pitch-border text-text-secondary"
                        }`}
                      >
                        Pago
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleSetPaymentStatus(
                            activeCellModal.student,
                            activeCellModal.month,
                            "pending"
                          )
                        }
                        className={`rounded-lg border py-2 text-xs font-bold cursor-pointer ${
                          status === "pending"
                            ? "border-amarelo bg-amarelo/20 text-amarelo-light"
                            : "border-pitch-border text-text-secondary"
                        }`}
                      >
                        Pendente
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
                        className={`rounded-lg border py-2 text-xs font-bold cursor-pointer ${
                          status === "overdue"
                            ? "border-vermelho bg-vermelho/20 text-vermelho-light"
                            : "border-pitch-border text-text-secondary"
                        }`}
                      >
                        Atrasado
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Rodapé informativo do Webhook */}
      <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-pitch-border bg-pitch-bg-alt">
        <div className="flex items-center gap-2.5 text-xs text-text-secondary">
          <Sparkles size={16} className="text-verde shrink-0" />
          <span>
            Webhook configurado em{" "}
            <code className="rounded bg-pitch-surface px-1.5 py-0.5 font-mono text-verde">
              POST /api/stripe/webhook
            </code>{" "}
            escutando <code>checkout.session.completed</code> para baixa
            automática em <code>student_payments</code>.
          </span>
        </div>
      </div>
    </div>
  );
}

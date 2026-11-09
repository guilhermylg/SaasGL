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
  ShieldCheck,
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
            `Olá ${student.guardian_name}! Segue a cobrança da mensalidade (${MONTH_NAMES_FULL[month - 1]}/${selectedYear}) do atleta ${student.full_name} (${formatCurrencyBRL(amountCents)}), com vencimento em ${dueDate.split("-").reverse().join("/")}:\n\n${checkoutUrl}`
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
          <h1 className="font-[family-name:var(--font-montserrat)] text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <CreditCard size={24} className="text-emerald-600" />
            Calendário Financeiro & Mensalidades Stripe
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Acompanhe vencimentos por dia (5, 10, 15, 20) ou na Matriz Anual e
            envie cobranças Stripe direto no WhatsApp dos pais.
          </p>
        </div>

        {/* Toggle de Visão */}
        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode("due_calendar")}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
              viewMode === "due_calendar"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar size={14} />
            <span>Por Vencimento (Dias 5, 10, 15, 20)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("annual_matrix")}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
              viewMode === "annual_matrix"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Grid size={14} />
            <span>Matriz Anual (Jan a Dez)</span>
          </button>
        </div>
      </div>

      {/* Resumo Financeiro com as cores semânticas */}
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 font-mono">
            Recebido ({MONTH_NAMES_SHORT[selectedMonth - 1]}/{selectedYear})
          </span>
          <div className="mt-1 font-[family-name:var(--font-montserrat)] text-2xl font-black text-emerald-700">
            {formatCurrencyBRL(monthSummary.paidCents)}
          </div>
          <span className="text-[11px] text-emerald-800 font-medium">
            Confirmado via Webhook / Baixa
          </span>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono">
            A Receber (Pendente)
          </span>
          <div className="mt-1 font-[family-name:var(--font-montserrat)] text-2xl font-black text-amber-700">
            {formatCurrencyBRL(monthSummary.pendingCents)}
          </div>
          <span className="text-[11px] text-amber-800 font-medium">
            Aguardando pagamento do link
          </span>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-800 font-mono">
            Inadimplência / Atraso
          </span>
          <div className="mt-1 font-[family-name:var(--font-montserrat)] text-2xl font-black text-rose-700">
            {formatCurrencyBRL(monthSummary.overdueCents)}
          </div>
          <span className="text-[11px] text-rose-800 font-medium">
            Cobrar via botão WhatsApp
          </span>
        </div>

        {/* Filtros Rápidos */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 cursor-pointer"
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
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 cursor-pointer"
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
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 cursor-pointer"
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

      {/* VISÃO 1: CALENDÁRIO POR VENCIMENTO (DIAS 5, 10, 15, 20) */}
      {loading ? (
        <div className="card p-12 text-center text-sm text-slate-500">
          Carregando calendário financeiro...
        </div>
      ) : viewMode === "due_calendar" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {BILLING_DAYS.map((bDay) => {
            const dayStudents = filteredStudents.filter(
              (s) => s.billing_day === bDay
            );

            return (
              <div
                key={bDay}
                className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-[family-name:var(--font-montserrat)] text-sm font-extrabold text-white">
                      {String(bDay).padStart(2, "0")}
                    </span>
                    <div>
                      <h2 className="font-[family-name:var(--font-montserrat)] text-sm font-bold text-slate-900">
                        Vencimento Todo Dia {bDay} de {MONTH_NAMES_FULL[selectedMonth - 1]}
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        {dayStudents.length} atleta(s) vinculados a este dia
                      </p>
                    </div>
                  </div>
                </div>

                {dayStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Nenhum aluno com vencimento no dia {bDay} para este filtro.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
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
                          className="p-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center hover:bg-slate-50/60 transition"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-[family-name:var(--font-montserrat)] font-bold text-sm text-slate-900">
                                {student.full_name}
                              </span>
                              {status === "paid" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                  <CheckCircle2 size={11} />
                                  Pago
                                </span>
                              )}
                              {status === "pending" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                                  <Clock size={11} />
                                  Pendente
                                </span>
                              )}
                              {status === "overdue" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-200 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                                  <AlertTriangle size={11} />
                                  Atrasado
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-slate-500">
                              Resp: {student.guardian_name} ·{" "}
                              <span className="text-slate-600 font-medium">
                                {cls?.name || "Sem turma"}
                              </span>
                            </div>
                            <div className="font-[family-name:var(--font-montserrat)] text-xs font-black text-emerald-700">
                              {formatCurrencyBRL(amountCents)}
                            </div>
                          </div>

                          {/* Ações Stripe / WhatsApp */}
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
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 cursor-pointer disabled:opacity-50 shadow-2xs"
                                >
                                  <MessageCircle size={14} />
                                  <span>
                                    {isGenerating
                                      ? "Gerando Stripe..."
                                      : "Link Stripe + WhatsApp"}
                                  </span>
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
                                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 cursor-pointer"
                                >
                                  Dar Baixa
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                                  {payment?.paid_at
                                    ? `Quitado em ${new Date(payment.paid_at).toLocaleDateString("pt-BR")}`
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
                                  className="text-[11px] text-slate-400 underline hover:text-slate-700 cursor-pointer"
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
        /* VISÃO 2: MATRIZ ANUAL (JAN A DEZ) */
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
            <div>
              <h2 className="font-[family-name:var(--font-montserrat)] text-sm font-bold text-slate-900">
                Matriz Anual de Mensalidades ({selectedYear})
              </h2>
              <p className="text-xs text-slate-500">
                Clique na célula para gerar cobrança Stripe, enviar WhatsApp ou
                atualizar status.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{" "}
                Pago
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-bold">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />{" "}
                Pendente
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-700 font-bold">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />{" "}
                Atrasado
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600">
                  <th className="sticky left-0 z-10 bg-slate-100 px-4 py-3 font-bold font-mono">
                    Atleta / Turma
                  </th>
                  <th className="px-3 py-3 font-bold text-center font-mono">
                    Venc.
                  </th>
                  {MONTH_NAMES_SHORT.map((mName, idx) => (
                    <th
                      key={mName}
                      className={`px-2 py-3 text-center font-mono font-bold ${
                        idx + 1 === CURRENT_MONTH
                          ? "text-emerald-700 bg-emerald-50"
                          : "text-slate-600"
                      }`}
                    >
                      {mName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const cls = student.class_id
                    ? classMap.get(student.class_id)
                    : null;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80">
                      <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-slate-100">
                        <div className="font-[family-name:var(--font-montserrat)] font-bold text-slate-900">
                          {student.full_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {cls?.name || "Sem turma"} ·{" "}
                          {formatCurrencyBRL(getStudentFee(student))}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-slate-700">
                        Dia {student.billing_day}
                      </td>
                      {MONTH_NAMES_SHORT.map((_, idx) => {
                        const m = idx + 1;
                        const { payment, status } = getEffectivePaymentForMonth(
                          student,
                          m
                        );

                        return (
                          <td key={m} className="px-1.5 py-2 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveCellModal({
                                  student,
                                  month: m,
                                  payment,
                                })
                              }
                              className={`w-full rounded-md px-1.5 py-1.5 font-mono text-[11px] font-bold transition cursor-pointer border ${
                                status === "paid"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                                  : status === "overdue"
                                    ? "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200"
                                    : "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
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

      {/* Modal Detalhe Mensalidade */}
      {activeCellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold uppercase text-emerald-600">
                  {MONTH_NAMES_FULL[activeCellModal.month - 1]} / {selectedYear}
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
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
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
                      <span className="text-slate-500">Status Atual:</span>
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
                      className="btn-primary w-full !text-xs !py-2.5 shadow-2xs"
                    >
                      <MessageCircle size={15} />
                      <span>
                        {generatingKey === key
                          ? "Gerando Checkout Stripe..."
                          : "Gerar Link Stripe & Abrir WhatsApp"}
                      </span>
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
                      className="btn-secondary w-full !text-xs !py-2"
                    >
                      {copiedId === key ? (
                        <>
                          <Check size={14} className="text-emerald-600" />
                          <span>Link Stripe Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Apenas Copiar Link Stripe</span>
                        </>
                      )}
                    </button>

                    {payment?.stripe_checkout_url && (
                      <a
                        href={payment.stripe_checkout_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline pt-1"
                      >
                        <span>Abrir Link Stripe Gerado</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {/* Alterar Status */}
                  <div className="border-t border-slate-100 pt-3">
                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
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
                        className={`rounded-lg border py-2 text-xs font-bold cursor-pointer transition ${
                          status === "paid"
                            ? "border-emerald-600 bg-emerald-100 text-emerald-800"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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
                        className={`rounded-lg border py-2 text-xs font-bold cursor-pointer transition ${
                          status === "pending"
                            ? "border-amber-500 bg-amber-100 text-amber-800"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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
                        className={`rounded-lg border py-2 text-xs font-bold cursor-pointer transition ${
                          status === "overdue"
                            ? "border-rose-500 bg-rose-100 text-rose-800"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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

      {/* Webhook Info Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 text-xs text-slate-600">
          <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
          <span>
            Webhook ativo em{" "}
            <code className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 font-mono text-emerald-700 font-bold">
              POST /api/stripe/webhook
            </code>{" "}
            escutando <code>checkout.session.completed</code> para baixa
            automática.
          </span>
        </div>
      </div>
    </div>
  );
}

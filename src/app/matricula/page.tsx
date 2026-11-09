"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  User,
  HeartPulse,
  GraduationCap,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  Phone,
  ArrowLeft,
} from "lucide-react";
import {
  SchoolClass,
  PlayerPosition,
  DominantFoot,
  BillingDay,
  PLAYER_POSITIONS,
  DOMINANT_FEET,
  BILLING_DAYS,
  calculateAge,
  getSubCategory,
  formatCurrencyBRL,
  formatTimeShort,
} from "@/types/database";
import {
  fetchClasses,
  createStudentEnrollment,
  ensureOrUpdateStudentPayment,
  requestStripeCheckoutLink,
} from "@/lib/data-service";

export default function MatriculaPublicPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  // 1. Dados do Atleta
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("2015-05-10");
  const [position, setPosition] = useState<PlayerPosition>("Meia");
  const [dominantFoot, setDominantFoot] = useState<DominantFoot>("Direito");
  const [healthNotes, setHealthNotes] = useState("");

  // 2. Turma selecionada
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [showAllClasses, setShowAllClasses] = useState(false);

  // 3. Dados do Responsável Financeiro
  const [guardianName, setGuardianName] = useState("");
  const [guardianCpf, setGuardianCpf] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [billingDay, setBillingDay] = useState<BillingDay>(10);
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Estado de submissão e confirmação
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [enrollmentResult, setEnrollmentResult] = useState<{
    studentName: string;
    className: string;
    monthlyFeeCents: number;
    billingDay: number;
    checkoutUrl: string;
    simulatedStripe: boolean;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchClasses()
      .then((data) => {
        setClasses(data);
      })
      .finally(() => setLoadingClasses(false));
  }, []);

  const athleteAge = useMemo(() => calculateAge(birthDate), [birthDate]);
  const subCategory = useMemo(
    () => (birthDate ? getSubCategory(athleteAge) : ""),
    [birthDate, athleteAge]
  );

  // Filtra turmas compatíveis com a idade calculada
  const matchingClasses = useMemo(() => {
    if (!birthDate || athleteAge <= 0) return classes;
    return classes.filter(
      (c) => athleteAge >= c.min_age && athleteAge <= c.max_age
    );
  }, [classes, birthDate, athleteAge]);

  const displayedClasses = useMemo(() => {
    if (showAllClasses || matchingClasses.length === 0) return classes;
    return matchingClasses;
  }, [showAllClasses, matchingClasses, classes]);

  const effectiveClassId = useMemo(() => {
    if (
      selectedClassId &&
      displayedClasses.some((c) => c.id === selectedClassId)
    ) {
      return selectedClassId;
    }
    if (matchingClasses.length > 0) {
      return matchingClasses[0].id;
    }
    return classes[0]?.id || "";
  }, [selectedClassId, displayedClasses, matchingClasses, classes]);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === effectiveClassId) || null,
    [classes, effectiveClassId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !birthDate) {
      setErrorMsg("Preencha o nome completo e a data de nascimento do atleta.");
      return;
    }
    if (!guardianName.trim() || !guardianCpf.trim() || !guardianPhone.trim()) {
      setErrorMsg("Preencha o nome, CPF e WhatsApp do responsável financeiro.");
      return;
    }
    if (!acceptedTerms) {
      setErrorMsg("É necessário aceitar os termos de matrícula da escolinha.");
      return;
    }

    setSubmitting(true);
    try {
      const feeCents = selectedClass?.monthly_fee_cents || 16000;
      const { student, payment } = await createStudentEnrollment(
        {
          full_name: fullName.trim(),
          birth_date: birthDate,
          position,
          dominant_foot: dominantFoot,
          health_notes: healthNotes.trim(),
          guardian_name: guardianName.trim(),
          guardian_phone: guardianPhone.trim(),
          guardian_email: guardianEmail.trim(),
          guardian_cpf: guardianCpf.trim(),
          billing_day: billingDay,
          class_id: selectedClass?.id || null,
          status: "pending",
        },
        feeCents
      );

      const checkout = await requestStripeCheckoutLink({
        type: "student_payment",
        recordId: payment.id,
        studentId: student.id,
        title: `Matrícula / 1ª Mensalidade — ${student.full_name}`,
        description: selectedClass
          ? `Turma: ${selectedClass.name} (${selectedClass.days_of_week.join(", ")} · ${formatTimeShort(selectedClass.start_time)})`
          : "Mensalidade Escolinha de Futebol",
        amountCents: feeCents,
        customerEmail: guardianEmail.trim() || undefined,
        customerName: guardianName.trim(),
      });

      await ensureOrUpdateStudentPayment({
        paymentId: payment.id,
        studentId: student.id,
        referenceMonth: payment.reference_month,
        referenceYear: payment.reference_year,
        dueDate: payment.due_date,
        amountCents: payment.amount_cents,
        status: "pending",
        stripeCheckoutUrl: checkout.url,
      });

      setEnrollmentResult({
        studentName: student.full_name,
        className: selectedClass?.name || `Triagem ${subCategory}`,
        monthlyFeeCents: feeCents,
        billingDay,
        checkoutUrl: checkout.url,
        simulatedStripe: checkout.simulated,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao registrar a matrícula."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPaymentLink = () => {
    if (!enrollmentResult?.checkoutUrl) return;
    navigator.clipboard.writeText(enrollmentResult.checkoutUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-pitch-bg py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-verde/15 font-mono text-sm font-bold text-verde">
              SP
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight">
                Stat<span className="text-verde">Pitch</span>
              </span>
              <span className="block text-[11px] text-text-muted">
                Matrícula Digital · Escolinha de Futebol
              </span>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-verde"
          >
            <ArrowLeft size={14} />
            Painel Admin
          </Link>
        </div>

        {/* Tela de Confirmação Pós-Envio */}
        {enrollmentResult ? (
          <div className="card p-6 sm:p-8 space-y-6 border-verde/40">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-verde/15 text-verde">
                <CheckCircle2 size={36} />
              </div>
              <span className="rounded-full bg-verde/15 px-3 py-1 text-xs font-bold text-verde uppercase tracking-wider">
                Pré-Matrícula Registrada
              </span>
              <h1 className="mt-3 text-2xl font-extrabold text-text-primary">
                Atleta cadastrado com sucesso!
              </h1>
              <p className="mt-1 text-sm text-text-secondary max-w-md">
                Os dados de{" "}
                <strong className="text-text-primary">
                  {enrollmentResult.studentName}
                </strong>{" "}
                já estão salvos no sistema. Conclua o pagamento da 1ª mensalidade
                para ativar a vaga imediatamente.
              </p>
            </div>

            {/* Resumo */}
            <div className="rounded-xl border border-pitch-border bg-pitch-bg-alt p-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Atleta:</span>
                <span className="font-semibold text-text-primary">
                  {enrollmentResult.studentName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Turma Vinculada:</span>
                <span className="font-semibold text-verde">
                  {enrollmentResult.className}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Vencimento Mensal:</span>
                <span className="font-mono text-text-primary">
                  Todo dia {enrollmentResult.billingDay}
                </span>
              </div>
              <div className="divider my-2" />
              <div className="flex items-center justify-between">
                <span className="font-medium text-text-secondary">
                  Valor da 1ª Mensalidade:
                </span>
                <span className="font-mono text-lg font-extrabold text-verde">
                  {formatCurrencyBRL(enrollmentResult.monthlyFeeCents)}
                </span>
              </div>
            </div>

            {/* Botões de Pagamento Stripe */}
            <div className="space-y-3">
              <a
                href={enrollmentResult.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full py-3.5 text-base"
              >
                <CreditCard size={18} />
                Pagar 1ª Mensalidade via Stripe Checkout
                <ExternalLink size={15} />
              </a>

              <button
                type="button"
                onClick={handleCopyPaymentLink}
                className="btn-secondary w-full py-3 text-sm"
              >
                {copiedLink ? (
                  <>
                    <Check size={16} className="text-verde" />
                    Link de Pagamento Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copiar Link de Pagamento Stripe
                  </>
                )}
              </button>
            </div>

            {enrollmentResult.simulatedStripe && (
              <p className="rounded-lg border border-amarelo/30 bg-amarelo/10 p-3 text-center text-xs text-amarelo-light">
                Modo Demonstração: Adicione sua <code>STRIPE_SECRET_KEY</code> na
                Vercel para redirecionar ao checkout oficial da Stripe.
              </p>
            )}

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setEnrollmentResult(null)}
                className="text-xs font-medium text-text-muted hover:text-text-primary underline cursor-pointer"
              >
                Realizar matrícula de outro atleta
              </button>
            </div>
          </div>
        ) : (
          /* Formulário Mobile-First em 3 Seções */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cabeçalho do Formulário */}
            <div className="card p-6 border-verde/30">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-verde/15 px-3 py-1 text-xs font-bold text-verde mb-3">
                <Sparkles size={13} />
                Matrícula Online 100% Digital
              </div>
              <h1 className="text-2xl font-extrabold text-text-primary sm:text-3xl">
                Ficha de Inscrição do Atleta
              </h1>
              <p className="mt-1.5 text-sm text-text-secondary">
                Preencha os dados abaixo em menos de 2 minutos. O sistema sugere
                automaticamente a turma ideal pela idade do aluno.
              </p>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-vermelho/40 bg-vermelho/15 p-4 text-sm text-vermelho-light">
                {errorMsg}
              </div>
            )}

            {/* SEÇÃO 1: DADOS DO ATLETA */}
            <section className="card p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-pitch-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-verde/15 font-mono text-xs font-bold text-verde">
                    1
                  </div>
                  <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <User size={17} className="text-verde" />
                    Dados do Atleta
                  </h2>
                </div>
                {birthDate && athleteAge > 0 && (
                  <span className="rounded-full bg-verde/15 px-3 py-1 font-mono text-xs font-bold text-verde">
                    {athleteAge} anos · {subCategory}
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Nome Completo do Aluno *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Gabriel Martins Oliveira"
                    className="input-pitch w-full"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="input-pitch w-full"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Posição em que Joga *
                  </label>
                  <select
                    value={position}
                    onChange={(e) =>
                      setPosition(e.target.value as PlayerPosition)
                    }
                    className="input-pitch w-full"
                  >
                    {PLAYER_POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Pé Dominante *
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {DOMINANT_FEET.map((foot) => (
                      <button
                        key={foot}
                        type="button"
                        onClick={() => setDominantFoot(foot)}
                        className={`rounded-lg border py-2.5 text-xs font-bold transition cursor-pointer ${
                          dominantFoot === foot
                            ? "border-verde bg-verde/15 text-verde"
                            : "border-pitch-border bg-pitch-bg-alt text-text-secondary hover:border-pitch-border-hover"
                        }`}
                      >
                        {foot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    <HeartPulse size={14} className="text-vermelho-light" />
                    Ficha Médica / Observações de Saúde
                  </label>
                  <textarea
                    rows={2}
                    value={healthNotes}
                    onChange={(e) => setHealthNotes(e.target.value)}
                    placeholder="Informe tipo sanguíneo, alergias a medicamentos, asma ou restrições físicas (opcional)"
                    className="input-pitch w-full"
                  />
                </div>
              </div>
            </section>

            {/* SEÇÃO 2: SUGESTÃO AUTOMÁTICA DE TURMA */}
            <section className="card p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pitch-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-verde/15 font-mono text-xs font-bold text-verde">
                    2
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                      <GraduationCap size={18} className="text-verde" />
                      Turma Sugerida ({subCategory || "Por Idade"})
                    </h2>
                    <p className="text-xs text-text-muted">
                      Triagem automática para {athleteAge} anos de idade
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAllClasses((prev) => !prev)}
                  className="text-xs font-semibold text-verde hover:underline cursor-pointer"
                >
                  {showAllClasses
                    ? "Mostrar apenas recomendadas"
                    : "Ver todas as turmas"}
                </button>
              </div>

              {loadingClasses ? (
                <div className="py-6 text-center text-sm text-text-muted">
                  Carregando turmas disponíveis...
                </div>
              ) : (
                <div className="grid gap-3">
                  {displayedClasses.map((cls) => {
                    const isSelected = cls.id === effectiveClassId;
                    const isRecommended =
                      athleteAge >= cls.min_age && athleteAge <= cls.max_age;

                    return (
                      <div
                        key={cls.id}
                        onClick={() => setSelectedClassId(cls.id)}
                        className={`rounded-xl border p-4 transition cursor-pointer ${
                          isSelected
                            ? "border-verde bg-verde/10"
                            : "border-pitch-border bg-pitch-bg-alt hover:border-pitch-border-hover"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-text-primary">
                                {cls.name}
                              </span>
                              {isRecommended && (
                                <span className="rounded bg-verde/20 px-2 py-0.5 text-[10px] font-bold text-verde uppercase">
                                  Ideal p/ {athleteAge} anos
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-text-secondary">
                              {cls.coach_name} · Faixa: {cls.min_age} a{" "}
                              {cls.max_age} anos
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-base font-extrabold text-verde">
                              {formatCurrencyBRL(cls.monthly_fee_cents)}
                            </div>
                            <div className="text-[10px] text-text-muted">
                              /mês
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                          <span className="inline-flex items-center gap-1 rounded bg-pitch-surface px-2 py-1">
                            <Calendar size={13} className="text-amarelo" />
                            {cls.days_of_week.join(", ")}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-pitch-surface px-2 py-1 font-mono">
                            <Clock size={13} className="text-verde" />
                            {formatTimeShort(cls.start_time)} às{" "}
                            {formatTimeShort(cls.end_time)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* SEÇÃO 3: DADOS DO RESPONSÁVEL FINANCEIRO */}
            <section className="card p-6 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-pitch-border pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-verde/15 font-mono text-xs font-bold text-verde">
                  3
                </div>
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <ShieldCheck size={18} className="text-verde" />
                  Dados do Responsável Financeiro
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Nome do Pai / Mãe / Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Ex: Roberto Oliveira"
                    className="input-pitch w-full"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    CPF do Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={guardianCpf}
                    onChange={(e) => setGuardianCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="input-pitch w-full font-mono"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    <Phone size={12} className="text-verde" />
                    WhatsApp (com DDD) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="input-pitch w-full font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    E-mail (para recibos Stripe)
                  </label>
                  <input
                    type="email"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    placeholder="responsavel@email.com"
                    className="input-pitch w-full"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Dia Preferencial de Vencimento da Mensalidade *
                  </label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {BILLING_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setBillingDay(day)}
                        className={`rounded-lg border py-2.5 font-mono text-sm font-bold transition cursor-pointer ${
                          billingDay === day
                            ? "border-verde bg-verde/15 text-verde"
                            : "border-pitch-border bg-pitch-bg-alt text-text-secondary hover:border-pitch-border-hover"
                        }`}
                      >
                        Dia {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2.5 pt-2 text-xs text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-verde"
                />
                <span>
                  Declaro que o atleta está apto para a prática esportiva e
                  concordo com os termos de matrícula e cobrança mensal da
                  escolinha.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3.5 text-base disabled:opacity-50"
              >
                <CreditCard size={18} />
                {submitting
                  ? "Salvando Matrícula e Gerando Checkout..."
                  : `Finalizar Matrícula (${formatCurrencyBRL(
                      selectedClass?.monthly_fee_cents || 16000
                    )})`}
              </button>
            </section>
          </form>
        )}
      </div>
    </div>
  );
}

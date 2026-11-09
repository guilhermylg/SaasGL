"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  User,
  HeartPulse,
  Trophy,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  Clock,
  Sparkles,
  Phone,
  ArrowLeft,
  MessageCircle,
  Landmark,
} from "lucide-react";
import { Logo } from "@/components/logo";
import {
  SchoolClass,
  PlayerPosition,
  DominantFoot,
  BillingDay,
  PLAYER_POSITIONS,
  DOMINANT_FEET,
  BILLING_DAYS,
  ARENA_PIX_CONFIG,
  calculateAge,
  getSubCategory,
  formatCurrencyBRL,
  formatTimeShort,
} from "@/types/database";
import {
  fetchClasses,
  createStudentEnrollment,
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
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

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
      const { student } = await createStudentEnrollment(
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

      setEnrollmentResult({
        studentName: student.full_name,
        className: selectedClass?.name || `Triagem ${subCategory}`,
        monthlyFeeCents: feeCents,
        billingDay,
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

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(ARENA_PIX_CONFIG.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 text-slate-900">
      <div className="mx-auto max-w-2xl">
        {/* Top Navbar Liquid Glass */}
        <div className="mb-6 flex items-center justify-between rounded-2xl liquid-glass p-4">
          <Logo href="/" subtitle="Matrícula Digital dos Pais" size="sm" />
          <Link
            href="/dashboard"
            className="btn-secondary !h-9 !px-3 !text-xs"
          >
            <ArrowLeft size={14} />
            <span>Painel</span>
          </Link>
        </div>

        {/* Confirmação Pós-Envio com PIX e Conciliação */}
        {enrollmentResult ? (
          <div className="rounded-2xl liquid-glass p-6 sm:p-8 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
                <CheckCircle2 size={36} />
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Pré-Matrícula Registrada
              </span>
              <h1 className="mt-3 font-[family-name:var(--font-montserrat)] text-2xl font-extrabold text-slate-900">
                Atleta cadastrado com sucesso!
              </h1>
              <p className="mt-1 text-sm text-slate-600 max-w-md">
                Os dados de{" "}
                <strong className="text-slate-900">
                  {enrollmentResult.studentName}
                </strong>{" "}
                já estão no sistema. Realize o PIX da 1ª mensalidade e envie o
                comprovante no WhatsApp para concluirmos a conciliação.
              </p>
            </div>

            {/* Resumo */}
            <div className="rounded-xl border border-slate-200/90 bg-white/80 p-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Atleta:</span>
                <span className="font-semibold text-slate-900">
                  {enrollmentResult.studentName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Turma Vinculada:</span>
                <span className="font-semibold text-emerald-700">
                  {enrollmentResult.className}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Dia de Vencimento:</span>
                <span className="font-mono text-slate-900 font-semibold">
                  Todo dia {enrollmentResult.billingDay}
                </span>
              </div>
              <div className="h-px bg-slate-200 my-2" />
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">
                  Valor da 1ª Mensalidade:
                </span>
                <span className="font-[family-name:var(--font-montserrat)] text-xl font-black text-emerald-700">
                  {formatCurrencyBRL(enrollmentResult.monthlyFeeCents)}
                </span>
              </div>
            </div>

            {/* Bloco Liquid Glass de Pagamento PIX Manual */}
            <div className="liquid-glass-emerald rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <QrCode size={20} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Dados para PIX (Conciliação Bancária)
                  </span>
                  <p className="text-xs text-slate-600">
                    {ARENA_PIX_CONFIG.beneficiary} · {ARENA_PIX_CONFIG.bankName}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-xl bg-white/90 border border-emerald-200 px-3.5 py-2.5">
                <span className="font-mono text-sm font-bold text-slate-900 truncate">
                  {ARENA_PIX_CONFIG.pixKey}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPixKey}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer shrink-0"
                >
                  {copiedPix ? (
                    <>
                      <Check size={14} />
                      <span>Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copiar PIX</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Botão Principal de Envio de Comprovante no WhatsApp */}
            <div className="space-y-3">
              <a
                href={`https://wa.me/5511999999999?text=${encodeURIComponent(
                  `Olá! Acabei de realizar a matrícula de *${enrollmentResult.studentName}* na turma *${enrollmentResult.className}* (${formatCurrencyBRL(enrollmentResult.monthlyFeeCents)}). Segue o comprovante PIX para conciliação!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full h-14 !text-base shadow-sm"
              >
                <MessageCircle size={19} />
                <span>Enviar Comprovante PIX no WhatsApp</span>
              </a>
            </div>

            {/* Guia de Próximos Passos */}
            <div className="rounded-xl border border-slate-200/90 bg-white/80 p-5 space-y-3">
              <h3 className="font-[family-name:var(--font-montserrat)] text-xs font-bold uppercase tracking-wider text-slate-700">
                Próximos Passos para o 1º Treino:
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    1
                  </span>
                  <span>
                    Realize a transferência PIX da 1ª mensalidade utilizando a chave oficial acima.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    2
                  </span>
                  <span>
                    Envie o comprovante pelo WhatsApp para a coordenação dar baixa na conciliação bancária.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    3
                  </span>
                  <span>
                    Compareça 15 minutos antes do horário de início com chuteira de society e caneleiras.
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setEnrollmentResult(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 underline cursor-pointer"
              >
                Cadastrar outro atleta
              </button>
            </div>
          </div>
        ) : (
          /* Formulário Mobile-First com Liquid Glass */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Banner de Boas-Vindas */}
            <div className="rounded-2xl liquid-glass p-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 mb-2">
                <Sparkles size={13} />
                Matrícula Digital Online · ArenaGL
              </div>
              <h1 className="font-[family-name:var(--font-montserrat)] text-2xl font-black text-slate-900 sm:text-3xl tracking-tight">
                Ficha de Inscrição da Escolinha
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Preencha os dados do atleta. A turma adequada será sugerida
                automaticamente pela data de nascimento.
              </p>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 font-medium">
                {errorMsg}
              </div>
            )}

            {/* SEÇÃO 1: DADOS DO ATLETA */}
            <section className="rounded-2xl liquid-glass p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 font-[family-name:var(--font-montserrat)] text-xs font-bold text-white">
                    1
                  </span>
                  <h2 className="font-[family-name:var(--font-montserrat)] text-base font-bold text-slate-900 flex items-center gap-2">
                    <User size={18} className="text-emerald-600" />
                    Dados do Atleta
                  </h2>
                </div>
                {birthDate && athleteAge > 0 && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 font-mono text-xs font-bold text-emerald-800">
                    {athleteAge} anos · {subCategory}
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
                    Nome Completo do Aluno *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Gabriel Martins Oliveira"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white/95 px-3.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white/95 px-3.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
                    Posição em que Joga *
                  </label>
                  <select
                    value={position}
                    onChange={(e) =>
                      setPosition(e.target.value as PlayerPosition)
                    }
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white/95 px-3.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                  >
                    {PLAYER_POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
                    Pé Dominante *
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {DOMINANT_FEET.map((foot) => (
                      <button
                        key={foot}
                        type="button"
                        onClick={() => setDominantFoot(foot)}
                        className={`h-11 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          dominantFoot === foot
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {foot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
                    <HeartPulse size={14} className="text-rose-500" />
                    Ficha Médica / Observações de Saúde
                  </label>
                  <textarea
                    rows={2}
                    value={healthNotes}
                    onChange={(e) => setHealthNotes(e.target.value)}
                    placeholder="Tipo sanguíneo, alergias a remédios, asma ou restrições (opcional)"
                    className="w-full rounded-xl border border-slate-300 bg-white/95 p-3 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </section>

            {/* SEÇÃO 2: SUGESTÃO AUTOMÁTICA DE TURMA */}
            <section className="rounded-2xl liquid-glass p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 font-[family-name:var(--font-montserrat)] text-xs font-bold text-white">
                    2
                  </span>
                  <div>
                    <h2 className="font-[family-name:var(--font-montserrat)] text-base font-bold text-slate-900 flex items-center gap-2">
                      <Trophy size={18} className="text-emerald-600" />
                      Turma Sugerida ({subCategory || "Por Idade"})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Triagem calculada para {athleteAge} anos
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAllClasses((prev) => !prev)}
                  className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  {showAllClasses
                    ? "Ver apenas recomendadas"
                    : "Ver todas as turmas"}
                </button>
              </div>

              {loadingClasses ? (
                <div className="py-6 text-center text-sm text-slate-500">
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
                        className={`rounded-xl border p-4 transition-all cursor-pointer ${
                          isSelected
                            ? "border-2 border-emerald-600 bg-emerald-50/70 shadow-xs"
                            : "border-slate-200 bg-white/90 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-[family-name:var(--font-montserrat)] font-bold text-slate-900">
                                {cls.name}
                              </span>
                              {isRecommended && (
                                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                                  Ideal para {athleteAge} anos
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-slate-600">
                              {cls.coach_name} · Faixa: {cls.min_age} a{" "}
                              {cls.max_age} anos
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-[family-name:var(--font-montserrat)] text-base font-extrabold text-emerald-700">
                              {formatCurrencyBRL(cls.monthly_fee_cents)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              /mês
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 font-medium">
                            <Calendar size={13} className="text-amber-600" />
                            {cls.days_of_week.join(", ")}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 font-mono">
                            <Clock size={13} className="text-emerald-600" />
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
            <section className="rounded-2xl liquid-glass p-6 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-200/70 pb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 font-[family-name:var(--font-montserrat)] text-xs font-bold text-white">
                  3
                </span>
                <h2 className="font-[family-name:var(--font-montserrat)] text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  Dados do Responsável Financeiro
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
                    Nome do Pai / Mãe / Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Ex: Roberto Oliveira"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white/95 px-3.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
                    CPF do Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={guardianCpf}
                    onChange={(e) => setGuardianCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white/95 px-3.5 text-sm text-slate-900 font-mono focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                    <Phone size={13} className="text-emerald-600" />
                    WhatsApp (com DDD) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white/95 px-3.5 text-sm text-slate-900 font-mono focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
                    E-mail do Responsável (para recibos)
                  </label>
                  <input
                    type="email"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    placeholder="responsavel@email.com"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white/95 px-3.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
                    Dia Preferencial de Vencimento *
                  </label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {BILLING_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setBillingDay(day)}
                        className={`h-11 rounded-xl border font-mono text-sm font-bold transition cursor-pointer ${
                          billingDay === day
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Dia {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2.5 pt-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-emerald-600"
                />
                <span>
                  Declaro que o atleta está apto para atividades físicas e
                  aceito os termos de matrícula e mensalidade da escolinha.
                </span>
              </label>

              {/* Botão de Envio Largo H-14 */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full h-14 !text-base shadow-md"
              >
                <Landmark size={19} />
                <span>
                  {submitting
                    ? "Registrando Matrícula..."
                    : `Concluir Matrícula & Gerar PIX (${formatCurrencyBRL(
                        selectedClass?.monthly_fee_cents || 16000
                      )})`}
                </span>
              </button>
            </section>
          </form>
        )}
      </div>
    </div>
  );
}

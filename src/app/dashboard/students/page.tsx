"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  MessageCircle,
  Plus,
  HeartPulse,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  X,
  Footprints,
  Calendar,
} from "lucide-react";
import {
  Student,
  SchoolClass,
  StudentPayment,
  PlayerPosition,
  DominantFoot,
  BillingDay,
  StudentStatus,
  PLAYER_POSITIONS,
  DOMINANT_FEET,
  BILLING_DAYS,
  calculateAge,
  getSubCategory,
  formatPhoneWhatsApp,
  formatCurrencyBRL,
} from "@/types/database";
import {
  fetchStudents,
  fetchClasses,
  fetchStudentPayments,
  createStudentEnrollment,
  updateStudentStatusOrClass,
} from "@/lib/data-service";

const SUB_CATEGORIES = ["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17"];

function getPositionBadge(pos: PlayerPosition) {
  switch (pos) {
    case "Goleiro":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Zagueiro":
    case "Lateral":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "Volante":
    case "Meia":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Atacante":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function StudentsDashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClassId, setFilterClassId] = useState("ALL");
  const [filterSub, setFilterSub] = useState("ALL");
  const [filterPosition, setFilterPosition] = useState("ALL");
  const [filterFinancial, setFilterFinancial] = useState("ALL");

  // Modal de novo aluno
  const [showNewModal, setShowNewModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("2015-03-15");
  const [position, setPosition] = useState<PlayerPosition>("Atacante");
  const [dominantFoot, setDominantFoot] = useState<DominantFoot>("Direito");
  const [healthNotes, setHealthNotes] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianCpf, setGuardianCpf] = useState("");
  const [billingDay, setBillingDay] = useState<BillingDay>(10);
  const [classId, setClassId] = useState("");
  const [saving, setSaving] = useState(false);

  const refreshData = async () => {
    const [sData, cData, pData] = await Promise.all([
      fetchStudents(),
      fetchClasses(),
      fetchStudentPayments(new Date().getFullYear()),
    ]);
    setStudents(sData);
    setClasses(cData);
    setPayments(pData);
  };

  useEffect(() => {
    Promise.all([
      fetchStudents(),
      fetchClasses(),
      fetchStudentPayments(new Date().getFullYear()),
    ])
      .then(([sData, cData, pData]) => {
        setStudents(sData);
        setClasses(cData);
        setPayments(pData);
        if (cData.length > 0) {
          setClassId(cData[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const classMap = useMemo(() => {
    const map = new Map<string, SchoolClass>();
    classes.forEach((c) => map.set(c.id, c));
    return map;
  }, [classes]);

  // Status financeiro do mês atual por aluno
  const currentMonth = new Date().getMonth() + 1;
  const financialStatusByStudent = useMemo(() => {
    const map = new Map<string, "paid" | "pending" | "overdue">();
    payments.forEach((p) => {
      if (p.reference_month === currentMonth) {
        map.set(p.student_id, p.status);
      }
    });
    return map;
  }, [payments, currentMonth]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const age = calculateAge(student.birth_date);
      const sub = getSubCategory(age);
      const finStatus =
        financialStatusByStudent.get(student.id) ||
        (student.status === "active" ? "paid" : "pending");

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = student.full_name.toLowerCase().includes(q);
        const matchesGuardian = student.guardian_name.toLowerCase().includes(q);
        const matchesCpf = student.guardian_cpf.toLowerCase().includes(q);
        if (!matchesName && !matchesGuardian && !matchesCpf) return false;
      }

      if (filterClassId !== "ALL" && student.class_id !== filterClassId) {
        return false;
      }

      if (filterSub !== "ALL" && sub !== filterSub) {
        return false;
      }

      if (filterPosition !== "ALL" && student.position !== filterPosition) {
        return false;
      }

      if (filterFinancial !== "ALL" && finStatus !== filterFinancial) {
        return false;
      }

      return true;
    });
  }, [
    students,
    searchQuery,
    filterClassId,
    filterSub,
    filterPosition,
    filterFinancial,
    financialStatusByStudent,
  ]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !guardianName.trim() || !guardianPhone.trim()) return;
    setSaving(true);
    try {
      const chosenClass = classMap.get(classId);
      await createStudentEnrollment(
        {
          full_name: fullName.trim(),
          birth_date: birthDate,
          position,
          dominant_foot: dominantFoot,
          health_notes: healthNotes.trim(),
          guardian_name: guardianName.trim(),
          guardian_phone: guardianPhone.trim(),
          guardian_email: guardianEmail.trim(),
          guardian_cpf: guardianCpf.trim() || "000.000.000-00",
          billing_day: billingDay,
          class_id: classId || null,
          status: "active",
        },
        chosenClass?.monthly_fee_cents || 16000
      );
      setShowNewModal(false);
      setFullName("");
      setHealthNotes("");
      setGuardianName("");
      setGuardianPhone("");
      setGuardianEmail("");
      setGuardianCpf("");
      await refreshData();
    } finally {
      setSaving(false);
    }
  };

  const handleChangeClass = async (studentId: string, newClassId: string) => {
    await updateStudentStatusOrClass(studentId, {
      class_id: newClassId || null,
    });
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, class_id: newClassId || null } : s
      )
    );
  };

  const handleChangeStatus = async (
    studentId: string,
    newStatus: StudentStatus
  ) => {
    await updateStudentStatusOrClass(studentId, { status: newStatus });
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-[family-name:var(--font-montserrat)] text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Users size={24} className="text-emerald-600" />
            Gestão de Alunos (Fichas & Cromos)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Fichas técnicas dos atletas por turma, posição de jogo, pé dominante,
            observações de saúde e contato direto com os pais.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/matricula"
            target="_blank"
            className="btn-secondary !text-xs sm:!text-sm"
          >
            <span>Link dos Pais (/matricula)</span>
            <ArrowUpRight size={14} />
          </Link>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="btn-primary !text-xs sm:!text-sm"
          >
            <Plus size={16} />
            <span>Novo Aluno Manual</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
          <Filter size={13} className="text-emerald-600" />
          Filtros de Triagem Esportiva
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Busca */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar aluno, responsável..."
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Filtro por Turma */}
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="ALL">Todas as Turmas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Filtro por Categoria Sub */}
          <select
            value={filterSub}
            onChange={(e) => setFilterSub(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="ALL">Todas Categorias (Sub-X)</option>
            {SUB_CATEGORIES.map((sub) => (
              <option key={sub} value={sub}>
                Categoria {sub}
              </option>
            ))}
          </select>

          {/* Filtro por Posição */}
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="ALL">Todas as Posições</option>
            {PLAYER_POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>

          {/* Filtro por Status Financeiro */}
          <select
            value={filterFinancial}
            onChange={(e) => setFilterFinancial(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="ALL">Status Financeiro</option>
            <option value="paid">Mensalidade Paga</option>
            <option value="pending">Mensalidade Pendente</option>
            <option value="overdue">Em Atraso</option>
          </select>
        </div>
      </div>

      {/* Grid de Cards (Estilo Cromo Esportivo) */}
      {loading ? (
        <div className="card p-12 text-center text-sm text-slate-500">
          Carregando cromos dos atletas...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="card p-12 text-center space-y-2">
          <p className="font-[family-name:var(--font-montserrat)] text-base font-bold text-slate-900">
            Nenhum atleta encontrado com os filtros selecionados.
          </p>
          <p className="text-xs text-slate-500">
            Envie o link <code>/matricula</code> para os pais cadastrarem novos
            alunos pelo WhatsApp.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => {
            const age = calculateAge(student.birth_date);
            const sub = getSubCategory(age);
            const finStatus =
              financialStatusByStudent.get(student.id) ||
              (student.status === "active" ? "paid" : "pending");
            const waNumber = formatPhoneWhatsApp(student.guardian_phone);
            const waMessage = encodeURIComponent(
              `Olá ${student.guardian_name}, tudo bem? Aqui é da coordenação da Escolinha sobre o atleta ${student.full_name} (${sub}).`
            );
            const initials = getInitials(student.full_name);
            const posBadgeStyle = getPositionBadge(student.position);

            return (
              <div
                key={student.id}
                className="rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Cabeçalho do Cromo */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar Cromo Esportivo */}
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-[family-name:var(--font-montserrat)] font-bold text-sm border-2 border-emerald-500 shadow-xs">
                        <span>{initials}</span>
                      </div>

                      <div>
                        <h2 className="font-[family-name:var(--font-montserrat)] text-base font-bold text-slate-900 leading-tight">
                          {student.full_name}
                        </h2>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${posBadgeStyle}`}
                          >
                            {student.position}
                          </span>
                          <span className="rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold px-2 py-0.5">
                            {age} anos ({sub})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Badge de Status Financeiro */}
                    <div className="shrink-0">
                      {finStatus === "paid" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 size={12} />
                          Pago
                        </span>
                      )}
                      {finStatus === "pending" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                          <Clock size={12} />
                          Pendente
                        </span>
                      )}
                      {finStatus === "overdue" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-200 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                          <AlertTriangle size={12} />
                          Atrasado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informações Técnicas */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Footprints size={14} className="text-slate-400" />
                      <span>Pé {student.dominant_foot}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <Calendar size={14} className="text-slate-400" />
                      <span>Venc. Dia {student.billing_day}</span>
                    </div>
                  </div>

                  {/* Ficha Médica se houver */}
                  {student.health_notes && (
                    <div className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2 text-xs text-rose-800">
                      <HeartPulse size={14} className="mt-0.5 shrink-0 text-rose-500" />
                      <span className="leading-snug">{student.health_notes}</span>
                    </div>
                  )}

                  {/* Seletor Rápido de Turma & Matrícula */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Turma
                      </label>
                      <select
                        value={student.class_id || ""}
                        onChange={(e) =>
                          handleChangeClass(student.id, e.target.value)
                        }
                        className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                      >
                        <option value="">Sem turma (Triagem)</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Matrícula
                      </label>
                      <select
                        value={student.status}
                        onChange={(e) =>
                          handleChangeStatus(
                            student.id,
                            e.target.value as StudentStatus
                          )
                        }
                        className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                      >
                        <option value="active">Ativo</option>
                        <option value="pending">Pendente</option>
                        <option value="inactive">Inativo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Rodapé do Cromo: Responsável + Botão WhatsApp */}
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div className="text-xs leading-tight">
                    <div className="font-semibold text-slate-900">
                      {student.guardian_name}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">
                      {student.guardian_phone}
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/${waNumber}?text=${waMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 shadow-2xs"
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Novo Aluno */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-[family-name:var(--font-montserrat)] text-lg font-bold text-slate-900">
                Cadastrar Novo Atleta
              </h2>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Nome Completo do Atleta *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Ex: Arthur Gomes"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Posição em Campo *
                  </label>
                  <select
                    value={position}
                    onChange={(e) =>
                      setPosition(e.target.value as PlayerPosition)
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
                  >
                    {PLAYER_POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Pé Dominante
                  </label>
                  <select
                    value={dominantFoot}
                    onChange={(e) =>
                      setDominantFoot(e.target.value as DominantFoot)
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
                  >
                    {DOMINANT_FEET.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Turma Inicial
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatCurrencyBRL(c.monthly_fee_cents)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Observações Médicas / Saúde
                  </label>
                  <input
                    type="text"
                    value={healthNotes}
                    onChange={(e) => setHealthNotes(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
                    placeholder="Tipo sanguíneo, alergias..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Nome do Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    WhatsApp do Responsável *
                  </label>
                  <input
                    type="tel"
                    required
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="11999999999"
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    CPF do Responsável
                  </label>
                  <input
                    type="text"
                    value={guardianCpf}
                    onChange={(e) => setGuardianCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Dia de Vencimento
                  </label>
                  <select
                    value={billingDay}
                    onChange={(e) =>
                      setBillingDay(Number(e.target.value) as BillingDay)
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono outline-none focus:border-emerald-500"
                  >
                    {BILLING_DAYS.map((d) => (
                      <option key={d} value={d}>
                        Todo dia {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="btn-secondary !text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary !text-xs"
                >
                  {saving ? "Salvando..." : "Salvar Atleta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

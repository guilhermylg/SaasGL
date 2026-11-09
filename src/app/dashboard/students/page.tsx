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
  ExternalLink,
  X,
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
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary flex items-center gap-2.5">
            <Users size={24} className="text-verde" />
            Alunos & Fichas Técnicas
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Gerencie atletas por turma, categoria Sub, posição em campo, ficha
            médica e contato rápido via WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/matricula"
            target="_blank"
            className="btn-secondary px-4 py-2.5 text-xs sm:text-sm"
          >
            Link Público (/matricula)
            <ExternalLink size={14} />
          </Link>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="btn-primary px-4 py-2.5 text-xs sm:text-sm"
          >
            <Plus size={16} />
            Novo Aluno Manual
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
          <Filter size={13} className="text-verde" />
          Filtros de Triagem Esportiva e Financeira
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Busca */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Atleta, pai/mãe ou CPF..."
              className="input-pitch w-full pl-9 text-xs"
            />
          </div>

          {/* Filtro por Turma */}
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="input-pitch w-full text-xs"
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
            className="input-pitch w-full text-xs"
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
            className="input-pitch w-full text-xs"
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
            className="input-pitch w-full text-xs"
          >
            <option value="ALL">Todos Status Financeiros</option>
            <option value="paid">Mensalidade em Dia (Pago)</option>
            <option value="pending">Mensalidade Pendente</option>
            <option value="overdue">Mensalidade em Atraso</option>
          </select>
        </div>
      </div>

      {/* Lista de Alunos */}
      {loading ? (
        <div className="card p-12 text-center text-sm text-text-muted">
          Carregando atletas matriculados...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <p className="text-base font-semibold text-text-primary">
            Nenhum aluno encontrado com os filtros selecionados.
          </p>
          <p className="text-xs text-text-muted">
            Compartilhe o link <code>/matricula</code> com os pais ou cadastre um
            novo atleta manualmente.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
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

            return (
              <div
                key={student.id}
                className="card p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-text-primary">
                          {student.full_name}
                        </h2>
                        <span className="rounded-md bg-verde/15 px-2 py-0.5 font-mono text-xs font-bold text-verde">
                          {age} anos · {sub}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                        <span className="rounded bg-pitch-bg-alt px-2 py-0.5 font-semibold text-amarelo">
                          {student.position}
                        </span>
                        <span>Pé {student.dominant_foot}</span>
                        <span>· Venc. dia {student.billing_day}</span>
                      </div>
                    </div>

                    {/* Badge Financeiro */}
                    <div>
                      {finStatus === "paid" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-verde/15 px-2.5 py-1 text-[11px] font-bold text-verde">
                          <CheckCircle2 size={12} />
                          Pago
                        </span>
                      )}
                      {finStatus === "pending" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amarelo/15 px-2.5 py-1 text-[11px] font-bold text-amarelo-light">
                          <Clock size={12} />
                          Pendente
                        </span>
                      )}
                      {finStatus === "overdue" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-vermelho/15 px-2.5 py-1 text-[11px] font-bold text-vermelho-light">
                          <AlertTriangle size={12} />
                          Atrasado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ficha Médica */}
                  {student.health_notes && (
                    <div className="flex items-start gap-2 rounded-lg border border-pitch-border bg-pitch-bg-alt px-3 py-2 text-xs text-text-secondary">
                      <HeartPulse
                        size={14}
                        className="mt-0.5 shrink-0 text-vermelho-light"
                      />
                      <span>{student.health_notes}</span>
                    </div>
                  )}

                  {/* Seletor de Turma & Status */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase text-text-muted">
                        Turma Vinculada
                      </label>
                      <select
                        value={student.class_id || ""}
                        onChange={(e) =>
                          handleChangeClass(student.id, e.target.value)
                        }
                        className="input-pitch w-full py-1.5 text-xs"
                      >
                        <option value="">Sem turma (Em triagem)</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase text-text-muted">
                        Status da Matrícula
                      </label>
                      <select
                        value={student.status}
                        onChange={(e) =>
                          handleChangeStatus(
                            student.id,
                            e.target.value as StudentStatus
                          )
                        }
                        className="input-pitch w-full py-1.5 text-xs"
                      >
                        <option value="active">Ativo</option>
                        <option value="pending">Pendente</option>
                        <option value="inactive">Inativo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Rodapé: Responsável + Botão Direto WhatsApp */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-pitch-border pt-3">
                  <div className="text-xs">
                    <div className="font-semibold text-text-primary">
                      Resp: {student.guardian_name}
                    </div>
                    <div className="font-mono text-[11px] text-text-muted">
                      CPF: {student.guardian_cpf} · Tel: {student.guardian_phone}
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/${waNumber}?text=${waMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-verde/15 px-3 py-2 text-xs font-bold text-verde transition hover:bg-verde hover:text-[#0a0f0b]"
                  >
                    <MessageCircle size={14} />
                    WhatsApp do Pai/Mãe
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro Manual */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-pitch-border pb-3">
              <h2 className="text-lg font-bold text-text-primary">
                Cadastrar Novo Aluno
              </h2>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="rounded-lg p-1 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Nome Completo do Atleta *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-pitch w-full"
                    placeholder="Ex: Arthur Gomes"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
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
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Posição *
                  </label>
                  <select
                    value={position}
                    onChange={(e) =>
                      setPosition(e.target.value as PlayerPosition)
                    }
                    className="input-pitch w-full"
                  >
                    {PLAYER_POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Pé Dominante
                  </label>
                  <select
                    value={dominantFoot}
                    onChange={(e) =>
                      setDominantFoot(e.target.value as DominantFoot)
                    }
                    className="input-pitch w-full"
                  >
                    {DOMINANT_FEET.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Turma Inicial
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="input-pitch w-full"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatCurrencyBRL(c.monthly_fee_cents)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Observações de Saúde
                  </label>
                  <input
                    type="text"
                    value={healthNotes}
                    onChange={(e) => setHealthNotes(e.target.value)}
                    className="input-pitch w-full"
                    placeholder="Alergias, tipo sanguíneo..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Nome do Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="input-pitch w-full"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    WhatsApp do Responsável *
                  </label>
                  <input
                    type="tel"
                    required
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="11999999999"
                    className="input-pitch w-full font-mono"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
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
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Dia de Vencimento
                  </label>
                  <select
                    value={billingDay}
                    onChange={(e) =>
                      setBillingDay(Number(e.target.value) as BillingDay)
                    }
                    className="input-pitch w-full font-mono"
                  >
                    {BILLING_DAYS.map((d) => (
                      <option key={d} value={d}>
                        Todo dia {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-5 py-2 text-xs"
                >
                  {saving ? "Salvando..." : "Salvar Aluno"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

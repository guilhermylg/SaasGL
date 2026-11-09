"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  Calendar,
  Clock,
  Users,
  Trash2,
  CalendarClock,
  X,
} from "lucide-react";
import {
  SchoolClass,
  Student,
  DAYS_OF_WEEK,
  formatCurrencyBRL,
  formatTimeShort,
} from "@/types/database";
import {
  fetchClasses,
  fetchStudents,
  createSchoolClass,
  deleteSchoolClass,
} from "@/lib/data-service";

export default function ClassesDashboardPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de criação de turma
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [minAge, setMinAge] = useState(10);
  const [maxAge, setMaxAge] = useState(11);
  const [coachName, setCoachName] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(["Terça", "Quinta"]);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [monthlyFeeReais, setMonthlyFeeReais] = useState("175");
  const [maxStudents, setMaxStudents] = useState(25);
  const [saving, setSaving] = useState(false);

  const refreshAll = async () => {
    const [cData, sData] = await Promise.all([fetchClasses(), fetchStudents()]);
    setClasses(cData);
    setStudents(sData);
  };

  useEffect(() => {
    Promise.all([fetchClasses(), fetchStudents()])
      .then(([cData, sData]) => {
        setClasses(cData);
        setStudents(sData);
      })
      .finally(() => setLoading(false));
  }, []);

  const countByClass = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((s) => {
      if (s.class_id && s.status !== "inactive") {
        map.set(s.class_id, (map.get(s.class_id) || 0) + 1);
      }
    });
    return map;
  }, [students]);

  const toggleDay = (day: string) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !coachName.trim() || daysOfWeek.length === 0) return;

    setSaving(true);
    try {
      const feeCents = Math.round(
        (parseFloat(monthlyFeeReais.replace(",", ".")) || 150) * 100
      );
      await createSchoolClass({
        name: name.trim(),
        min_age: Number(minAge),
        max_age: Number(maxAge),
        coach_name: coachName.trim(),
        days_of_week: daysOfWeek,
        start_time: startTime,
        end_time: endTime,
        monthly_fee_cents: feeCents,
        max_students: Number(maxStudents),
      });
      setShowModal(false);
      setName("");
      setCoachName("");
      await refreshAll();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteSchoolClass(id);
    setClasses((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary flex items-center gap-2.5">
            <GraduationCap size={24} className="text-verde" />
            Turmas & Categorias da Escolinha
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Os dias e horários das turmas bloqueiam automaticamente a{" "}
            <Link
              href="/dashboard/court"
              className="text-verde underline hover:text-verde-light"
            >
              Agenda de Locação da Quadra
            </Link>{" "}
            e alimentam a triagem automática em <code>/matricula</code>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="btn-primary px-5 py-2.5 text-sm"
        >
          <Plus size={16} />
          Nova Turma / Categoria
        </button>
      </div>

      {/* Grid de Turmas */}
      {loading ? (
        <div className="card p-12 text-center text-sm text-text-muted">
          Carregando turmas e categorias...
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => {
            const enrolled = countByClass.get(cls.id) || 0;
            const occupancyPct = Math.min(
              100,
              Math.round((enrolled / Math.max(1, cls.max_students)) * 100)
            );

            return (
              <div
                key={cls.id}
                className="card p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block rounded bg-verde/15 px-2.5 py-0.5 font-mono text-xs font-bold text-verde mb-1.5">
                        {cls.min_age} a {cls.max_age} anos
                      </span>
                      <h2 className="text-lg font-bold text-text-primary">
                        {cls.name}
                      </h2>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {cls.coach_name}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-lg font-extrabold text-verde">
                        {formatCurrencyBRL(cls.monthly_fee_cents)}
                      </div>
                      <span className="text-[11px] text-text-muted">
                        mensalidade
                      </span>
                    </div>
                  </div>

                  {/* Dias e Horário */}
                  <div className="rounded-xl border border-pitch-border bg-pitch-bg-alt p-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-text-primary font-medium">
                      <Calendar size={14} className="text-amarelo shrink-0" />
                      <span>{cls.days_of_week.join(" · ")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary font-mono">
                      <Clock size={14} className="text-verde shrink-0" />
                      <span>
                        {formatTimeShort(cls.start_time)} às{" "}
                        {formatTimeShort(cls.end_time)} (Bloqueia Quadra)
                      </span>
                    </div>
                  </div>

                  {/* Barra de vagas */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-text-secondary">
                        <Users size={13} className="text-verde" />
                        Ocupação da Turma
                      </span>
                      <span className="font-mono font-bold text-text-primary">
                        {enrolled}/{cls.max_students} atletas ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-pitch-bg-alt">
                      <div
                        className="h-full rounded-full bg-verde transition-all"
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-pitch-border pt-3">
                  <Link
                    href="/dashboard/court"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-verde"
                  >
                    <CalendarClock size={14} />
                    Ver na Grade da Quadra
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(cls.id)}
                    title="Remover turma"
                    className="rounded-lg p-1.5 text-text-muted hover:bg-vermelho/15 hover:text-vermelho-light transition cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nova Turma */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-pitch-border pb-3">
              <h2 className="text-lg font-bold text-text-primary">
                Criar Nova Turma da Escolinha
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-text-secondary">
                  Nome da Turma / Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Sub-11 Tarde Competição"
                  className="input-pitch w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Idade Mínima (anos) *
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={20}
                    required
                    value={minAge}
                    onChange={(e) => setMinAge(Number(e.target.value))}
                    className="input-pitch w-full font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Idade Máxima (anos) *
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={20}
                    required
                    value={maxAge}
                    onChange={(e) => setMaxAge(Number(e.target.value))}
                    className="input-pitch w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-text-secondary">
                  Professor / Treinador Responsável *
                </label>
                <input
                  type="text"
                  required
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  placeholder="Ex: Prof. Marcos Vinícius"
                  className="input-pitch w-full"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                  Dias de Treino na Semana *
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const active = daysOfWeek.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                          active
                            ? "border-verde bg-verde/15 text-verde"
                            : "border-pitch-border bg-pitch-bg-alt text-text-secondary"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Horário de Início *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input-pitch w-full font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Horário de Término *
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="input-pitch w-full font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Mensalidade (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={monthlyFeeReais}
                    onChange={(e) => setMonthlyFeeReais(e.target.value)}
                    className="input-pitch w-full font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Limite de Alunos *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(Number(e.target.value))}
                    className="input-pitch w-full font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-5 py-2 text-xs"
                >
                  {saving ? "Salvando..." : "Criar Turma"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

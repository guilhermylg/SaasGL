"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Plus,
  Calendar,
  Clock,
  Users,
  Trash2,
  CalendarClock,
  X,
  Lock,
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
          <h1 className="font-[family-name:var(--font-montserrat)] text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Trophy size={24} className="text-emerald-600" />
            Turmas & Categorias da Escolinha
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Os horários das turmas bloqueiam automaticamente a{" "}
            <Link
              href="/dashboard/quadra"
              className="font-semibold text-emerald-600 underline hover:text-emerald-700"
            >
              Agenda da Quadra
            </Link>{" "}
            (impedindo conflito com locações avulsas) e alimentam a triagem em <code>/matricula</code>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="btn-primary !text-xs sm:!text-sm"
        >
          <Plus size={16} />
          <span>Nova Turma / Categoria</span>
        </button>
      </div>

      {/* Grid de Turmas */}
      {loading ? (
        <div className="card p-12 text-center text-sm text-slate-500">
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
                className="rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 font-mono text-xs font-bold mb-2">
                        {cls.min_age} a {cls.max_age} anos
                      </span>
                      <h2 className="font-[family-name:var(--font-montserrat)] text-lg font-bold text-slate-900 leading-tight">
                        {cls.name}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        Professor: {cls.coach_name}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="font-[family-name:var(--font-montserrat)] text-xl font-black text-emerald-700">
                        {formatCurrencyBRL(cls.monthly_fee_cents)}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        mensalidade
                      </span>
                    </div>
                  </div>

                  {/* Dias e Horário com Badge de Bloqueio da Quadra */}
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-indigo-900 font-semibold">
                      <Calendar size={14} className="text-indigo-600 shrink-0" />
                      <span>{cls.days_of_week.join(" · ")}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-indigo-700 font-mono">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Clock size={14} className="text-indigo-600 shrink-0" />
                        {formatTimeShort(cls.start_time)} às{" "}
                        {formatTimeShort(cls.end_time)}
                      </span>
                      <span className="inline-flex items-center gap-1 font-sans text-[10px] font-bold uppercase tracking-wider bg-indigo-100 border border-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded">
                        <Lock size={10} />
                        Trava Quadra
                      </span>
                    </div>
                  </div>

                  {/* Barra de Ocupação */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Users size={14} className="text-emerald-600" />
                        Ocupação da Turma
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {enrolled}/{cls.max_students} ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <Link
                    href="/dashboard/quadra"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition"
                  >
                    <CalendarClock size={14} />
                    <span>Ver na Grade da Quadra</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(cls.id)}
                    title="Remover turma"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-[family-name:var(--font-montserrat)] text-lg font-bold text-slate-900">
                Criar Nova Turma da Escolinha
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Nome da Turma / Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Sub-11 Tarde Formação"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Idade Mínima (anos) *
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={20}
                    required
                    value={minAge}
                    onChange={(e) => setMinAge(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Idade Máxima (anos) *
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={20}
                    required
                    value={maxAge}
                    onChange={(e) => setMaxAge(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Professor / Treinador Responsável *
                </label>
                <input
                  type="text"
                  required
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  placeholder="Ex: Prof. Marcos Vinícius"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
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
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Horário de Início *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Horário de Término *
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Mensalidade (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={monthlyFeeReais}
                    onChange={(e) => setMonthlyFeeReais(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Vagas Máximas *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary !text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary !text-xs"
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

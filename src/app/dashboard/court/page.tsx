"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Plus,
  GraduationCap,
  CheckCircle2,
  Clock,
  MessageCircle,
  Lock,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
} from "lucide-react";
import {
  SchoolClass,
  CourtBooking,
  BookingType,
  DayOfWeek,
  formatCurrencyBRL,
  formatPhoneWhatsApp,
  formatTimeShort,
} from "@/types/database";
import {
  fetchClasses,
  fetchCourtBookings,
  createCourtBooking,
  updateCourtBooking,
  requestStripeCheckoutLink,
} from "@/lib/data-service";

// Horários das 07:00 às 23:00 (16 faixas de 1h)
const COURT_HOURS = Array.from({ length: 16 }, (_, i) => {
  const start = i + 7;
  const end = start + 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    hour: start,
    startTime: `${pad(start)}:00`,
    endTime: `${pad(end)}:00`,
    label: `${pad(start)}:00 - ${pad(end)}:00`,
  };
});

const JS_DAY_TO_PT: Record<number, DayOfWeek> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CourtSchedulePage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [bookings, setBookings] = useState<CourtBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly");
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    formatDateISO(new Date())
  );

  // Modal de nova reserva
  const [bookingModal, setBookingModal] = useState<{
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [bookingType, setBookingType] = useState<BookingType>("avulso");
  const [priceReais, setPriceReais] = useState("180");
  const [notes, setNotes] = useState("");
  const [generateStripeOnCreate, setGenerateStripeOnCreate] = useState(true);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [savingBooking, setSavingBooking] = useState(false);

  // Modal de detalhe de locação existente
  const [selectedBooking, setSelectedBooking] = useState<CourtBooking | null>(
    null
  );
  const [generatingStripeId, setGeneratingStripeId] = useState<string | null>(
    null
  );

  const loadAll = async () => {
    const [cData, bData] = await Promise.all([
      fetchClasses(),
      fetchCourtBookings(),
    ]);
    setClasses(cData);
    setBookings(bData);
  };

  useEffect(() => {
    Promise.all([fetchClasses(), fetchCourtBookings()])
      .then(([cData, bData]) => {
        setClasses(cData);
        setBookings(bData);
      })
      .finally(() => setLoading(false));
  }, []);

  // Dias da semana da data selecionada (Seg a Dom)
  const weekDays = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const baseDate = new Date(y, m - 1, d);
    const monday = getMondayOfWeek(baseDate);
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(monday);
      dt.setDate(monday.getDate() + i);
      const iso = formatDateISO(dt);
      const dayName = JS_DAY_TO_PT[dt.getDay()];
      return {
        iso,
        dayName,
        shortDate: `${String(dt.getDate()).padStart(2, "0")}/${String(
          dt.getMonth() + 1
        ).padStart(2, "0")}`,
      };
    });
  }, [selectedDate]);

  // Verifica se um slot (dateISO, hour) está ocupado por Turma da Escolinha
  const getClassForSlot = (
    dateIso: string,
    hour: number
  ): SchoolClass | null => {
    const [y, m, d] = dateIso.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const dayName = JS_DAY_TO_PT[dt.getDay()];

    for (const cls of classes) {
      if (!cls.days_of_week.includes(dayName)) continue;
      const startH = parseInt(cls.start_time.split(":")[0], 10);
      const endH = parseInt(cls.end_time.split(":")[0], 10);
      if (hour >= startH && hour < endH) {
        return cls;
      }
    }
    return null;
  };

  // Verifica se um slot (dateISO, hour) está ocupado por Locação Externa Ativa
  const getBookingForSlot = (
    dateIso: string,
    hour: number
  ): CourtBooking | null => {
    for (const b of bookings) {
      if (b.booking_date !== dateIso || b.payment_status === "cancelled") {
        continue;
      }
      const startH = parseInt(b.start_time.split(":")[0], 10);
      const endH = parseInt(b.end_time.split(":")[0], 10);
      if (hour >= startH && hour < endH) {
        return b;
      }
    }
    return null;
  };

  const openNewBookingModal = (
    dateIso: string,
    startTime: string,
    endTime: string
  ) => {
    setConflictError(null);
    setClientName("");
    setClientPhone("");
    setBookingType("avulso");
    setPriceReais("180");
    setNotes("");
    setBookingModal({ date: dateIso, startTime, endTime });
  };

  // Validação de conflito (Escolinha + Locações Ativas) e criação
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModal) return;
    setConflictError(null);

    const startH = parseInt(bookingModal.startTime.split(":")[0], 10);
    const endH = parseInt(bookingModal.endTime.split(":")[0], 10);

    if (endH <= startH) {
      setConflictError(
        "O horário de término deve ser posterior ao horário de início."
      );
      return;
    }

    // Verifica conflito em todas as horas do intervalo
    for (let h = startH; h < endH; h++) {
      const conflictingClass = getClassForSlot(bookingModal.date, h);
      if (conflictingClass) {
        setConflictError(
          `Conflito de horário: A turma "${conflictingClass.name}" treina neste horário (${formatTimeShort(conflictingClass.start_time)} às ${formatTimeShort(conflictingClass.end_time)}).`
        );
        return;
      }

      const conflictingBooking = getBookingForSlot(bookingModal.date, h);
      if (conflictingBooking) {
        setConflictError(
          `Conflito de horário: Já existe uma reserva ativa para "${conflictingBooking.client_name}" das ${formatTimeShort(conflictingBooking.start_time)} às ${formatTimeShort(conflictingBooking.end_time)}.`
        );
        return;
      }
    }

    setSavingBooking(true);
    try {
      const priceCents = Math.round(
        (parseFloat(priceReais.replace(",", ".")) || 180) * 100
      );

      const created = await createCourtBooking({
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        booking_date: bookingModal.date,
        start_time: bookingModal.startTime,
        end_time: bookingModal.endTime,
        booking_type: bookingType,
        price_cents: priceCents,
        payment_status: "pending",
        stripe_checkout_url: null,
        notes: notes.trim(),
      });

      if (generateStripeOnCreate) {
        const checkout = await requestStripeCheckoutLink({
          type: "court_booking",
          recordId: created.id,
          title: `Locação de Quadra (${bookingType.toUpperCase()}) — ${created.client_name}`,
          description: `Data: ${created.booking_date.split("-").reverse().join("/")} das ${formatTimeShort(created.start_time)} às ${formatTimeShort(created.end_time)}`,
          amountCents: priceCents,
          customerName: created.client_name,
        });

        await updateCourtBooking(created.id, {
          stripe_checkout_url: checkout.url,
        });
      }

      setBookingModal(null);
      await loadAll();
    } catch (err) {
      setConflictError(
        err instanceof Error ? err.message : "Erro ao criar reserva."
      );
    } finally {
      setSavingBooking(false);
    }
  };

  const handleBookingStripeWhatsApp = async (booking: CourtBooking) => {
    setGeneratingStripeId(booking.id);
    try {
      let checkoutUrl = booking.stripe_checkout_url;
      if (!checkoutUrl) {
        const res = await requestStripeCheckoutLink({
          type: "court_booking",
          recordId: booking.id,
          title: `Locação de Quadra — ${booking.client_name}`,
          description: `Horário: ${booking.booking_date.split("-").reverse().join("/")} · ${formatTimeShort(booking.start_time)} às ${formatTimeShort(booking.end_time)}`,
          amountCents: booking.price_cents,
          customerName: booking.client_name,
        });
        checkoutUrl = res.url;
        const updated = await updateCourtBooking(booking.id, {
          stripe_checkout_url: checkoutUrl,
        });
        if (updated) setSelectedBooking(updated);
        await loadAll();
      }

      if (checkoutUrl) {
        const waPhone = formatPhoneWhatsApp(booking.client_phone);
        const msg = encodeURIComponent(
          `Olá ${booking.client_name}! Sua reserva da quadra para ${booking.booking_date.split("-").reverse().join("/")} (${formatTimeShort(booking.start_time)} às ${formatTimeShort(booking.end_time)}) está pré-agendada. Valor: ${formatCurrencyBRL(booking.price_cents)}.\n\nGaranta o horário pagando pelo link Stripe:\n${checkoutUrl}`
        );
        window.open(`https://wa.me/${waPhone}?text=${msg}`, "_blank");
      }
    } finally {
      setGeneratingStripeId(null);
    }
  };

  const handleUpdateBookingStatus = async (
    bookingId: string,
    paymentStatus: "paid" | "pending" | "cancelled"
  ) => {
    const updated = await updateCourtBooking(bookingId, {
      payment_status: paymentStatus,
    });
    if (updated) setSelectedBooking(updated);
    await loadAll();
  };

  const shiftDays = (deltaDays: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + deltaDays);
    setSelectedDate(formatDateISO(dt));
  };

  const displayedDays = useMemo(() => {
    if (viewMode === "weekly") return weekDays;
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return [
      {
        iso: selectedDate,
        dayName: JS_DAY_TO_PT[dt.getDay()],
        shortDate: `${String(dt.getDate()).padStart(2, "0")}/${String(
          dt.getMonth() + 1
        ).padStart(2, "0")}`,
      },
    ];
  }, [viewMode, weekDays, selectedDate]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary flex items-center gap-2.5">
            <CalendarClock size={24} className="text-verde" />
            Grade Híbrida de Ocupação da Quadra (07:00 às 23:00)
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Turmas da escolinha bloqueiam automaticamente a agenda, impedindo{" "}
            <em>double booking</em> com locações avulsas ou mensalistas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Navegação de Data */}
          <div className="flex items-center gap-1 rounded-xl border border-pitch-border bg-pitch-surface p-1">
            <button
              type="button"
              onClick={() => shiftDays(viewMode === "weekly" ? -7 : -1)}
              className="rounded-lg p-1.5 text-text-secondary hover:bg-pitch-surface-hover hover:text-text-primary cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent px-2 text-xs font-mono font-bold text-text-primary outline-none"
            />
            <button
              type="button"
              onClick={() => shiftDays(viewMode === "weekly" ? 7 : 1)}
              className="rounded-lg p-1.5 text-text-secondary hover:bg-pitch-surface-hover hover:text-text-primary cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Alternar Semanal / Diária */}
          <div className="inline-flex rounded-xl border border-pitch-border bg-pitch-surface p-1">
            <button
              type="button"
              onClick={() => setViewMode("weekly")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                viewMode === "weekly"
                  ? "bg-verde text-[#0a0f0b]"
                  : "text-text-secondary"
              }`}
            >
              Grade Semanal
            </button>
            <button
              type="button"
              onClick={() => setViewMode("daily")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                viewMode === "daily"
                  ? "bg-verde text-[#0a0f0b]"
                  : "text-text-secondary"
              }`}
            >
              Visão Diária
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              openNewBookingModal(selectedDate, "20:00", "21:00")
            }
            className="btn-primary px-4 py-2 text-xs"
          >
            <Plus size={15} />
            + Reservar Horário
          </button>
        </div>
      </div>

      {/* Legenda da Grade Híbrida */}
      <div className="card p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-2 font-semibold text-sky-400">
            <span className="h-3 w-3 rounded bg-sky-500/30 border border-sky-400" />
            Treino Fixo da Escolinha (Bloqueado)
          </span>
          <span className="inline-flex items-center gap-2 font-semibold text-verde">
            <span className="h-3 w-3 rounded bg-verde/30 border border-verde" />
            Aluguel Confirmado (Pago)
          </span>
          <span className="inline-flex items-center gap-2 font-semibold text-amarelo-light">
            <span className="h-3 w-3 rounded bg-amarelo/30 border border-amarelo" />
            Aluguel Pendente (Aguardando Stripe)
          </span>
          <span className="inline-flex items-center gap-2 text-text-muted">
            <span className="h-3 w-3 rounded border border-pitch-border bg-pitch-bg-alt" />
            Horário Livre (+ Reservar)
          </span>
        </div>
      </div>

      {/* Tabela da Grade 07:00 às 23:00 */}
      {loading ? (
        <div className="card p-12 text-center text-sm text-text-muted">
          Carregando grade de ocupação da quadra...
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-pitch-border bg-pitch-bg-alt">
                  <th className="sticky left-0 z-10 w-28 bg-pitch-bg-alt px-3 py-3 font-mono font-bold text-text-muted">
                    Horário
                  </th>
                  {displayedDays.map((d) => {
                    const isToday = d.iso === formatDateISO(new Date());
                    return (
                      <th
                        key={d.iso}
                        className={`min-w-[155px] px-3 py-3 text-center ${
                          isToday ? "bg-verde/10" : ""
                        }`}
                      >
                        <div
                          className={`font-bold ${
                            isToday ? "text-verde" : "text-text-primary"
                          }`}
                        >
                          {d.dayName}
                        </div>
                        <div className="font-mono text-[11px] text-text-muted">
                          {d.shortDate}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-pitch-border">
                {COURT_HOURS.map((slot) => (
                  <tr key={slot.hour} className="hover:bg-pitch-surface/40">
                    {/* Coluna de Horário */}
                    <td className="sticky left-0 z-10 bg-pitch-surface px-3 py-2.5 font-mono text-xs font-bold text-text-secondary border-r border-pitch-border">
                      {slot.label}
                    </td>

                    {/* Células por Dia */}
                    {displayedDays.map((day) => {
                      const schoolClass = getClassForSlot(day.iso, slot.hour);
                      const booking = getBookingForSlot(day.iso, slot.hour);

                      // 1. Bloqueado por Turma da Escolinha (Azul/Roxo)
                      if (schoolClass) {
                        return (
                          <td
                            key={day.iso}
                            className="p-1.5 align-top border-r border-pitch-border/50"
                          >
                            <div className="h-full rounded-lg border border-sky-500/40 bg-sky-500/15 p-2.5 text-sky-200">
                              <div className="flex items-center justify-between gap-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                                  <GraduationCap size={12} />
                                  Escolinha
                                </span>
                                <Lock size={11} className="text-sky-400" />
                              </div>
                              <div className="mt-1 font-bold text-xs text-white truncate">
                                {schoolClass.name}
                              </div>
                              <div className="text-[10px] text-sky-300/90 truncate">
                                {schoolClass.coach_name}
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // 2. Ocupado por Aluguel de Cliente Externo (Verde se pago, Amarelo se pendente)
                      if (booking) {
                        const isPaid = booking.payment_status === "paid";
                        return (
                          <td
                            key={day.iso}
                            className="p-1.5 align-top border-r border-pitch-border/50"
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedBooking(booking)}
                              className={`w-full text-left rounded-lg border p-2.5 transition cursor-pointer ${
                                isPaid
                                  ? "border-verde/40 bg-verde/15 hover:bg-verde/25"
                                  : "border-amarelo/40 bg-amarelo/15 hover:bg-amarelo/25"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`text-[10px] font-bold uppercase ${
                                    isPaid
                                      ? "text-verde"
                                      : "text-amarelo-light"
                                  }`}
                                >
                                  {booking.booking_type}
                                </span>
                                {isPaid ? (
                                  <CheckCircle2
                                    size={12}
                                    className="text-verde"
                                  />
                                ) : (
                                  <Clock
                                    size={12}
                                    className="text-amarelo-light"
                                  />
                                )}
                              </div>
                              <div className="mt-1 font-bold text-xs text-text-primary truncate">
                                {booking.client_name}
                              </div>
                              <div className="mt-0.5 font-mono text-[11px] font-semibold text-text-secondary">
                                {formatCurrencyBRL(booking.price_cents)}
                              </div>
                            </button>
                          </td>
                        );
                      }

                      // 3. Horário Livre (+ Reservar Horário)
                      return (
                        <td
                          key={day.iso}
                          className="p-1.5 align-middle border-r border-pitch-border/50"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openNewBookingModal(
                                day.iso,
                                slot.startTime,
                                slot.endTime
                              )
                            }
                            className="group flex h-16 w-full items-center justify-center rounded-lg border border-dashed border-pitch-border/70 bg-pitch-bg-alt/40 text-[11px] font-medium text-text-muted transition hover:border-verde hover:bg-verde/10 hover:text-verde cursor-pointer"
                          >
                            <span className="opacity-60 group-hover:opacity-100 group-hover:font-bold">
                              + Reservar Horário
                            </span>
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

      {/* Modal: Nova Reserva de Horário */}
      {bookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="card w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-pitch-border pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-verde">
                  Nova Locação de Quadra
                </span>
                <h2 className="text-lg font-bold text-text-primary">
                  Reservar Horário ({bookingModal.date.split("-").reverse().join("/")})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBookingModal(null)}
                className="rounded-lg p-1 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {conflictError && (
              <div className="flex items-start gap-2 rounded-xl border border-vermelho/40 bg-vermelho/15 p-3.5 text-xs text-vermelho-light">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{conflictError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingModal.date}
                    onChange={(e) =>
                      setBookingModal({ ...bookingModal, date: e.target.value })
                    }
                    className="input-pitch w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Início *
                  </label>
                  <select
                    value={bookingModal.startTime}
                    onChange={(e) => {
                      const st = e.target.value;
                      const h = parseInt(st.split(":")[0], 10);
                      const nextEnd = `${String(h + 1).padStart(2, "0")}:00`;
                      setBookingModal({
                        ...bookingModal,
                        startTime: st,
                        endTime: nextEnd,
                      });
                    }}
                    className="input-pitch w-full text-xs font-mono"
                  >
                    {COURT_HOURS.map((h) => (
                      <option key={h.startTime} value={h.startTime}>
                        {h.startTime}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Término *
                  </label>
                  <select
                    value={bookingModal.endTime}
                    onChange={(e) =>
                      setBookingModal({
                        ...bookingModal,
                        endTime: e.target.value,
                      })
                    }
                    className="input-pitch w-full text-xs font-mono"
                  >
                    {COURT_HOURS.map((h) => (
                      <option key={h.endTime} value={h.endTime}>
                        {h.endTime}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Nome do Cliente / Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Diego Souza & Amigos"
                    className="input-pitch w-full"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    WhatsApp do Cliente *
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="11999999999"
                    className="input-pitch w-full font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Modalidade
                  </label>
                  <select
                    value={bookingType}
                    onChange={(e) =>
                      setBookingType(e.target.value as BookingType)
                    }
                    className="input-pitch w-full"
                  >
                    <option value="avulso">Locação Avulsa</option>
                    <option value="mensalista">Horário Mensalista</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text-secondary">
                    Valor da Reserva (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={priceReais}
                    onChange={(e) => setPriceReais(e.target.value)}
                    className="input-pitch w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-text-secondary">
                  Observações (Coletes, Churrasqueira, Bola)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Opcional"
                  className="input-pitch w-full"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateStripeOnCreate}
                  onChange={(e) => setGenerateStripeOnCreate(e.target.checked)}
                  className="h-4 w-4 accent-verde"
                />
                <span>
                  Gerar link de pagamento Stripe Checkout automaticamente ao
                  salvar
                </span>
              </label>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingModal(null)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingBooking}
                  className="btn-primary px-5 py-2 text-xs"
                >
                  {savingBooking ? "Validando e Salvando..." : "Confirmar Reserva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalhes de Locação Existente */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="card w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-pitch-border pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-verde">
                  Reserva #{selectedBooking.id.slice(0, 6)}
                </span>
                <h3 className="text-lg font-bold text-text-primary">
                  {selectedBooking.client_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-lg p-1 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl border border-pitch-border bg-pitch-bg-alt p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Data e Horário:</span>
                <span className="font-mono font-bold text-text-primary">
                  {selectedBooking.booking_date.split("-").reverse().join("/")}{" "}
                  · {formatTimeShort(selectedBooking.start_time)} às{" "}
                  {formatTimeShort(selectedBooking.end_time)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">WhatsApp:</span>
                <span className="font-mono text-text-primary">
                  {selectedBooking.client_phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Tipo:</span>
                <span className="font-semibold uppercase text-amarelo">
                  {selectedBooking.booking_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Valor:</span>
                <span className="font-mono font-bold text-verde">
                  {formatCurrencyBRL(selectedBooking.price_cents)}
                </span>
              </div>
              {selectedBooking.notes && (
                <div className="pt-1 text-text-secondary">
                  <strong>Obs:</strong> {selectedBooking.notes}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={generatingStripeId === selectedBooking.id}
              onClick={() => handleBookingStripeWhatsApp(selectedBooking)}
              className="btn-primary w-full py-2.5 text-xs"
            >
              <MessageCircle size={15} />
              {generatingStripeId === selectedBooking.id
                ? "Gerando Link Stripe..."
                : "Gerar Link Stripe & Enviar no WhatsApp"}
            </button>

            <div className="border-t border-pitch-border pt-3">
              <span className="mb-2 block text-[11px] font-semibold uppercase text-text-muted">
                Status do Pagamento / Reserva:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateBookingStatus(selectedBooking.id, "paid")
                  }
                  className={`rounded-lg border py-2 text-xs font-bold cursor-pointer ${
                    selectedBooking.payment_status === "paid"
                      ? "border-verde bg-verde/20 text-verde"
                      : "border-pitch-border text-text-secondary"
                  }`}
                >
                  Pago
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateBookingStatus(selectedBooking.id, "pending")
                  }
                  className={`rounded-lg border py-2 text-xs font-bold cursor-pointer ${
                    selectedBooking.payment_status === "pending"
                      ? "border-amarelo bg-amarelo/20 text-amarelo-light"
                      : "border-pitch-border text-text-secondary"
                  }`}
                >
                  Pendente
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateBookingStatus(selectedBooking.id, "cancelled")
                  }
                  className="rounded-lg border border-pitch-border py-2 text-xs font-bold text-vermelho-light hover:bg-vermelho/15 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Plus,
  Trophy,
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

    // Verifica conflito em cada hora
    for (let h = startH; h < endH; h++) {
      const conflictingClass = getClassForSlot(bookingModal.date, h);
      if (conflictingClass) {
        setConflictError(
          `Conflito: A turma "${conflictingClass.name}" tem treino agendado neste horário (${formatTimeShort(conflictingClass.start_time)} às ${formatTimeShort(conflictingClass.end_time)}).`
        );
        return;
      }

      const conflictingBooking = getBookingForSlot(bookingModal.date, h);
      if (conflictingBooking) {
        setConflictError(
          `Conflito: Já existe reserva para "${conflictingBooking.client_name}" das ${formatTimeShort(conflictingBooking.start_time)} às ${formatTimeShort(conflictingBooking.end_time)}.`
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
        err instanceof Error ? err.message : "Erro ao registrar reserva."
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
          `Olá ${booking.client_name}! Sua reserva da quadra para ${booking.booking_date.split("-").reverse().join("/")} (${formatTimeShort(booking.start_time)} às ${formatTimeShort(booking.end_time)}) está pré-agendada no valor de ${formatCurrencyBRL(booking.price_cents)}.\n\nGaranta sua vaga pagando pelo link Stripe:\n${checkoutUrl}`
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
          <h1 className="font-[family-name:var(--font-montserrat)] text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <CalendarClock size={24} className="text-emerald-600" />
            Agenda da Quadra (Grade Híbrida 07:00 às 23:00)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            As turmas fixas da escolinha bloqueiam a agenda automaticamente,
            eliminando o risco de <em>double booking</em> com aluguéis avulsos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Data */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => shiftDays(viewMode === "weekly" ? -7 : -1)}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent px-2 text-xs font-mono font-bold text-slate-800 outline-none"
            />
            <button
              type="button"
              onClick={() => shiftDays(viewMode === "weekly" ? 7 : 1)}
              className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Toggle Semanal / Diária */}
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("weekly")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                viewMode === "weekly"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semanal
            </button>
            <button
              type="button"
              onClick={() => setViewMode("daily")}
              className={`rounded px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                viewMode === "daily"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Diária
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              openNewBookingModal(selectedDate, "20:00", "21:00")
            }
            className="btn-primary !text-xs"
          >
            <Plus size={15} />
            <span>+ Reservar Horário</span>
          </button>
        </div>
      </div>

      {/* Legenda dos Slots com cores semânticas */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-5">
          <span className="inline-flex items-center gap-2 font-semibold text-indigo-800">
            <span className="h-3.5 w-3.5 rounded border border-indigo-300 court-locked-stripe" />
            Turma da Escolinha (Bloqueio Fixo)
          </span>
          <span className="inline-flex items-center gap-2 font-semibold text-emerald-800">
            <span className="h-3.5 w-3.5 rounded bg-emerald-100 border border-emerald-300" />
            Aluguel Confirmado (Pago)
          </span>
          <span className="inline-flex items-center gap-2 font-semibold text-amber-800">
            <span className="h-3.5 w-3.5 rounded bg-amber-100 border border-amber-300" />
            Aluguel Pendente (Aguardando Stripe)
          </span>
          <span className="inline-flex items-center gap-2 font-medium text-slate-500">
            <span className="h-3.5 w-3.5 rounded border border-dashed border-slate-300 bg-slate-50" />
            Horário Livre (+ Reservar)
          </span>
        </div>
      </div>

      {/* Grade de Horários 07:00 às 23:00 */}
      {loading ? (
        <div className="card p-12 text-center text-sm text-slate-500">
          Carregando grade da quadra...
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100 text-slate-700 font-mono">
                  <th className="sticky left-0 z-10 w-28 bg-slate-100 px-3 py-3 font-bold border-r border-slate-200">
                    Horário
                  </th>
                  {displayedDays.map((d) => {
                    const isToday = d.iso === formatDateISO(new Date());
                    return (
                      <th
                        key={d.iso}
                        className={`min-w-[160px] px-3 py-2.5 text-center border-r border-slate-200 ${
                          isToday ? "bg-emerald-50 text-emerald-800 font-bold" : ""
                        }`}
                      >
                        <div className="font-[family-name:var(--font-montserrat)] font-bold">
                          {d.dayName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {d.shortDate}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COURT_HOURS.map((slot) => (
                  <tr key={slot.hour} className="hover:bg-slate-50/50">
                    {/* Coluna de Horário */}
                    <td className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5 font-mono text-xs font-bold text-slate-700 border-r border-slate-200">
                      {slot.label}
                    </td>

                    {/* Slots por dia */}
                    {displayedDays.map((day) => {
                      const schoolClass = getClassForSlot(day.iso, slot.hour);
                      const booking = getBookingForSlot(day.iso, slot.hour);

                      // 1. Bloqueado por Turma da Escolinha (Hachurado Indigo)
                      if (schoolClass) {
                        return (
                          <td
                            key={day.iso}
                            className="p-1.5 align-top border-r border-slate-200"
                          >
                            <div className="h-full rounded-lg border border-indigo-200 court-locked-stripe p-2.5 text-indigo-900 shadow-2xs">
                              <div className="flex items-center justify-between gap-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                                  <Trophy size={11} />
                                  Escolinha
                                </span>
                                <Lock size={11} className="text-indigo-600" />
                              </div>
                              <div className="mt-1 font-[family-name:var(--font-montserrat)] font-bold text-xs text-indigo-950 truncate">
                                {schoolClass.name}
                              </div>
                              <div className="text-[10px] text-indigo-700 truncate font-medium">
                                {schoolClass.coach_name}
                              </div>
                            </div>
                          </td>
                        );
                      }

                      // 2. Aluguel Externo (Verde se pago, Amarelo se pendente)
                      if (booking) {
                        const isPaid = booking.payment_status === "paid";
                        return (
                          <td
                            key={day.iso}
                            className="p-1.5 align-top border-r border-slate-200"
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedBooking(booking)}
                              className={`w-full text-left rounded-lg border p-2.5 transition cursor-pointer shadow-2xs ${
                                isPaid
                                  ? "border-emerald-300 bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900"
                                  : "border-amber-300 bg-amber-100/80 hover:bg-amber-200 text-amber-900"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider ${
                                    isPaid
                                      ? "text-emerald-800"
                                      : "text-amber-800"
                                  }`}
                                >
                                  {booking.booking_type}
                                </span>
                                {isPaid ? (
                                  <CheckCircle2
                                    size={12}
                                    className="text-emerald-700"
                                  />
                                ) : (
                                  <Clock
                                    size={12}
                                    className="text-amber-700"
                                  />
                                )}
                              </div>
                              <div className="mt-1 font-[family-name:var(--font-montserrat)] font-bold text-xs truncate">
                                {booking.client_name}
                              </div>
                              <div className="mt-0.5 font-mono text-[11px] font-bold">
                                {formatCurrencyBRL(booking.price_cents)}
                              </div>
                            </button>
                          </td>
                        );
                      }

                      // 3. Horário Livre
                      return (
                        <td
                          key={day.iso}
                          className="p-1.5 align-middle border-r border-slate-200"
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
                            className="group flex h-16 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 text-[11px] font-semibold text-slate-400 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
                          >
                            <span className="opacity-75 group-hover:opacity-100">
                              + Reservar
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

      {/* Modal Nova Reserva */}
      {bookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold uppercase text-emerald-600">
                  Nova Locação de Quadra
                </span>
                <h2 className="font-[family-name:var(--font-montserrat)] text-lg font-bold text-slate-900">
                  Reservar ({bookingModal.date.split("-").reverse().join("/")})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBookingModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {conflictError && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{conflictError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingModal.date}
                    onChange={(e) =>
                      setBookingModal({ ...bookingModal, date: e.target.value })
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
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
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {COURT_HOURS.map((h) => (
                      <option key={h.startTime} value={h.startTime}>
                        {h.startTime}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
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
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500 cursor-pointer"
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
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Diego Souza"
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    WhatsApp do Cliente *
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="11999999999"
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Tipo de Locação
                  </label>
                  <select
                    value={bookingType}
                    onChange={(e) =>
                      setBookingType(e.target.value as BookingType)
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="avulso">Avulso</option>
                    <option value="mensalista">Mensalista</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={priceReais}
                    onChange={(e) => setPriceReais(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Observações (Coletes, Churrasqueira)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Opcional"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateStripeOnCreate}
                  onChange={(e) => setGenerateStripeOnCreate(e.target.checked)}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span>Gerar link de pagamento Stripe automaticamente</span>
              </label>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBookingModal(null)}
                  className="btn-secondary !text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingBooking}
                  className="btn-primary !text-xs"
                >
                  {savingBooking ? "Validando..." : "Confirmar Reserva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes Reserva */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold uppercase text-emerald-600">
                  Reserva #{selectedBooking.id.slice(0, 6)}
                </span>
                <h3 className="font-[family-name:var(--font-montserrat)] text-lg font-bold text-slate-900">
                  {selectedBooking.client_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Data e Horário:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {selectedBooking.booking_date.split("-").reverse().join("/")}{" "}
                  · {formatTimeShort(selectedBooking.start_time)} às{" "}
                  {formatTimeShort(selectedBooking.end_time)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">WhatsApp:</span>
                <span className="font-mono text-slate-900">
                  {selectedBooking.client_phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tipo:</span>
                <span className="font-semibold uppercase text-amber-700">
                  {selectedBooking.booking_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor:</span>
                <span className="font-[family-name:var(--font-montserrat)] font-black text-emerald-700">
                  {formatCurrencyBRL(selectedBooking.price_cents)}
                </span>
              </div>
              {selectedBooking.notes && (
                <div className="pt-1 text-slate-600">
                  <strong>Obs:</strong> {selectedBooking.notes}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={generatingStripeId === selectedBooking.id}
              onClick={() => handleBookingStripeWhatsApp(selectedBooking)}
              className="btn-primary w-full !text-xs !py-2.5 shadow-2xs"
            >
              <MessageCircle size={15} />
              <span>
                {generatingStripeId === selectedBooking.id
                  ? "Gerando Link..."
                  : "Gerar Link Stripe & Abrir WhatsApp"}
              </span>
            </button>

            <div className="border-t border-slate-100 pt-3">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Status do Aluguel:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateBookingStatus(selectedBooking.id, "paid")
                  }
                  className={`rounded-lg border py-2 text-xs font-bold cursor-pointer transition ${
                    selectedBooking.payment_status === "paid"
                      ? "border-emerald-600 bg-emerald-100 text-emerald-800"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Pago
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateBookingStatus(selectedBooking.id, "pending")
                  }
                  className={`rounded-lg border py-2 text-xs font-bold cursor-pointer transition ${
                    selectedBooking.payment_status === "pending"
                      ? "border-amber-500 bg-amber-100 text-amber-800"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Pendente
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateBookingStatus(selectedBooking.id, "cancelled")
                  }
                  className="rounded-lg border border-slate-300 bg-white py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 cursor-pointer transition"
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

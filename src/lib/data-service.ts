import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  generateInitialPayments,
  generateInitialBookings,
} from "@/lib/seed-data";
import {
  SchoolClass,
  Student,
  StudentPayment,
  CourtBooking,
  StudentPaymentStatus,
} from "@/types/database";

const STORAGE_KEYS = {
  classes: "saasgl_classes_v1",
  students: "saasgl_students_v1",
  payments: "saasgl_student_payments_v1",
  bookings: "saasgl_court_bookings_v1",
};

function readLocal<T>(key: string, fallback: () => T): T {
  if (typeof window === "undefined") return fallback();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      const initial = fallback();
      window.localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback();
  }
}

function writeLocal<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore storage quota errors
  }
}

// ============================================================
// 1. CLASSES (Turmas da Escolinha)
// ============================================================
export async function fetchClasses(): Promise<SchoolClass[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .order("min_age", { ascending: true });

    if (!error && data && data.length > 0) {
      return data as SchoolClass[];
    }
    if (!error && data && data.length === 0) {
      // Seed automático caso a tabela no Supabase esteja vazia
      const { data: seeded, error: seedErr } = await supabase
        .from("classes")
        .upsert(INITIAL_CLASSES)
        .select("*");
      if (!seedErr && seeded) {
        return seeded as SchoolClass[];
      }
    }
  }
  return readLocal<SchoolClass[]>(STORAGE_KEYS.classes, () => INITIAL_CLASSES);
}

export async function createSchoolClass(
  payload: Omit<SchoolClass, "id" | "created_at">
): Promise<SchoolClass> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("classes")
      .insert([payload])
      .select("*")
      .single();
    if (!error && data) {
      return data as SchoolClass;
    }
  }

  const newClass: SchoolClass = {
    ...payload,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  const current = readLocal<SchoolClass[]>(
    STORAGE_KEYS.classes,
    () => INITIAL_CLASSES
  );
  const updated = [...current, newClass].sort((a, b) => a.min_age - b.min_age);
  writeLocal(STORAGE_KEYS.classes, updated);
  return newClass;
}

export async function deleteSchoolClass(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase.from("classes").delete().eq("id", id);
  }
  const current = readLocal<SchoolClass[]>(
    STORAGE_KEYS.classes,
    () => INITIAL_CLASSES
  );
  writeLocal(
    STORAGE_KEYS.classes,
    current.filter((c) => c.id !== id)
  );
}

// ============================================================
// 2. STUDENTS (Alunos e Matrículas)
// ============================================================
export async function fetchStudents(): Promise<Student[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      return data as Student[];
    }
  }
  return readLocal<Student[]>(STORAGE_KEYS.students, () => INITIAL_STUDENTS);
}

export async function createStudentEnrollment(
  studentInput: Omit<Student, "id" | "created_at" | "stripe_customer_id" | "school_class">,
  monthlyFeeCents: number
): Promise<{ student: Student; payment: StudentPayment }> {
  const now = new Date();
  const refMonth = now.getMonth() + 1;
  const refYear = now.getFullYear();
  const pad = (n: number) => String(n).padStart(2, "0");
  const dueDate = `${refYear}-${pad(refMonth)}-${pad(studentInput.billing_day)}`;

  if (isSupabaseConfigured) {
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .insert([
        {
          ...studentInput,
          stripe_customer_id: null,
        },
      ])
      .select("*")
      .single();

    if (!studentError && studentData) {
      const paymentPayload = {
        student_id: studentData.id,
        reference_month: refMonth,
        reference_year: refYear,
        due_date: dueDate,
        amount_cents: monthlyFeeCents,
        status: "pending" as const,
      };

      const { data: paymentData, error: paymentError } = await supabase
        .from("student_payments")
        .insert([paymentPayload])
        .select("*")
        .single();

      if (!paymentError && paymentData) {
        return {
          student: studentData as Student,
          payment: paymentData as StudentPayment,
        };
      }
    }
  }

  // Fallback local
  const newStudent: Student = {
    ...studentInput,
    id: crypto.randomUUID(),
    stripe_customer_id: null,
    created_at: now.toISOString(),
  };

  const newPayment: StudentPayment = {
    id: crypto.randomUUID(),
    student_id: newStudent.id,
    reference_month: refMonth,
    reference_year: refYear,
    due_date: dueDate,
    amount_cents: monthlyFeeCents,
    status: "pending",
    stripe_checkout_url: null,
    stripe_payment_intent_id: null,
    paid_at: null,
    created_at: now.toISOString(),
  };

  const students = readLocal<Student[]>(
    STORAGE_KEYS.students,
    () => INITIAL_STUDENTS
  );
  writeLocal(STORAGE_KEYS.students, [newStudent, ...students]);

  const payments = readLocal<StudentPayment[]>(
    STORAGE_KEYS.payments,
    generateInitialPayments
  );
  writeLocal(STORAGE_KEYS.payments, [newPayment, ...payments]);

  return { student: newStudent, payment: newPayment };
}

export async function updateStudentStatusOrClass(
  studentId: string,
  updates: Partial<Pick<Student, "status" | "class_id" | "billing_day" | "position" | "health_notes">>
): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase.from("students").update(updates).eq("id", studentId);
  }
  const students = readLocal<Student[]>(
    STORAGE_KEYS.students,
    () => INITIAL_STUDENTS
  );
  writeLocal(
    STORAGE_KEYS.students,
    students.map((s) => (s.id === studentId ? { ...s, ...updates } : s))
  );
}

// ============================================================
// 3. STUDENT PAYMENTS (Calendário de Mensalidades)
// ============================================================
export async function fetchStudentPayments(
  year?: number
): Promise<StudentPayment[]> {
  if (isSupabaseConfigured) {
    let query = supabase
      .from("student_payments")
      .select("*")
      .order("due_date", { ascending: true });
    if (year) {
      query = query.eq("reference_year", year);
    }
    const { data, error } = await query;
    if (!error && data) {
      return data as StudentPayment[];
    }
  }
  const all = readLocal<StudentPayment[]>(
    STORAGE_KEYS.payments,
    generateInitialPayments
  );
  return year ? all.filter((p) => p.reference_year === year) : all;
}

export async function ensureOrUpdateStudentPayment(params: {
  paymentId?: string;
  studentId: string;
  referenceMonth: number;
  referenceYear: number;
  dueDate: string;
  amountCents: number;
  status: StudentPaymentStatus;
  stripeCheckoutUrl?: string | null;
}): Promise<StudentPayment> {
  const nowIso = new Date().toISOString();

  if (isSupabaseConfigured) {
    if (params.paymentId) {
      const updatePayload: Record<string, unknown> = {
        status: params.status,
      };
      if (params.stripeCheckoutUrl !== undefined) {
        updatePayload.stripe_checkout_url = params.stripeCheckoutUrl;
      }
      if (params.status === "paid") {
        updatePayload.paid_at = nowIso;
      }
      const { data, error } = await supabase
        .from("student_payments")
        .update(updatePayload)
        .eq("id", params.paymentId)
        .select("*")
        .single();
      if (!error && data) return data as StudentPayment;
    } else {
      const insertPayload = {
        student_id: params.studentId,
        reference_month: params.referenceMonth,
        reference_year: params.referenceYear,
        due_date: params.dueDate,
        amount_cents: params.amountCents,
        status: params.status,
        stripe_checkout_url: params.stripeCheckoutUrl ?? null,
        paid_at: params.status === "paid" ? nowIso : null,
      };
      const { data, error } = await supabase
        .from("student_payments")
        .upsert([insertPayload], {
          onConflict: "student_id,reference_month,reference_year",
        })
        .select("*")
        .single();
      if (!error && data) return data as StudentPayment;
    }
  }

  const payments = readLocal<StudentPayment[]>(
    STORAGE_KEYS.payments,
    generateInitialPayments
  );
  const existingIndex = payments.findIndex(
    (p) =>
      (params.paymentId && p.id === params.paymentId) ||
      (p.student_id === params.studentId &&
        p.reference_month === params.referenceMonth &&
        p.reference_year === params.referenceYear)
  );

  if (existingIndex >= 0) {
    const existing = payments[existingIndex];
    const updatedItem: StudentPayment = {
      ...existing,
      status: params.status,
      stripe_checkout_url:
        params.stripeCheckoutUrl !== undefined
          ? params.stripeCheckoutUrl
          : existing.stripe_checkout_url,
      paid_at:
        params.status === "paid"
          ? existing.paid_at || nowIso
          : null,
    };
    payments[existingIndex] = updatedItem;
    writeLocal(STORAGE_KEYS.payments, payments);
    return updatedItem;
  } else {
    const created: StudentPayment = {
      id: crypto.randomUUID(),
      student_id: params.studentId,
      reference_month: params.referenceMonth,
      reference_year: params.referenceYear,
      due_date: params.dueDate,
      amount_cents: params.amountCents,
      status: params.status,
      stripe_checkout_url: params.stripeCheckoutUrl ?? null,
      stripe_payment_intent_id: null,
      paid_at: params.status === "paid" ? nowIso : null,
      created_at: nowIso,
    };
    writeLocal(STORAGE_KEYS.payments, [...payments, created]);
    return created;
  }
}

// ============================================================
// 4. COURT BOOKINGS (Locação da Quadra)
// ============================================================
export async function fetchCourtBookings(): Promise<CourtBooking[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("court_bookings")
      .select("*")
      .order("booking_date", { ascending: true })
      .order("start_time", { ascending: true });
    if (!error && data) {
      return data as CourtBooking[];
    }
  }
  return readLocal<CourtBooking[]>(
    STORAGE_KEYS.bookings,
    generateInitialBookings
  );
}

export async function createCourtBooking(
  payload: Omit<CourtBooking, "id" | "created_at">
): Promise<CourtBooking> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("court_bookings")
      .insert([payload])
      .select("*")
      .single();
    if (!error && data) {
      return data as CourtBooking;
    }
  }

  const created: CourtBooking = {
    ...payload,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  const current = readLocal<CourtBooking[]>(
    STORAGE_KEYS.bookings,
    generateInitialBookings
  );
  writeLocal(STORAGE_KEYS.bookings, [...current, created]);
  return created;
}

export async function updateCourtBooking(
  bookingId: string,
  updates: Partial<Pick<CourtBooking, "payment_status" | "stripe_checkout_url" | "notes">>
): Promise<CourtBooking | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("court_bookings")
      .update(updates)
      .eq("id", bookingId)
      .select("*")
      .single();
    if (!error && data) {
      return data as CourtBooking;
    }
  }

  const current = readLocal<CourtBooking[]>(
    STORAGE_KEYS.bookings,
    generateInitialBookings
  );
  let updatedBooking: CourtBooking | null = null;
  const next = current.map((b) => {
    if (b.id === bookingId) {
      updatedBooking = { ...b, ...updates };
      return updatedBooking;
    }
    return b;
  });
  writeLocal(STORAGE_KEYS.bookings, next);
  return updatedBooking;
}

// ============================================================
// 5. INTEGRAÇÃO STRIPE CHECKOUT (Client Helper)
// ============================================================
export interface CreateStripeCheckoutParams {
  type: "student_payment" | "court_booking";
  recordId: string;
  title: string;
  description: string;
  amountCents: number;
  customerEmail?: string;
  customerName?: string;
  studentId?: string;
}

export async function requestStripeCheckoutLink(
  params: CreateStripeCheckoutParams
): Promise<{ url: string; simulated: boolean }> {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "Falha ao gerar link de pagamento Stripe");
  }

  const data = await response.json();
  return { url: data.url, simulated: Boolean(data.simulated) };
}

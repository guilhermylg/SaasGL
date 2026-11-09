import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json(
      {
        error:
          "STRIPE_SECRET_KEY ou STRIPE_WEBHOOK_SECRET não configurados no ambiente.",
      },
      { status: 400 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Cabeçalho stripe-signature ausente." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  const stripe = new Stripe(stripeSecretKey);

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Assinatura de webhook inválida";
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const type = session.metadata?.type as
        | "student_payment"
        | "court_booking"
        | undefined;
      const recordId = session.metadata?.recordId;
      const studentId = session.metadata?.studentId;
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id || null;

      if (isSupabaseConfigured && recordId) {
        const supabaseAdmin = getSupabaseAdmin();
        const nowIso = new Date().toISOString();

        if (type === "student_payment") {
          await supabaseAdmin
            .from("student_payments")
            .update({
              status: "paid",
              paid_at: nowIso,
              stripe_payment_intent_id: paymentIntentId,
            })
            .eq("id", recordId);

          if (studentId) {
            const studentUpdate: Record<string, unknown> = {
              status: "active",
            };
            if (customerId) {
              studentUpdate.stripe_customer_id = customerId;
            }
            await supabaseAdmin
              .from("students")
              .update(studentUpdate)
              .eq("id", studentId);
          }
        } else if (type === "court_booking") {
          await supabaseAdmin
            .from("court_bookings")
            .update({
              payment_status: "paid",
            })
            .eq("id", recordId);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Falha ao processar evento do webhook Stripe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

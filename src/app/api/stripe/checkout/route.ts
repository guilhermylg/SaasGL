import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      recordId,
      title,
      description,
      amountCents,
      customerEmail,
      studentId,
    } = body as {
      type: "student_payment" | "court_booking";
      recordId: string;
      title: string;
      description?: string;
      amountCents: number;
      customerEmail?: string;
      customerName?: string;
      studentId?: string;
    };

    if (!type || !recordId || !amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: "Parâmetros inválidos para criação do Checkout Stripe." },
        { status: 400 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.nextUrl.origin ||
      "http://localhost:3000";

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
    const isStripeConfigured = Boolean(
      stripeSecretKey &&
        (stripeSecretKey.startsWith("sk_test_") ||
          stripeSecretKey.startsWith("sk_live_") ||
          stripeSecretKey.startsWith("rk_"))
    );

    let checkoutUrl = "";
    let simulated = false;

    if (isStripeConfigured) {
      const stripe = new Stripe(stripeSecretKey);

      const successPath =
        type === "student_payment"
          ? `/dashboard/financeiro?checkout=success&id=${recordId}`
          : `/dashboard/quadra?checkout=success&id=${recordId}`;
      const cancelPath =
        type === "student_payment"
          ? `/dashboard/financeiro?checkout=cancelled&id=${recordId}`
          : `/dashboard/quadra?checkout=cancelled&id=${recordId}`;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        currency: "brl",
        customer_email: customerEmail || undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "brl",
              unit_amount: Math.round(amountCents),
              product_data: {
                name: title,
                description: description || undefined,
              },
            },
          },
        ],
        metadata: {
          type,
          recordId,
          studentId: studentId || "",
        },
        success_url: `${appUrl}${successPath}`,
        cancel_url: `${appUrl}${cancelPath}`,
      });

      if (!session.url) {
        throw new Error("A Stripe não retornou uma URL de Checkout válida.");
      }

      checkoutUrl = session.url;
    } else {
      // Fallback de demonstração quando STRIPE_SECRET_KEY ainda não foi configurada no ambiente
      simulated = true;
      const slug = encodeURIComponent(recordId.slice(0, 12));
      checkoutUrl = `${appUrl}/matricula?pay_demo=${slug}&type=${type}&amount=${amountCents}`;
    }

    // Salva a URL gerada no Supabase caso esteja configurado
    if (isSupabaseConfigured) {
      const supabaseAdmin = getSupabaseAdmin();
      if (type === "student_payment") {
        await supabaseAdmin
          .from("student_payments")
          .update({ stripe_checkout_url: checkoutUrl })
          .eq("id", recordId);
      } else if (type === "court_booking") {
        await supabaseAdmin
          .from("court_bookings")
          .update({ stripe_checkout_url: checkoutUrl })
          .eq("id", recordId);
      }
    }

    return NextResponse.json({
      url: checkoutUrl,
      simulated,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro interno ao gerar link de pagamento Stripe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

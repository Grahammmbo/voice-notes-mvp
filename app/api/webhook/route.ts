import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "../../../lib/supabase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("🔔 Webhook received:", event.type);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("✅ Checkout session completed:", session.id);
      console.log("Customer email:", session.customer_details?.email);
      console.log("Pack ID:", session.metadata?.packId);
      console.log("Pack name:", session.metadata?.packName);
      console.log("Sticker count:", session.metadata?.stickerCount);
      console.log("Unit amount:", session.metadata?.unitAmount);
      console.log("Amount total:", session.amount_total);
      console.log("Payment status:", session.payment_status);

      const order = {
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        customer_email: session.customer_details?.email ?? null,
        pack_id: session.metadata?.packId ?? "unknown",
        pack_name: session.metadata?.packName ?? "Unknown Pack",
        sticker_count: Number(session.metadata?.stickerCount ?? 0),
        unit_amount: Number(session.metadata?.unitAmount ?? 0),
        amount_total: session.amount_total ?? 0,
        payment_status: session.payment_status ?? "unpaid",
      };

      console.log("🧾 Order payload:", order);

      const { data, error } = await supabaseAdmin
        .from("orders")
        .upsert(order, { onConflict: "stripe_session_id" })
        .select();

      if (error) {
        console.error("❌ Failed to save order:", error);
        return new NextResponse("Failed to save order", { status: 500 });
      }

      console.log("✅ Order saved to Supabase:", data);
      break;
    }

    default:
      console.log("ℹ️ Unhandled event type:", event.type);
  }

  return NextResponse.json({ received: true });
}
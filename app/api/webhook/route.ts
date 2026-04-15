import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

const stripeSecretKey = getEnv("STRIPE_SECRET_KEY");
const stripeWebhookSecret = getEnv("STRIPE_WEBHOOK_SECRET");
const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseServiceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

const stripe = new Stripe(stripeSecretKey);
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeWebhookSecret
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const customerDetails = session.customer_details;
      const shippingDetails = (session as any).shipping_details;
      const shippingAddress = shippingDetails?.address;
      const customerAddress = customerDetails?.address;

      const line1 = shippingAddress?.line1 ?? customerAddress?.line1 ?? null;
      const line2 = shippingAddress?.line2 ?? customerAddress?.line2 ?? null;
      const city = shippingAddress?.city ?? customerAddress?.city ?? null;
      const state = shippingAddress?.state ?? customerAddress?.state ?? null;
      const postalCode =
        shippingAddress?.postal_code ?? customerAddress?.postal_code ?? null;
      const country = shippingAddress?.country ?? customerAddress?.country ?? null;

      const orderPayload = {
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,

        customer_email: customerDetails?.email ?? null,
        customer_name: customerDetails?.name ?? null,
        shipping_name: shippingDetails?.name ?? customerDetails?.name ?? null,

        pack_id: session.metadata?.pack_id ?? null,
        pack_name: session.metadata?.pack_name ?? null,
        sticker_count: session.metadata?.sticker_count
          ? Number(session.metadata.sticker_count)
          : null,

        amount_total: session.amount_total ?? null,
        amount_subtotal: session.amount_subtotal ?? null,
        unit_amount: session.amount_total ?? null,
        currency: session.currency ?? null,
        payment_status: session.payment_status ?? null,

        shipping_line1: line1,
        shipping_line2: line2,
        shipping_city: city,
        shipping_state: state,
        shipping_postal_code: postalCode,
        shipping_country: country,

        // keep legacy columns in sync too
        shipping_address_line1: line1,
        shipping_address_line2: line2,
      };

      console.log("Saving order to Supabase:", orderPayload);

      const { error } = await supabase.from("orders").insert([orderPayload]);

      if (error) {
        console.error("Supabase insert error:", error);
        return NextResponse.json(
          {
            error: "Failed to save order",
            details: error.message,
          },
          { status: 500 }
        );
      }

      console.log("Order saved successfully:", orderPayload);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
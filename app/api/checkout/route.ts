import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(secretKey);

const PACKS = {
  starter: {
    id: "starter",
    name: "Starter Pack",
    stickerCount: 4,
    unitAmount: 999,
  },
  essentials: {
    id: "essentials",
    name: "Essentials Pack",
    stickerCount: 12,
    unitAmount: 1900,
  },
  bundle: {
    id: "bundle",
    name: "Bundle Pack",
    stickerCount: 24,
    unitAmount: 2900,
  },
} as const;

type PackId = keyof typeof PACKS;

function getBaseUrl(req: NextRequest) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");

  const host = req.headers.get("host");

  if (!host) {
    throw new Error("Missing host header");
  }

  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");

  return `${isLocal ? "http" : "https"}://${host}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const packId = body?.packId as PackId | undefined;

    console.log("Received packId:", packId);

    if (!packId || !(packId in PACKS)) {
      return NextResponse.json(
        { error: `Invalid pack selected: ${packId}` },
        { status: 400 }
      );
    }

    const pack = PACKS[packId];
    const baseUrl = getBaseUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            product_data: {
              name: pack.name,
              description: `${pack.stickerCount} EchoNote cards`,
            },
            unit_amount: pack.unitAmount,
          },
        },
      ],
      billing_address_collection: "auto",
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      phone_number_collection: {
        enabled: true,
      },
      customer_creation: "always",
      success_url: `${baseUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/shop?canceled=1`,
      metadata: {
        pack_id: pack.id,
        pack_name: pack.name,
        sticker_count: String(pack.stickerCount),
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe session created without a URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout session error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Checkout failed",
      },
      { status: 500 }
    );
  }
}
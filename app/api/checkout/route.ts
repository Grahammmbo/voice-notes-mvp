import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const PACKS = {
  starter: {
    id: "starter",
    name: "Starter Pack",
    price: 1000,
    quantityLabel: "5 EchoNote Stickers",
    stickerCount: 5,
  },
  essentials: {
    id: "essentials",
    name: "Essentials Pack",
    price: 1900,
    quantityLabel: "12 EchoNote Stickers",
    stickerCount: 12,
  },
  gift: {
    id: "gift",
    name: "Gift Pack",
    price: 3900,
    quantityLabel: "36 EchoNote Stickers",
    stickerCount: 36,
  },
  bulk: {
    id: "bulk",
    name: "Bulk Pack",
    price: 7900,
    quantityLabel: "100 EchoNote Stickers",
    stickerCount: 100,
  },
} as const;

export async function POST(req: NextRequest) {
  try {
    const { packId } = await req.json();

    const pack = PACKS[packId as keyof typeof PACKS];

    if (!pack) {
      return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/shop`,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: pack.name,
              description: pack.quantityLabel,
            },
            unit_amount: pack.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        packId: pack.id,
        packName: pack.name,
        stickerCount: String(pack.stickerCount),
        unitAmount: String(pack.price),
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_creation: "always",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout failed:", err);
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
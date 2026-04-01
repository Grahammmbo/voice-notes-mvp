"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Pack = {
  id: string;
  name: string;
  badge?: string;
  quantity: string;
  price: string;
  subtitle: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const PACKS: Pack[] = [
  {
    id: "starter",
    name: "Starter Pack",
    badge: "Best first order",
    quantity: "12 EchoNotes",
    price: "$19",
    subtitle: "Perfect for trying the product yourself.",
    description:
      "A simple first batch for birthdays, small gifts, surprise notes, or testing your first packaging flow.",
    features: [
      "12 ready-to-use QR stickers",
      "Easy first order size",
      "Great for personal gifting",
    ],
    cta: "Get Starter Pack",
  },
  {
    id: "gift",
    name: "Gift Pack",
    badge: "Most popular",
    quantity: "36 EchoNotes",
    price: "$39",
    subtitle: "Built for thoughtful gifting and small events.",
    description:
      "Ideal for holidays, weddings, party favors, client gifts, or anyone who wants enough inventory to actually use and share.",
    features: [
      "36 ready-to-use QR stickers",
      "Better value per card",
      "Best for gifting and events",
    ],
    cta: "Get Gift Pack",
    highlight: true,
  },
  {
    id: "bulk",
    name: "Bulk Pack",
    badge: "Best value",
    quantity: "100 EchoNotes",
    price: "$79",
    subtitle: "For creators, sellers, and repeat use.",
    description:
      "The best option for launches, resellers, events, or anyone planning to package and sell EchoNotes more seriously.",
    features: [
      "100 ready-to-use QR stickers",
      "Lowest cost per card",
      "Best for scaling inventory",
    ],
    cta: "Get Bulk Pack",
  },
];

const FAQS = [
  {
    q: "Do people need an app to open an EchoNote?",
    a: "No. They scan the QR code and open the message in their browser.",
  },
  {
    q: "Can I record the message later?",
    a: "Yes. You can order stickers first, then record and attach a message when you're ready.",
  },
  {
    q: "Are these good for gifts or events?",
    a: "Yes. They work especially well for birthdays, weddings, holidays, party favors, memorial keepsakes, and client gifts.",
  },
  {
    q: "Can I order a larger quantity later?",
    a: "Absolutely. Start small, then move into larger packs once you know how you want to use them.",
  },
];

export default function ShopPage() {
  const router = useRouter();
  const [selectedPackId, setSelectedPackId] = useState<string>("gift");

  const selectedPack = useMemo(
    () => PACKS.find((pack) => pack.id === selectedPackId) ?? PACKS[1],
    [selectedPackId],
  );

  const handlePrimaryAction = (pack: Pack) => {
    setSelectedPackId(pack.id);

    // Placeholder until checkout is wired up.
    // You can later swap this for Stripe Checkout, Lemon Squeezy, Shopify, etc.
    alert(`${pack.name} checkout is the next step to wire up.`);
  };

  const handleCreateFirst = () => {
    router.push("/create");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(221,198,173,0.30),transparent_28%),linear-gradient(180deg,#f8f5f0_0%,#f2ece4_100%)] px-4 py-6 text-[#181411] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-[36px] border border-white/70 bg-white/75 shadow-[0_24px_80px_rgba(58,42,27,0.12)] backdrop-blur-xl">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="px-6 py-10 sm:px-8 sm:py-12 lg:px-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#181411]/8 bg-white/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#181411]/60">
                <span className="h-2 w-2 rounded-full bg-gradient-to-b from-[#2f2520] to-[#8d786a]" />
                EchoNote Shop
              </div>

              <h1 className="mt-5 max-w-[680px] text-[40px] font-semibold leading-[0.98] tracking-[-0.05em] sm:text-[52px]">
                Turn a simple scan into something unforgettable
              </h1>

              <p className="mt-5 max-w-[620px] text-[16px] leading-8 text-[#645a53] sm:text-[17px]">
                EchoNote stickers let you attach a private voice message to a
                real object, gift, or moment. They feel personal, premium, and
                instant.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handlePrimaryAction(selectedPack)}
                  className="relative min-h-[56px] overflow-hidden rounded-[18px] bg-gradient-to-b from-[#26201b] to-[#15110f] px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_30px_rgba(21,17,15,0.18)] transition duration-150 hover:brightness-105 active:scale-[0.98] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent_38%)] before:content-[''] after:absolute after:inset-x-[18%] after:top-0 after:h-px after:bg-white/25 after:content-['']"
                >
                  {selectedPack.cta}
                </button>

                <button
                  type="button"
                  onClick={handleCreateFirst}
                  className="min-h-[56px] rounded-[18px] border border-[#181411]/10 bg-white/70 px-6 py-3.5 text-base font-semibold text-[#181411] shadow-[0_8px_18px_rgba(58,42,27,0.05)] transition duration-150 hover:bg-white/85 active:scale-[0.98]"
                >
                  Try one free first
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {[
                  "No app required",
                  "Works in mobile browser",
                  "Great for gifts and events",
                  "Easy to package",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-full border border-[#181411]/6 bg-white/55 px-3 py-2 text-[12px] text-[#181411]/58 backdrop-blur-md"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.62),rgba(255,255,255,0.42))] px-6 py-10 sm:px-8 lg:border-l lg:border-t-0">
              <div className="rounded-[28px] border border-white/80 bg-white/70 p-6 shadow-[0_12px_30px_rgba(58,42,27,0.08)]">
                <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#181411]/45">
                  Selected pack
                </div>

                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[28px] font-semibold tracking-[-0.04em]">
                      {selectedPack.name}
                    </h2>
                    <p className="mt-1 text-[14px] text-[#645a53]">
                      {selectedPack.subtitle}
                    </p>
                  </div>

                  <div className="rounded-full border border-[#181411]/8 bg-white/75 px-3 py-2 text-[12px] font-semibold text-[#181411]/70">
                    {selectedPack.badge}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-[18px] border border-[#181411]/6 bg-white/65 px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-[#181411]/40">
                      Quantity
                    </div>
                    <div className="mt-1 text-[18px] font-semibold tracking-[-0.03em]">
                      {selectedPack.quantity}
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-[#181411]/6 bg-white/65 px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.12em] text-[#181411]/40">
                      Price
                    </div>
                    <div className="mt-1 text-[18px] font-semibold tracking-[-0.03em]">
                      {selectedPack.price}
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-[14px] leading-7 text-[#645a53]">
                  {selectedPack.description}
                </p>

                <div className="mt-5 space-y-2">
                  {selectedPack.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 rounded-[16px] border border-[#181411]/6 bg-white/50 px-3 py-3 text-[14px] text-[#181411]/78"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#181411] text-[12px] text-white">
                        ✓
                      </span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handlePrimaryAction(selectedPack)}
                  className="relative mt-6 w-full overflow-hidden rounded-[18px] bg-gradient-to-b from-[#26201b] to-[#15110f] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_30px_rgba(21,17,15,0.18)] transition duration-150 hover:brightness-105 active:scale-[0.98] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent_38%)] before:content-[''] after:absolute after:inset-x-[18%] after:top-0 after:h-px after:bg-white/25 after:content-['']"
                >
                  {selectedPack.cta}
                </button>

                <p className="mt-3 text-center text-[12px] text-[#181411]/45">
                  Your first EchoNote can still be tested free before you order.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => setSelectedPackId(pack.id)}
              className={`text-left rounded-[28px] border px-5 py-6 shadow-[0_12px_30px_rgba(58,42,27,0.06)] transition duration-150 hover:-translate-y-[2px] active:scale-[0.99] ${
                selectedPackId === pack.id
                  ? "border-[#181411]/14 bg-white/85"
                  : "border-white/70 bg-white/65"
              } ${pack.highlight ? "ring-1 ring-[#181411]/8" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[22px] font-semibold tracking-[-0.04em]">
                    {pack.name}
                  </div>
                  <div className="mt-1 text-[13px] text-[#645a53]">
                    {pack.quantity}
                  </div>
                </div>

                {pack.badge ? (
                  <div className="rounded-full border border-[#181411]/8 bg-white/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#181411]/60">
                    {pack.badge}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 text-[30px] font-semibold tracking-[-0.05em]">
                {pack.price}
              </div>

              <div className="mt-2 text-[14px] leading-7 text-[#645a53]">
                {pack.description}
              </div>

              <div className="mt-5 space-y-2">
                {pack.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-[13px] text-[#181411]/72"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#181411]/55" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-[14px] font-semibold text-[#181411]">
                {selectedPackId === pack.id ? "Selected" : "Choose this pack"}
              </div>
            </button>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_12px_30px_rgba(58,42,27,0.06)] sm:p-8">
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#181411]/45">
              Why people buy EchoNote
            </div>

            <h2 className="mt-3 text-[32px] font-semibold leading-[1.02] tracking-[-0.04em]">
              It feels more personal than a card, and easier than an app
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Gift-ready",
                  body: "Attach a voice moment to flowers, gift bags, keepsake boxes, or party favors.",
                },
                {
                  title: "Instant to open",
                  body: "No downloads, no logins, no friction. Just scan and listen.",
                },
                {
                  title: "Emotionally memorable",
                  body: "A voice carries feeling in a way a printed note never can.",
                },
                {
                  title: "Easy to scale",
                  body: "Start with a small pack, then move into larger inventory when demand grows.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[22px] border border-[#181411]/6 bg-white/55 p-5"
                >
                  <div className="text-[17px] font-semibold tracking-[-0.02em]">
                    {item.title}
                  </div>
                  <p className="mt-2 text-[14px] leading-7 text-[#645a53]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_12px_30px_rgba(58,42,27,0.06)] sm:p-8">
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#181411]/45">
              Frequently asked
            </div>

            <div className="mt-4 space-y-3">
              {FAQS.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-[22px] border border-[#181411]/6 bg-white/55 p-5"
                >
                  <div className="text-[16px] font-semibold tracking-[-0.02em]">
                    {faq.q}
                  </div>
                  <p className="mt-2 text-[14px] leading-7 text-[#645a53]">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[36px] border border-white/70 bg-white/75 px-6 py-10 text-center shadow-[0_24px_80px_rgba(58,42,27,0.08)] sm:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#181411]/45">
              Start simple
            </div>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.02] tracking-[-0.04em]">
              Try one free, then order when it clicks
            </h2>
            <p className="mt-4 text-[15px] leading-8 text-[#645a53]">
              The easiest way to understand EchoNote is to make one. Test the
              experience, hear how it feels, then choose the pack that fits how
              you want to use it.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleCreateFirst}
                className="relative min-h-[56px] w-full overflow-hidden rounded-[18px] bg-gradient-to-b from-[#26201b] to-[#15110f] px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_30px_rgba(21,17,15,0.18)] transition duration-150 hover:brightness-105 active:scale-[0.98] sm:w-auto before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent_38%)] before:content-[''] after:absolute after:inset-x-[18%] after:top-0 after:h-px after:bg-white/25 after:content-['']"
              >
                Create your first EchoNote
              </button>

              <button
                type="button"
                onClick={() => handlePrimaryAction(selectedPack)}
                className="min-h-[56px] w-full rounded-[18px] border border-[#181411]/10 bg-white/70 px-6 py-3.5 text-base font-semibold text-[#181411] shadow-[0_8px_18px_rgba(58,42,27,0.05)] transition duration-150 hover:bg-white/85 active:scale-[0.98] sm:w-auto"
              >
                Order {selectedPack.name}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
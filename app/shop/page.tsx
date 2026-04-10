"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Pack = {
  id: string;
  name: string;
  badge?: string;
  quantity: string;
  price: string;
  originalPrice?: string;
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
    badge: "Limited time",
    quantity: "5 EchoNote Stickers",
    price: "$10",
    originalPrice: "$13",
    subtitle: "Perfect for trying your first EchoNote.",
    description:
      "A low-risk way to experience EchoNote. Try it once, hear the impact, then scale up when it clicks.",
    features: [
      "5 ready-to-use EchoNote Stickers",
      "Lowest cost entry point",
      "Perfect for first-time users",
    ],
    cta: "Try for $10",
  },
  {
    id: "essentials",
    name: "Essentials Pack",
    badge: "Best value starter",
    quantity: "12 EchoNote Stickers",
    price: "$19",
    subtitle: "The perfect everyday pack.",
    description:
      "A balanced option for consistent use. Great for gifts, personal use, and small batches.",
    features: [
      "12 ready-to-use EchoNote Stickers",
      "Great everyday quantity",
      "Ideal for gifting and repeat use",
    ],
    cta: "Get Essentials Pack",
  },
  {
    id: "gift",
    name: "Gift Pack",
    badge: "Most popular",
    quantity: "36 EchoNote Stickers",
    price: "$39",
    subtitle: "Built for thoughtful gifting and events.",
    description:
      "Perfect for holidays, weddings, party favors, thank you cards, or even client gifting.",
    features: [
      "36 ready-to-use EchoNote Stickers",
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
    quantity: "100 EchoNote Stickers",
    price: "$79",
    subtitle: "For creators, sellers, and scale.",
    description:
      "Best for launches, resellers, or anyone planning to use EchoNote at scale.",
    features: [
      "100 ready-to-use EchoNote Stickers",
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
  const searchParams = useSearchParams();

  const [selectedPackId, setSelectedPackId] = useState<string>("gift");
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const selectedPack = useMemo(
    () => PACKS.find((pack) => pack.id === selectedPackId) ?? PACKS[2],
    [selectedPackId],
  );

  const canceled = searchParams.get("canceled") === "1";

  const handlePrimaryAction = async (pack: Pack) => {
    if (isStartingCheckout) return;

    try {
      setCheckoutError(null);
      setIsStartingCheckout(true);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packId: pack.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Checkout failed.");
      }

      if (!data?.url) {
        throw new Error("Missing checkout URL.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout start failed:", error);
      setCheckoutError(
        "There was a problem starting checkout. Please try again.",
      );
      setIsStartingCheckout(false);
    }
  };

  const handleCreateFirst = () => {
    router.push("/create");
  };

  return (
    <main className="min-h-screen bg-[#f6f2ec] px-4 py-6 text-[#181411] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        {canceled ? (
          <div className="mb-6 rounded-[20px] border border-amber-200 bg-amber-50/90 px-4 py-3 text-[14px] text-amber-800">
            Checkout was canceled. Your selection is still here whenever you’re
            ready.
          </div>
        ) : null}

        {checkoutError ? (
          <div className="mb-6 rounded-[20px] border border-red-200 bg-red-50/90 px-4 py-3 text-[14px] text-red-700">
            {checkoutError}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[36px] border border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(58,42,27,0.12)] backdrop-blur-xl">
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
                EchoNote Stickers let you attach a private voice message to a
                real gift, object, or moment. No app. Just scan and listen.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handlePrimaryAction(selectedPack)}
                  disabled={isStartingCheckout}
                  className="relative min-h-[56px] overflow-hidden rounded-[18px] bg-gradient-to-b from-[#26201b] to-[#15110f] px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_30px_rgba(21,17,15,0.18)] transition duration-150 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent_38%)] before:content-[''] after:absolute after:inset-x-[18%] after:top-0 after:h-px after:bg-white/25 after:content-['']"
                >
                  {isStartingCheckout ? "Starting checkout..." : selectedPack.cta}
                </button>

                <button
                  type="button"
                  onClick={handleCreateFirst}
                  className="min-h-[56px] rounded-[18px] border border-[#181411]/10 bg-white/70 px-6 py-3.5 text-base font-semibold text-[#181411] shadow-[0_8px_18px_rgba(58,42,27,0.05)] transition duration-150 hover:bg-white/85 active:scale-[0.98]"
                >
                  Try one free first
                </button>
              </div>

              <p className="mt-3 text-[13px] text-[#181411]/55">
                Free shipping on orders over $20
              </p>

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

                  {selectedPack.badge ? (
                    <div className="rounded-full border border-[#181411]/8 bg-white/75 px-3 py-2 text-[12px] font-semibold text-[#181411]/70">
                      {selectedPack.badge}
                    </div>
                  ) : null}
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
                    <div className="mt-1 flex items-center justify-center gap-2 text-[18px] font-semibold tracking-[-0.03em]">
                      {selectedPack.originalPrice ? (
                        <span className="text-[13px] text-[#181411]/40 line-through">
                          {selectedPack.originalPrice}
                        </span>
                      ) : null}
                      <span>{selectedPack.price}</span>
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
                  disabled={isStartingCheckout}
                  className="relative mt-6 w-full overflow-hidden rounded-[18px] bg-gradient-to-b from-[#26201b] to-[#15110f] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_30px_rgba(21,17,15,0.18)] transition duration-150 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent_38%)] before:content-[''] after:absolute after:inset-x-[18%] after:top-0 after:h-px after:bg-white/25 after:content-['']"
                >
                  {isStartingCheckout ? "Starting checkout..." : selectedPack.cta}
                </button>

                <p className="mt-3 text-center text-[12px] text-[#181411]/45">
                  Your first EchoNote can still be tested free before you order.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PACKS.map((pack) => (
            <div
              key={pack.id}
              onClick={() => setSelectedPackId(pack.id)}
              className={`cursor-pointer rounded-[28px] border px-5 py-6 shadow-[0_12px_30px_rgba(58,42,27,0.06)] transition duration-150 hover:-translate-y-[2px] active:scale-[0.99] ${
                selectedPackId === pack.id
                  ? "border-[#181411]/14 bg-white/85"
                  : "border-white/70 bg-white/65"
              } ${pack.highlight ? "ring-1 ring-[#181411]/8" : ""} flex flex-col`}
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

              <div className="mt-5 flex items-center gap-2 text-[30px] font-semibold tracking-[-0.05em]">
                {pack.originalPrice ? (
                  <span className="text-[16px] text-[#181411]/40 line-through">
                    {pack.originalPrice}
                  </span>
                ) : null}
                <span>{pack.price}</span>
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

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrimaryAction(pack);
                }}
                disabled={isStartingCheckout}
                className="mt-auto w-full rounded-[14px] bg-[#181411] px-4 py-3 text-[14px] font-semibold text-white transition duration-150 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStartingCheckout && selectedPackId === pack.id
                  ? "Starting checkout..."
                  : pack.cta}
              </button>
            </div>
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
                disabled={isStartingCheckout}
                className="min-h-[56px] w-full rounded-[18px] border border-[#181411]/10 bg-white/70 px-6 py-3.5 text-base font-semibold text-[#181411] shadow-[0_8px_18px_rgba(58,42,27,0.05)] transition duration-150 hover:bg-white/85 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isStartingCheckout
                  ? "Starting checkout..."
                  : `Order ${selectedPack.name}`}
              </button>
            </div>

            <p className="mt-3 text-[13px] text-[#181411]/55">
              Free shipping on orders over $20
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
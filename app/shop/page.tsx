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
    badge: "Limited time",
    quantity: "5 EchoNote Stickers",
    price: "$10",
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
      "Perfect for holidays, weddings, thank you cards, party favors, or even client gifting.",
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

export default function ShopPage() {
  const router = useRouter();
  const [selectedPackId, setSelectedPackId] = useState<string>("gift");

  const selectedPack = useMemo(
    () => PACKS.find((p) => p.id === selectedPackId) ?? PACKS[2],
    [selectedPackId]
  );

  const handlePrimaryAction = (pack: Pack) => {
    alert(`${pack.name} checkout is next`);
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8 bg-[#f6f2ec] text-[#181411]">
      <div className="mx-auto max-w-6xl">

        {/* HERO */}
        <section className="rounded-[32px] bg-white/80 border border-white/70 p-8 shadow-lg">
          <h1 className="text-[42px] font-semibold tracking-[-0.04em] leading-tight">
            Turn a simple scan into something unforgettable
          </h1>

          <p className="mt-4 text-[16px] text-[#645a53] max-w-[600px]">
            EchoNote stickers let you attach a private voice message to a gift,
            object, or moment. No apps. Just scan and listen.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => handlePrimaryAction(selectedPack)}
              className="px-6 py-3 rounded-[16px] bg-black text-white font-semibold"
            >
              {selectedPack.cta}
            </button>

            <button
              onClick={() => router.push("/create")}
              className="px-6 py-3 rounded-[16px] border"
            >
              Try one free
            </button>
          </div>

          <p className="mt-3 text-[13px] text-[#181411]/55">
            Free shipping on orders over $20
          </p>
        </section>

        {/* PACKS */}
        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PACKS.map((pack) => (
            <div
              key={pack.id}
              onClick={() => setSelectedPackId(pack.id)}
              className={`cursor-pointer rounded-[24px] p-5 border ${
                selectedPackId === pack.id
                  ? "bg-white border-black"
                  : "bg-white/70"
              }`}
            >
              <h3 className="text-[20px] font-semibold">{pack.name}</h3>

              <p className="text-[13px] text-[#645a53]">{pack.quantity}</p>

              <div className="mt-4 flex items-center gap-2 text-[26px] font-semibold">
                {pack.id === "starter" && (
                  <span className="text-[14px] line-through text-[#999]">
                    $13
                  </span>
                )}
                {pack.price}
              </div>

              <p className="mt-3 text-[14px] text-[#645a53]">
                {pack.description}
              </p>

              <button className="mt-4 w-full py-2 rounded-[12px] bg-black text-white">
                {pack.cta}
              </button>
            </div>
          ))}
        </section>

        {/* CTA */}
        <section className="mt-10 text-center">
          <h2 className="text-[30px] font-semibold">
            Try one free, then order when it clicks
          </h2>

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => router.push("/create")}
              className="px-6 py-3 bg-black text-white rounded-[16px]"
            >
              Create your first EchoNote
            </button>

            <button
              onClick={() => handlePrimaryAction(selectedPack)}
              className="px-6 py-3 border rounded-[16px]"
            >
              Order {selectedPack.name}
            </button>
          </div>

          <p className="mt-3 text-[13px] text-[#181411]/55">
            Free shipping on orders over $20
          </p>
        </section>
      </div>
    </main>
  );
}
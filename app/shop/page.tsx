"use client";

import { useEffect, useState } from "react";

const packs = [
  {
    id: "starter",
    name: "Starter Pack",
    price: "$9.99",
    description: "4 EchoNote cards",
  },
  {
    id: "essentials",
    name: "Essentials Pack",
    price: "$19.00",
    description: "12 EchoNote cards",
  },
  {
    id: "bundle",
    name: "Bundle Pack",
    price: "$29.00",
    description: "24 EchoNote cards",
  },
];

export default function ShopPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [showCanceledMessage, setShowCanceledMessage] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("canceled") === "1") {
      setShowCanceledMessage(true);
    }
  }, []);

  const handleCheckout = async (packId: string) => {
    if (loading) return;

    try {
      setLoading(packId);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Checkout failed");
      }

      if (!data?.url) {
        throw new Error("Missing checkout URL");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong, please try again.";

      alert(message);
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8 flex flex-col items-center">
      <section className="max-w-xl w-full text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
          Send a voice message they can keep forever
        </h1>

        <p className="text-gray-300 text-base sm:text-lg">
          Scan the card. Hear their voice. Anytime.
        </p>

        {showCanceledMessage && (
          <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            Checkout was canceled. Your cards were not purchased.
          </div>
        )}

        <div className="w-full h-56 sm:h-64 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden">
          <span className="text-gray-500 text-sm">
            Replace this with your reaction video
          </span>
        </div>

        <p className="text-sm text-gray-400">
          Perfect for long distance, anniversaries, birthdays, and meaningful
          gifts.
        </p>

        <button
          onClick={() =>
            document.getElementById("packs")?.scrollIntoView({
              behavior: "smooth",
            })
          }
          className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:opacity-90 transition"
        >
          Create Your EchoNote
        </button>
      </section>

      <section className="max-w-xl w-full mt-14 text-center space-y-6">
        <h2 className="text-xl sm:text-2xl font-semibold">How it works</h2>

        <div className="grid gap-4 sm:grid-cols-3 text-left sm:text-center">
          <div className="border border-zinc-800 rounded-2xl p-4 bg-zinc-950">
            <p className="text-sm text-gray-400 mb-2">Step 1</p>
            <p className="font-medium">Scan the card</p>
          </div>

          <div className="border border-zinc-800 rounded-2xl p-4 bg-zinc-950">
            <p className="text-sm text-gray-400 mb-2">Step 2</p>
            <p className="font-medium">Record your message</p>
          </div>

          <div className="border border-zinc-800 rounded-2xl p-4 bg-zinc-950">
            <p className="text-sm text-gray-400 mb-2">Step 3</p>
            <p className="font-medium">They hear it anytime</p>
          </div>
        </div>
      </section>

      <section className="max-w-xl w-full mt-14 text-center space-y-5">
        <h2 className="text-xl sm:text-2xl font-semibold">Why people love it</h2>

        <div className="space-y-3 text-gray-300">
          <p>❤️ Long distance relationships</p>
          <p>🎁 Gifts that actually mean something</p>
          <p>👶 Messages for kids and family</p>
          <p>💬 Say something they can replay forever</p>
        </div>
      </section>

      <section className="max-w-xl w-full mt-12">
        <div className="border border-zinc-800 rounded-2xl p-5 bg-zinc-950 text-center space-y-3">
          <p className="text-sm text-gray-300">No app required</p>
          <p className="text-sm text-gray-300">Works on any phone</p>
          <p className="text-sm text-gray-300">
            Takes less than 30 seconds to create
          </p>
        </div>
      </section>

      <section id="packs" className="max-w-xl w-full mt-14 space-y-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-center">
          Choose your pack
        </h2>

        {packs.map((pack) => (
          <div
            key={pack.id}
            className="border border-zinc-800 rounded-2xl p-5 bg-zinc-950 flex flex-col space-y-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{pack.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{pack.description}</p>
              </div>
              <p className="text-xl font-bold whitespace-nowrap">{pack.price}</p>
            </div>

            <button
              onClick={() => handleCheckout(pack.id)}
              disabled={!!loading}
              className="bg-white text-black py-3 rounded-lg font-medium disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition"
            >
              {loading === pack.id ? "Redirecting..." : "Buy Now"}
            </button>
          </div>
        ))}
      </section>

      <section className="max-w-xl w-full mt-14 text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold">
          Say something they’ll never forget
        </h2>

        <p className="text-gray-400">
          A simple card with a message they can hear again and again.
        </p>

        <button
          onClick={() =>
            document.getElementById("packs")?.scrollIntoView({
              behavior: "smooth",
            })
          }
          className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:opacity-90 transition"
        >
          Get Started
        </button>
      </section>

      <footer className="mt-14 text-xs text-gray-500 text-center">
        © {new Date().getFullYear()} EchoNote
      </footer>
    </main>
  );
}
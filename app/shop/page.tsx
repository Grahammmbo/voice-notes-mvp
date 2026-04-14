"use client";

import { useState } from "react";

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

  const handleCheckout = async (packId: string) => {
    try {
      setLoading(packId);

      const res = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ packId }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Something went wrong. Try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Checkout failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8 flex flex-col items-center">

      {/* 🔥 HERO */}
      <section className="max-w-xl w-full text-center space-y-6">
        <h1 className="text-3xl font-bold leading-tight">
          Send a voice message they can keep forever
        </h1>

        <p className="text-gray-300">
          Scan the card. Hear their voice. Anytime.
        </p>

        {/* 🎥 Replace this div with your TikTok/video embed */}
        <div className="w-full h-56 bg-gray-800 rounded-2xl flex items-center justify-center">
          <span className="text-gray-400 text-sm">
            (Insert reaction video here)
          </span>
        </div>

        <button
          onClick={() =>
            document.getElementById("packs")?.scrollIntoView({ behavior: "smooth" })
          }
          className="w-full bg-white text-black py-3 rounded-xl font-semibold"
        >
          Create Your EchoNote
        </button>
      </section>

      {/* ⚡ HOW IT WORKS */}
      <section className="max-w-xl w-full mt-12 space-y-6 text-center">
        <h2 className="text-xl font-semibold">How it works</h2>

        <div className="space-y-4 text-gray-300">
          <p>1. Scan the card</p>
          <p>2. Record your message</p>
          <p>3. They hear it anytime</p>
        </div>
      </section>

      {/* 💥 USE CASES */}
      <section className="max-w-xl w-full mt-12 space-y-4 text-center">
        <h2 className="text-xl font-semibold">Perfect for</h2>

        <div className="space-y-3 text-gray-300">
          <p>❤️ Long distance relationships</p>
          <p>🎁 Gifts that actually mean something</p>
          <p>💬 Saying what you can’t in person</p>
        </div>
      </section>

      {/* 🧠 TRUST / FRICTION REMOVAL */}
      <section className="max-w-xl w-full mt-10 text-center space-y-3 text-sm text-gray-400">
        <p>No app required</p>
        <p>Works on any phone</p>
        <p>Takes less than 30 seconds</p>
      </section>

      {/* 📦 PACKS */}
      <section
        id="packs"
        className="max-w-xl w-full mt-12 space-y-6"
      >
        <h2 className="text-xl font-semibold text-center">
          Choose your pack
        </h2>

        {packs.map((pack) => (
          <div
            key={pack.id}
            className="border border-gray-700 rounded-2xl p-5 flex flex-col space-y-3"
          >
            <h3 className="text-lg font-semibold">{pack.name}</h3>
            <p className="text-gray-400">{pack.description}</p>
            <p className="text-xl font-bold">{pack.price}</p>

            <button
              onClick={() => handleCheckout(pack.id)}
              disabled={loading === pack.id}
              className="bg-white text-black py-2 rounded-lg font-medium"
            >
              {loading === pack.id ? "Loading..." : "Buy Now"}
            </button>
          </div>
        ))}
      </section>

      {/* 🔁 FINAL CTA */}
      <section className="max-w-xl w-full mt-12 text-center space-y-4">
        <h2 className="text-xl font-semibold">
          Say something they’ll never forget
        </h2>

        <button
          onClick={() =>
            document.getElementById("packs")?.scrollIntoView({ behavior: "smooth" })
          }
          className="w-full bg-white text-black py-3 rounded-xl font-semibold"
        >
          Get Started
        </button>
      </section>

      {/* 🚨 FOOTER */}
      <footer className="mt-12 text-xs text-gray-500 text-center">
        © {new Date().getFullYear()} EchoNote
      </footer>
    </main>
  );
}
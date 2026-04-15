"use client";

import { useState } from "react";
import AdminGate from "../components/AdminGate";

export default function GeneratorPage() {
  const [count, setCount] = useState(48);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/generator/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to generate QR PDF.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || "echonote-qr-batch.pdf";

      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      window.location.href = "/inventory";
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to generate QR PDF."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminGate>
      <main className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">QR Sticker Generator</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Create new slugs and download a printable 1&quot; × 1&quot; QR
              sticker sheet PDF.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <form onSubmit={handleGenerate} className="space-y-5">
              <div>
                <label
                  htmlFor="count"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Number of QR stickers to generate
                </label>
                <input
                  id="count"
                  type="number"
                  min={1}
                  max={500}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  48 labels fills one full sheet. Larger batches create
                  multiple pages automatically.
                </p>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Generating QR PDF..."
                  : "Generate Slugs + Download PDF"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </AdminGate>
  );
}
"use client";

import { useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import AdminGate from "../components/AdminGate";

export default function AdminPage() {
  const [slug, setSlug] = useState("gift");
  const [count, setCount] = useState(10);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://voice-notes-mvp-p7gc.vercel.app";

  const generatedSlugs = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const num = String(i + 1).padStart(3, "0");
      const cleanBase = slug.trim().replace(/\s+/g, "-").toLowerCase();
      return `${cleanBase}-${num}`;
    });
  }, [slug, count]);

  return (
    <AdminGate>
      <main className="min-h-screen bg-white px-6 py-12">
        <div className="mx-auto max-w-xl space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold">QR Code Generator</h1>
            <p className="text-gray-500">
              Create a batch of QR codes for your EchoNotes
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700">
              Base slug
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
              placeholder="gift"
            />

            <label className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            />

            <div className="rounded-xl bg-gray-50 p-4 text-sm break-all text-gray-700">
              Example single URL:{" "}
              {generatedSlugs.length > 0 ? `${baseUrl}/c/${generatedSlugs[0]}` : ""}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-6 space-y-6">
            <p className="text-center text-sm text-gray-500">
              {generatedSlugs.length} codes generated
            </p>

            {generatedSlugs.map((s) => {
              const url = `${baseUrl}/c/${s}`;

              return (
                <div key={s} className="text-center space-y-2">
                  <p className="text-sm font-medium text-gray-700">{s}</p>
                  <p className="text-xs break-all text-gray-500">{url}</p>

                  <div className="flex justify-center">
                    <QRCodeCanvas value={url} size={160} includeMargin />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </AdminGate>
  );
}
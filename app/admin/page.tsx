"use client";

import { useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function AdminPage() {
  const [slug, setSlug] = useState("gift-001");
  const qrRef = useRef<HTMLDivElement>(null);

  const baseUrl =
    "https://voice-notes-v85v6ik4c-echo-note.vercel.app";

  const fullUrl = useMemo(() => {
    const cleanSlug = slug.trim();
    return `${baseUrl}/c/${cleanSlug}`;
  }, [slug]);

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `${slug || "qr-code"}.png`;
    link.click();
  };

  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="mx-auto max-w-xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">QR Code Generator</h1>
          <p className="text-gray-500">
            Create a QR code for any message slug
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700">
            Slug
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="gift-001"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
          />

          <div className="rounded-xl bg-gray-50 p-4 text-sm break-all text-gray-700">
            {fullUrl}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 p-6 text-center space-y-6">
          <div ref={qrRef} className="flex justify-center">
            <QRCodeCanvas value={fullUrl} size={240} includeMargin />
          </div>

          <button
            onClick={downloadQr}
            className="rounded-xl bg-black px-6 py-3 text-white"
          >
            Download QR
          </button>
        </div>
      </div>
    </main>
  );
}
"use client";

import { useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import AdminGate from "../components/AdminGate";

export default function AdminPage() {
  const [slug, setSlug] = useState("gift");
  const [count, setCount] = useState(10);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const baseUrl = "https://voice-notes-v85v6ik4c-echo-note.vercel.app";

  const fullUrl = useMemo(() => {
    const cleanSlug = slug.trim();
    return `${baseUrl}/c/${cleanSlug}`;
  }, [slug]);

  const generatedSlugs = Array.from({ length: count }, (_, i) => {
    const num = String(i + 1).padStart(3, "0");
    return `${slug}-${num}`;
  });

  const openPrintableSheet = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const qrItemsHtml = generatedSlugs
      .map((s) => {
        const url = `${baseUrl}/c/${s}`;
        return `
          <div class="sticker-cell">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                url
              )}"
              alt="${s}"
            />
            <div class="slug">${s}</div>
          </div>
        `;
      })
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Sticker Sheet - ${slug}</title>
          <style>
            @page {
              size: letter;
              margin: 0.5in;
            }

            body {
              font-family: Arial, sans-serif;
              margin: 0;
              color: #111;
            }

            .sheet-header {
              margin-bottom: 0.25in;
            }

            .sheet-title {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 4px;
            }

            .sheet-subtitle {
              font-size: 12px;
              color: #666;
            }

            .grid {
              display: grid;
              grid-template-columns: repeat(6, 1in);
              gap: 0.15in;
              justify-content: start;
            }

            .sticker-cell {
              width: 1in;
              text-align: center;
              break-inside: avoid;
            }

            .sticker-cell img {
              width: 1in;
              height: 1in;
              display: block;
            }

            .slug {
              margin-top: 4px;
              font-size: 8px;
              color: #666;
              word-break: break-all;
              line-height: 1.1;
            }

            @media print {
              .sheet-header {
                margin-bottom: 0.2in;
              }
            }
          </style>
        </head>
        <body>
          <div class="sheet-header">
            <div class="sheet-title">QR Sticker Sheet</div>
            <div class="sheet-subtitle">
              ${generatedSlugs.length} codes for base slug: ${slug}
            </div>
          </div>

          <div class="grid">
            ${qrItemsHtml}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
  };

  const saveBatchToInventory = async () => {
    setIsSavingBatch(true);
    setSaveMessage("");

    try {
      const rows = generatedSlugs.map((s) => ({
        slug: s,
      }));

      const { error } = await supabase.from("qr_codes").insert(rows);

      if (error) {
        const message = error.message?.toLowerCase() || "";

        if (message.includes("duplicate") || message.includes("unique")) {
          setSaveMessage("Some or all of these slugs already exist in inventory.");
          setIsSavingBatch(false);
          return;
        }

        throw error;
      }

      setSaveMessage("Batch saved to inventory.");
    } catch (error) {
      console.error("Error saving batch:", error);
      setSaveMessage("There was a problem saving this batch.");
    } finally {
      setIsSavingBatch(false);
    }
  };

  return (
    <AdminGate>
      <main className="min-h-screen bg-white px-6 py-12">
        <div className="mx-auto max-w-xl space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold">QR Code Generator</h1>
            <p className="text-gray-500">
              Create batches of QR codes for message links
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700">
              Base slug
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="gift"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />

            <label className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />

            <div className="rounded-xl bg-gray-50 p-4 text-sm break-all text-gray-700">
              Example single URL: {fullUrl}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-6 text-center space-y-6">
            <div className="space-y-6">
              <p className="text-sm text-gray-500">
                {generatedSlugs.length} codes generated
              </p>

              {generatedSlugs.map((s) => {
                const url = `${baseUrl}/c/${s}`;

                return (
                  <div key={s} className="text-center space-y-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700">{s}</p>
                      <p className="text-xs break-all text-gray-400">{url}</p>
                    </div>

                    <div className="flex justify-center">
                      <QRCodeCanvas value={url} size={160} includeMargin />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={openPrintableSheet}
                className="rounded-xl bg-black px-6 py-3 text-white"
              >
                Open printable sheet
              </button>

              <button
                onClick={saveBatchToInventory}
                disabled={isSavingBatch}
                className={`rounded-xl px-6 py-3 text-white ${
                  isSavingBatch ? "bg-gray-400" : "bg-black"
                }`}
              >
                {isSavingBatch ? "Saving..." : "Save batch to inventory"}
              </button>
            </div>

            {saveMessage && (
              <p className="text-sm text-gray-500">{saveMessage}</p>
            )}
          </div>
        </div>
      </main>
    </AdminGate>
  );
}
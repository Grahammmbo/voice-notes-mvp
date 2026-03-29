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

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://voice-notes-mvp-p7gc.vercel.app";

  const generatedSlugs = useMemo(() => {
    const cleanBase = slug.trim().replace(/\s+/g, "-").toLowerCase();

    return Array.from({ length: count }, (_, i) => {
      const num = String(i + 1).padStart(3, "0");
      return `${cleanBase}-${num}`;
    });
  }, [slug, count]);

  const exampleUrl =
    generatedSlugs.length > 0 ? `${baseUrl}/c/${generatedSlugs[0]}` : "";

  const openPrintableSheet = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const qrItemsHtml = generatedSlugs
      .map((s) => {
        const url = `${baseUrl}/c/${s}`;

        return `
          <div class="sticker">
            <div class="sticker-inner">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                  url
                )}"
                alt="${s}"
              />
              <div class="brand">EchoNote</div>
              <div class="slug">${s}</div>
            </div>
          </div>
        `;
      })
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>EchoNote Stickers</title>
          <style>
            @page {
              size: letter;
              margin: 0.5in;
            }

            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
              margin: 0;
              color: #111;
              background: #faf8f4;
            }

            .sheet {
              padding: 0.1in 0;
            }

            .sheet-header {
              text-align: center;
              margin-bottom: 0.35in;
            }

            .sheet-title {
              font-size: 22px;
              font-weight: 700;
              letter-spacing: -0.02em;
              margin-bottom: 6px;
            }

            .sheet-subtitle {
              font-size: 12px;
              color: #666;
            }

            .grid {
              display: grid;
              grid-template-columns: repeat(6, 1in);
              gap: 0.16in;
              justify-content: start;
            }

            .sticker {
              width: 1in;
              height: 1in;
              box-sizing: border-box;
            }

            .sticker-inner {
              width: 1in;
              height: 1in;
              box-sizing: border-box;
              border: 1px solid #d8d3cb;
              border-radius: 14px;
              background: #fffdf9;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 0.05in;
              box-shadow: inset 0 0 0 1px rgba(255,255,255,0.7);
            }

            .sticker-inner img {
              width: 0.72in;
              height: 0.72in;
              display: block;
            }

            .brand {
              margin-top: 0.03in;
              font-size: 7px;
              font-weight: 600;
              letter-spacing: 0.03em;
              color: #444;
              line-height: 1;
            }

            .slug {
              margin-top: 2px;
              font-size: 5.5px;
              color: #888;
              line-height: 1;
            }

            @media print {
              body {
                background: white;
              }

              .sticker-inner {
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="sheet-header">
              <div class="sheet-title">EchoNote Sticker Sheet</div>
              <div class="sheet-subtitle">
                ${generatedSlugs.length} stickers for base slug: ${slug}
              </div>
            </div>

            <div class="grid">
              ${qrItemsHtml}
            </div>
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
      const rows = generatedSlugs.map((s) => ({ slug: s }));

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
              Example single URL: {exampleUrl}
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
                      <p className="text-xs break-all text-gray-500">{url}</p>
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
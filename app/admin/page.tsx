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
              />
              <div class="brand">EchoNote</div>
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
              background: #faf8f4;
              color: #111;
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
            }

            .sheet-subtitle {
              font-size: 12px;
              color: #777;
              margin-top: 4px;
            }

            .grid {
              display: grid;
              grid-template-columns: repeat(6, 1in);
              gap: 0.16in;
            }

            .sticker {
              width: 1in;
              height: 1in;
            }

            .sticker-inner {
              width: 1in;
              height: 1in;
              border-radius: 14px;
              border: 1px solid #eae6df;
              background: #fffdf9;

              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;

              padding: 0.05in;
              box-sizing: border-box;
            }

            .sticker-inner img {
              width: 0.8in;
              height: 0.8in;
            }

            .brand {
              margin-top: 0.03in;
              font-size: 7px;
              font-weight: 600;
              letter-spacing: 0.03em;
              color: #444;
            }

            @media print {
              body {
                background: white;
              }
            }
          </style>
        </head>

        <body>
          <div class="sheet">
            <div class="sheet-header">
              <div class="sheet-title">EchoNote</div>
              <div class="sheet-subtitle">
                Scan to hear a message
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
          setSaveMessage("Some or all of these slugs already exist.");
          setIsSavingBatch(false);
          return;
        }

        throw error;
      }

      setSaveMessage("Batch saved to inventory.");
    } catch (error) {
      console.error(error);
      setSaveMessage("Error saving batch.");
    } finally {
      setIsSavingBatch(false);
    }
  };

  return (
    <AdminGate>
      <main className="min-h-screen bg-white px-6 py-12">
        <div className="mx-auto max-w-xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold">QR Code Generator</h1>
            <p className="text-gray-500">
              Create batches of QR codes for message links
            </p>
          </div>

          <div className="space-y-4 border rounded-2xl p-6">
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="base slug"
              className="w-full border rounded-xl px-4 py-3"
            />

            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full border rounded-xl px-4 py-3"
            />

            <div className="text-sm text-gray-500 break-all">
              Example: {exampleUrl}
            </div>
          </div>

          <div className="space-y-6 border rounded-2xl p-6 text-center">
            {generatedSlugs.map((s) => {
              const url = `${baseUrl}/c/${s}`;

              return (
                <div key={s}>
                  <QRCodeCanvas value={url} size={140} />
                </div>
              );
            })}

            <div className="flex gap-3 justify-center">
              <button
                onClick={openPrintableSheet}
                className="bg-black text-white px-6 py-3 rounded-xl"
              >
                Printable sheet
              </button>

              <button
                onClick={saveBatchToInventory}
                className="bg-black text-white px-6 py-3 rounded-xl"
              >
                Save batch
              </button>
            </div>

            {saveMessage && <p>{saveMessage}</p>}
          </div>
        </div>
      </main>
    </AdminGate>
  );
}
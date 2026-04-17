import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

const supabase = createClient(
  getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  getEnv("SUPABASE_SERVICE_ROLE_KEY")
);

const PAGE_WIDTH = 612; // 8.5" x 72
const PAGE_HEIGHT = 792; // 11" x 72

const LABEL_SIZE = 72; // 1"
const MARGIN_X = 45; // 0.625"
const MARGIN_Y = 45; // 0.625"
const GAP = 18; // 0.25"
const COLS = 6;
const ROWS = 8;
const LABELS_PER_PAGE = COLS * ROWS;

function randomSlug(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

async function generateUniqueSlugs(count: number): Promise<string[]> {
  const finalSlugs: string[] = [];

  while (finalSlugs.length < count) {
    const remaining = count - finalSlugs.length;
    const candidateCount = Math.max(remaining * 3, 20);
    const candidateSet = new Set<string>();

    while (candidateSet.size < candidateCount) {
      candidateSet.add(randomSlug(8));
    }

    const candidates = Array.from(candidateSet);

    const { data, error } = await supabase
      .from("qr_codes")
      .select("slug")
      .in("slug", candidates);

    if (error) {
      throw new Error(error.message);
    }

    const existing = new Set((data ?? []).map((row) => row.slug as string));

    for (const slug of candidates) {
      if (!existing.has(slug) && !finalSlugs.includes(slug)) {
        finalSlugs.push(slug);
      }

      if (finalSlugs.length >= count) {
        break;
      }
    }
  }

  return finalSlugs;
}

function getBaseUrl(req: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";

  if (!host) {
    throw new Error("Missing host header");
  }

  return `${proto}://${host}`;
}

async function buildPdf(slugs: string[], baseUrl: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  for (let pageStart = 0; pageStart < slugs.length; pageStart += LABELS_PER_PAGE) {
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    const pageSlugs = slugs.slice(pageStart, pageStart + LABELS_PER_PAGE);

    for (let i = 0; i < pageSlugs.length; i += 1) {
      const slug = pageSlugs[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);

      const x = MARGIN_X + col * (LABEL_SIZE + GAP);
      const y = PAGE_HEIGHT - MARGIN_Y - LABEL_SIZE - row * (LABEL_SIZE + GAP);

      const targetUrl = `${baseUrl}/c/${slug}`;
      const qrDataUrl = await QRCode.toDataURL(targetUrl, {
        errorCorrectionLevel: "M",
        margin: 0,
        width: 256,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      const base64 = qrDataUrl.split(",")[1];
      const qrBytes = Uint8Array.from(Buffer.from(base64, "base64"));
      const qrImage = await pdf.embedPng(qrBytes);

      const qrSize = 56;
      const qrX = x + (LABEL_SIZE - qrSize) / 2;
      const qrY = y + 12;

      page.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize,
      });

      page.drawText(slug, {
        x: x + 6,
        y: y + 4,
        size: 6,
        font,
      });
    }
  }

  return pdf.save();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const count = Number(body?.count ?? 0);

    if (!Number.isInteger(count) || count < 1 || count > 500) {
      return NextResponse.json(
        { error: "Count must be an integer between 1 and 500." },
        { status: 400 }
      );
    }

    const slugs = await generateUniqueSlugs(count);

    const { error: insertError } = await supabase
      .from("qr_codes")
      .insert(slugs.map((slug) => ({ slug })));

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const baseUrl = getBaseUrl(req);
    const pdfBytes = await buildPdf(slugs, baseUrl);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `echonote-qr-batch-${count}-${timestamp}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("QR PDF generation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate QR PDF.",
      },
      { status: 500 }
    );
  }
}
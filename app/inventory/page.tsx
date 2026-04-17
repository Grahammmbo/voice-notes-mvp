"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import AdminGate from "../components/AdminGate";

type QrCodeRow = {
  id: string;
  slug: string;
  created_at: string;
};

type MessageRow = {
  slug: string;
};

export default function InventoryPage() {
  const [rows, setRows] = useState<QrCodeRow[]>([]);
  const [usedSlugs, setUsedSlugs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "used" | "unused">("all");

  // ✅ Uses your actual domain automatically
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

  useEffect(() => {
    const loadInventory = async () => {
      const { data: qrData } = await supabase
        .from("qr_codes")
        .select("id, slug, created_at")
        .order("created_at", { ascending: false });

      const { data: messageData } = await supabase
        .from("messages")
        .select("slug");

      const messageSlugSet = new Set(
        (messageData as MessageRow[] | null)?.map((row) => row.slug) ?? []
      );

      setRows((qrData as QrCodeRow[]) ?? []);
      setUsedSlugs(messageSlugSet);
      setIsLoading(false);
    };

    loadInventory();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const isUsed = usedSlugs.has(row.slug);

      if (search && !row.slug.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      if (filter === "used" && !isUsed) return false;
      if (filter === "unused" && isUsed) return false;

      return true;
    });
  }, [rows, usedSlugs, search, filter]);

  return (
    <AdminGate>
      <main className="min-h-screen bg-white px-6 py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">QR Inventory</h1>
            <p className="text-gray-500">
              Track and manage your QR codes
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Search by slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            />

            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as "all" | "used" | "unused")
              }
              className="rounded-xl border border-gray-300 px-4 py-3"
            >
              <option value="all">All</option>
              <option value="used">Used</option>
              <option value="unused">Unused</option>
            </select>
          </div>

          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : filteredRows.length === 0 ? (
            <p className="text-gray-500">No matching results.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const isUsed = usedSlugs.has(row.slug);

                    return (
                      <tr key={row.id} className="border-t">
                        <td className="px-4 py-3 font-medium">
                          {row.slug}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${
                              isUsed
                                ? "bg-black text-white"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {isUsed ? "Used" : "Unused"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`${baseUrl}/c/${row.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                          >
                            Open
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </AdminGate>
  );
}
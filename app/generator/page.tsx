import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import AdminGate from "../components/AdminGate";

export const dynamic = "force-dynamic";

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

type QrCodeRow = {
  id: string;
  slug: string;
  created_at: string;
};

function randomSlug(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

async function generateUniqueSlugs(count: number) {
  const slugs = new Set<string>();
  let attempts = 0;
  const maxAttempts = count * 30;

  while (slugs.size < count && attempts < maxAttempts) {
    slugs.add(randomSlug(8));
    attempts += 1;
  }

  if (slugs.size < count) {
    throw new Error("Could not generate enough unique slugs.");
  }

  return Array.from(slugs);
}

async function createSlugBatch(formData: FormData) {
  "use server";

  const rawCount = formData.get("count")?.toString() ?? "0";
  const count = Number(rawCount);

  if (!Number.isInteger(count) || count <= 0 || count > 500) {
    throw new Error("Enter a batch size between 1 and 500.");
  }

  const newSlugs = await generateUniqueSlugs(count);

  const rows = newSlugs.map((slug) => ({
    slug,
  }));

  const { error } = await supabase.from("qr_codes").insert(rows);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/inventory");
  revalidatePath("/generator");
}

export default async function GeneratorPage() {
  const { data: recentRows, error } = await supabase
    .from("qr_codes")
    .select("id, slug, created_at")
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (recentRows ?? []) as QrCodeRow[];

  return (
    <AdminGate>
      <main className="min-h-screen bg-black px-4 py-8 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Slug Generator</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Create new EchoNote QR slugs and send them into inventory.
            </p>
          </div>

          <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-lg font-semibold">Create New Batch</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Enter how many new slugs you want to generate.
            </p>

            <form
              action={createSlugBatch}
              className="mt-4 flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="number"
                name="count"
                min={1}
                max={500}
                defaultValue={25}
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-sm text-white outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:opacity-90"
              >
                Generate Slugs
              </button>
            </form>

            <p className="mt-3 text-xs text-zinc-500">
              Recommended small test batch: 10–25. Max per batch: 500.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Most Recent Slugs</h2>
              <a
                href="/inventory"
                className="text-sm text-zinc-300 underline underline-offset-4"
              >
                View full inventory
              </a>
            </div>

            {rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-zinc-400">
                    <tr className="border-b border-zinc-800">
                      <th className="px-3 py-3">Slug</th>
                      <th className="px-3 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-zinc-900">
                        <td className="px-3 py-3 font-mono text-white">
                          {row.slug}
                        </td>
                        <td className="px-3 py-3 text-zinc-300">
                          {row.created_at
                            ? new Date(row.created_at).toLocaleString()
                            : "Unknown"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-zinc-400">No slugs found.</div>
            )}
          </div>
        </div>
      </main>
    </AdminGate>
  );
}
import { createClient } from "@supabase/supabase-js";
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

async function markShipped(formData: FormData) {
  "use server";

  const id = formData.get("id")?.toString();
  const trackingNumber = formData.get("tracking_number")?.toString().trim() || null;

  if (!id) {
    throw new Error("Missing order id");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      fulfillment_status: "shipped",
      tracking_number: trackingNumber,
      shipped_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

async function markPending(formData: FormData) {
  "use server";

  const id = formData.get("id")?.toString();

  if (!id) {
    throw new Error("Missing order id");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      fulfillment_status: "paid",
      tracking_number: null,
      shipped_at: null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export default async function AdminPage() {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <AdminGate>
      <main className="min-h-screen bg-black text-white px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Fulfillment Dashboard</h1>
            <p className="mt-2 text-sm text-zinc-400">
              View new EchoNote orders and mark them shipped.
            </p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-sm text-zinc-400">Total Orders</p>
              <p className="mt-2 text-2xl font-semibold">{orders?.length ?? 0}</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-sm text-zinc-400">Ready to Ship</p>
              <p className="mt-2 text-2xl font-semibold">
                {orders?.filter((o) => o.fulfillment_status === "paid").length ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-sm text-zinc-400">Shipped</p>
              <p className="mt-2 text-2xl font-semibold">
                {orders?.filter((o) => o.fulfillment_status === "shipped").length ?? 0}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {orders?.length ? (
              orders.map((order) => {
                const addressLine1 =
                  order.shipping_line1 ?? order.shipping_address_line1 ?? "";
                const addressLine2 =
                  order.shipping_line2 ?? order.shipping_address_line2 ?? "";

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-lg font-semibold">
                            {order.pack_name || "Unknown Pack"}
                          </h2>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              order.fulfillment_status === "shipped"
                                ? "border border-green-500/30 bg-green-500/15 text-green-300"
                                : "border border-yellow-500/30 bg-yellow-500/15 text-yellow-300"
                            }`}
                          >
                            {order.fulfillment_status || "paid"}
                          </span>

                          <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                            {order.sticker_count ?? "?"} cards
                          </span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              Customer
                            </p>
                            <p className="mt-1 text-sm text-white">
                              {order.shipping_name || order.customer_name || "No name"}
                            </p>
                            <p className="text-sm text-zinc-300">
                              {order.customer_email || "No email"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">
                              Payment
                            </p>
                            <p className="mt-1 text-sm text-white">
                              {order.payment_status || "unknown"}
                            </p>
                            <p className="text-sm text-zinc-300">
                              {order.currency
                                ? `${(
                                    (order.amount_total ?? order.unit_amount ?? 0) / 100
                                  ).toFixed(2)} ${String(order.currency).toUpperCase()}`
                                : `$${(
                                    (order.amount_total ?? order.unit_amount ?? 0) / 100
                                  ).toFixed(2)}`}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wide text-zinc-500">
                            Ship To
                          </p>
                          <div className="mt-1 text-sm text-zinc-200">
                            <p>{addressLine1 || "No street address saved"}</p>
                            {addressLine2 ? <p>{addressLine2}</p> : null}
                            <p>
                              {[order.shipping_city, order.shipping_state]
                                .filter(Boolean)
                                .join(", ")}{" "}
                              {order.shipping_postal_code || ""}
                            </p>
                            <p>{order.shipping_country || ""}</p>
                          </div>
                        </div>

                        <div className="text-xs text-zinc-500">
                          <p>Order ID: {order.id}</p>
                          <p>Stripe Session: {order.stripe_session_id}</p>
                          <p>
                            Created:{" "}
                            {order.created_at
                              ? new Date(order.created_at).toLocaleString()
                              : "Unknown"}
                          </p>
                          {order.shipped_at ? (
                            <p>
                              Shipped: {new Date(order.shipped_at).toLocaleString()}
                            </p>
                          ) : null}
                          {order.tracking_number ? (
                            <p>Tracking: {order.tracking_number}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="w-full max-w-md space-y-3">
                        <form action={markShipped} className="space-y-3">
                          <input type="hidden" name="id" value={order.id} />
                          <input
                            name="tracking_number"
                            placeholder="Tracking number (optional)"
                            defaultValue={order.tracking_number ?? ""}
                            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-sm text-white outline-none"
                          />
                          <button
                            type="submit"
                            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:opacity-90"
                          >
                            Mark as Shipped
                          </button>
                        </form>

                        {order.fulfillment_status === "shipped" ? (
                          <form action={markPending}>
                            <input type="hidden" name="id" value={order.id} />
                            <button
                              type="submit"
                              className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-900"
                            >
                              Move Back to Paid
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">
                No orders yet.
              </div>
            )}
          </div>
        </div>
      </main>
    </AdminGate>
  );
}
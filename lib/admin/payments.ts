import { supabase } from "@/lib/supabase";
import {
  computeCoveredRestaurantIds,
  loadOwnerSubscriptionContext,
  pickCanonicalSubscription,
} from "@/lib/subscriptions/owner-subscription";
import { normalizePlanId } from "@/lib/subscriptions/plans";
import type { ExportDataset } from "@/lib/export/types";

export const PAYMENT_STATUSES = [
  "paid",
  "pending",
  "overdue",
  "refunded",
  "failed",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  myfatoorah: "MyFatoorah",
  myfatoorah_failed: "MyFatoorah",
  manual: "Manual",
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  card: "Card",
};

export type PaymentItem = {
  id: string;
  restaurantId: string;
  restaurantName: string | null;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string | null;
  plan: string | null;
  coveredRestaurantNames: string[];
  coveredCount: number;
  invoiceNumber: string | null;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  reference: string | null;
  notes: string | null;
  isManualEntry: boolean;
};

type PaymentRow = {
  id: string;
  restaurant_id: string;
  invoice_number: string | null;
  amount: number | string;
  currency: string;
  payment_method: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  reference?: string | null;
  notes?: string | null;
  created_at: string;
  restaurants:
    | {
        owner_id: string;
        owner_name: string | null;
        email: string | null;
        restaurant_name: string | null;
      }
    | {
        owner_id: string;
        owner_name: string | null;
        email: string | null;
        restaurant_name: string | null;
      }[]
    | null;
};

const ERROR = "Unable to load payments. Please try again.";

const SELECT_WITH_RESTAURANT =
  "*, restaurants(owner_id, owner_name, email, restaurant_name)";

function restaurantFromJoin(row: PaymentRow) {
  if (Array.isArray(row.restaurants)) return row.restaurants[0] ?? null;
  return row.restaurants;
}

export function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return "—";
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export function isManualPaymentEntry(method: string | null | undefined): boolean {
  if (!method) return false;
  return (
    method === "manual" ||
    method === "bank_transfer" ||
    method === "cash"
  );
}

function displayInvoice(item: Pick<PaymentItem, "invoiceNumber" | "id">): string {
  if (item.invoiceNumber?.trim()) return item.invoiceNumber.trim();
  return `INV-${item.id.slice(0, 8).toUpperCase()}`;
}

async function enrichPaymentRows(rows: PaymentRow[]): Promise<PaymentItem[]> {
  const ownerCache = new Map<
    string,
    {
      plan: string | null;
      coveredNames: string[];
      coveredCount: number;
    }
  >();

  const items: PaymentItem[] = [];

  for (const row of rows) {
    const restaurant = restaurantFromJoin(row);
    const ownerId = restaurant?.owner_id ?? "";

    let plan: string | null = null;
    let coveredRestaurantNames: string[] = [];
    let coveredCount = 0;

    if (ownerId) {
      let cached = ownerCache.get(ownerId);
      if (!cached) {
        const context = await loadOwnerSubscriptionContext(supabase, ownerId);
        if (context?.canonical) {
          const ownerPlan = normalizePlanId(context.canonical.plan);
          const coveredIds = computeCoveredRestaurantIds(
            context.restaurants,
            context.subscriptions,
            ownerPlan,
          );
          coveredRestaurantNames = context.restaurants
            .filter((item) => coveredIds.includes(item.id))
            .map((item) => item.restaurant_name?.trim() || "Unnamed restaurant");
          cached = {
            plan: ownerPlan,
            coveredNames: coveredRestaurantNames,
            coveredCount: coveredIds.length,
          };
        } else {
          cached = { plan: null, coveredNames: [], coveredCount: 0 };
        }
        ownerCache.set(ownerId, cached);
      }
      plan = cached.plan;
      coveredRestaurantNames = cached.coveredNames;
      coveredCount = cached.coveredCount;
    }

    items.push({
      id: row.id,
      restaurantId: row.restaurant_id,
      restaurantName: restaurant?.restaurant_name ?? null,
      ownerId,
      ownerName: restaurant?.owner_name ?? null,
      ownerEmail: restaurant?.email ?? null,
      plan,
      coveredRestaurantNames,
      coveredCount,
      invoiceNumber: row.invoice_number,
      amount: Number(row.amount ?? 0),
      currency: row.currency || "KWD",
      paymentMethod: row.payment_method,
      status: row.status,
      paidAt: row.paid_at,
      createdAt: row.created_at,
      reference: row.reference ?? null,
      notes: row.notes ?? null,
      isManualEntry: isManualPaymentEntry(row.payment_method),
    });
  }

  return items;
}

export async function fetchPayments(): Promise<
  { ok: true; data: PaymentItem[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select(SELECT_WITH_RESTAURANT)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: error.message || ERROR };
    return {
      ok: true,
      data: await enrichPaymentRows((data ?? []) as PaymentRow[]),
    };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function fetchPaymentsForRestaurant(
  restaurantId: string,
): Promise<{ ok: true; data: PaymentItem[] } | { ok: false; message: string }> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select(SELECT_WITH_RESTAURANT)
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: error.message || ERROR };
    return {
      ok: true,
      data: await enrichPaymentRows((data ?? []) as PaymentRow[]),
    };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function fetchPaymentsForRestaurants(
  restaurantIds: string[],
): Promise<{ ok: true; data: PaymentItem[] } | { ok: false; message: string }> {
  try {
    if (restaurantIds.length === 0) return { ok: true, data: [] };

    const { data, error } = await supabase
      .from("payments")
      .select(SELECT_WITH_RESTAURANT)
      .in("restaurant_id", restaurantIds)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: error.message || ERROR };
    return {
      ok: true,
      data: await enrichPaymentRows((data ?? []) as PaymentRow[]),
    };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export function filterPayments(
  items: PaymentItem[],
  params: {
    search: string;
    status: PaymentStatus | "all";
  },
): PaymentItem[] {
  const query = params.search.trim().toLowerCase();
  return items.filter((item) => {
    if (params.status !== "all" && item.status !== params.status) return false;
    if (!query) return true;
    return (
      displayInvoice(item).toLowerCase().includes(query) ||
      (item.ownerName?.toLowerCase().includes(query) ?? false) ||
      (item.ownerEmail?.toLowerCase().includes(query) ?? false) ||
      (item.restaurantName?.toLowerCase().includes(query) ?? false) ||
      item.coveredRestaurantNames.some((name) =>
        name.toLowerCase().includes(query),
      ) ||
      (item.reference?.toLowerCase().includes(query) ?? false) ||
      (item.invoiceNumber?.toLowerCase().includes(query) ?? false) ||
      (item.paymentMethod?.toLowerCase().includes(query) ?? false)
    );
  });
}

export function formatPaymentAmount(
  amount: number,
  currency = "KWD",
): string {
  const prefix = currency === "KWD" ? "KD" : currency;
  return `${prefix} ${amount.toLocaleString("en-KW", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })}`;
}

export function sumPaidThisMonth(items: PaymentItem[]): number {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return items
    .filter((item) => {
      if (item.status !== "paid") return false;
      const paidAt = item.paidAt ? new Date(item.paidAt) : new Date(item.createdAt);
      return paidAt.getMonth() === month && paidAt.getFullYear() === year;
    })
    .reduce((sum, item) => sum + item.amount, 0);
}

export function buildPaymentExportDataset(
  items: PaymentItem[],
  filterSummary: string[],
): ExportDataset {
  return {
    filenamePrefix: "payments",
    meta: {
      title: "Platform Payments",
      filterSummary,
      generatedAt: new Date(),
    },
    columns: [
      { key: "invoice", header: "Invoice" },
      { key: "owner", header: "Owner" },
      { key: "email", header: "Email" },
      { key: "plan", header: "Plan" },
      { key: "coveredRestaurants", header: "Covered Restaurants" },
      { key: "amount", header: "Amount", type: "currency" },
      { key: "method", header: "Method" },
      { key: "status", header: "Status" },
      { key: "created", header: "Created", type: "datetime" },
      { key: "paid", header: "Paid", type: "datetime" },
      { key: "reference", header: "Reference" },
    ],
    rows: items.map((item) => ({
      invoice: displayInvoice(item),
      owner: item.ownerName ?? "",
      email: item.ownerEmail ?? "",
      plan: item.plan ?? "",
      coveredRestaurants: item.coveredRestaurantNames.join(", "),
      amount: item.amount,
      method: formatPaymentMethod(item.paymentMethod),
      status: item.status,
      created: item.createdAt,
      paid: item.paidAt ?? "",
      reference: item.reference ?? "",
    })),
    summary: [
      { label: "Total rows", value: String(items.length) },
      {
        label: "Paid total",
        value: formatPaymentAmount(
          items
            .filter((item) => item.status === "paid")
            .reduce((sum, item) => sum + item.amount, 0),
        ),
      },
    ],
  };
}

/** @deprecated Use buildPaymentExportDataset + runExport for multi-format exports. */
export function exportPaymentsToCsv(items: PaymentItem[]): string {
  const dataset = buildPaymentExportDataset(items, []);
  const headers = dataset.columns.map((column) => column.header);
  const rows = dataset.rows.map((row) =>
    dataset.columns.map((column) => String(row[column.key] ?? "")),
  );
  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export { displayInvoice, pickCanonicalSubscription };

import { supabase } from "@/lib/supabase";

export const PAYMENT_STATUSES = [
  "paid",
  "pending",
  "overdue",
  "refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type PaymentItem = {
  id: string;
  restaurantId: string;
  restaurantName: string | null;
  invoiceNumber: string | null;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
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
  created_at: string;
  restaurants:
    | { restaurant_name: string | null }
    | { restaurant_name: string | null }[]
    | null;
};

const ERROR = "Unable to load payments. Please try again.";

function restaurantName(row: PaymentRow): string | null {
  if (Array.isArray(row.restaurants)) {
    return row.restaurants[0]?.restaurant_name ?? null;
  }
  return row.restaurants?.restaurant_name ?? null;
}

function mapRow(row: PaymentRow): PaymentItem {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    restaurantName: restaurantName(row),
    invoiceNumber: row.invoice_number,
    amount: Number(row.amount ?? 0),
    currency: row.currency || "KWD",
    paymentMethod: row.payment_method,
    status: row.status,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}

export async function fetchPayments(): Promise<
  { ok: true; data: PaymentItem[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*, restaurants(restaurant_name)")
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true, data: ((data ?? []) as PaymentRow[]).map(mapRow) };
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
      .select("*, restaurants(restaurant_name)")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true, data: ((data ?? []) as PaymentRow[]).map(mapRow) };
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
      (item.restaurantName?.toLowerCase().includes(query) ?? false) ||
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

export function exportPaymentsToCsv(items: PaymentItem[]): string {
  const headers = [
    "Invoice",
    "Restaurant",
    "Amount",
    "Currency",
    "Method",
    "Status",
    "Paid At",
    "Created",
  ];

  const escapeCell = (value: string) => {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };

  const rows = items.map((item) =>
    [
      item.invoiceNumber ?? "",
      item.restaurantName ?? "",
      String(item.amount),
      item.currency,
      item.paymentMethod ?? "",
      item.status,
      item.paidAt ?? "",
      item.createdAt,
    ]
      .map((cell) => escapeCell(String(cell)))
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
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

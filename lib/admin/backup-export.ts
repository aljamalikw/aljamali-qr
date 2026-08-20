import { supabase } from "@/lib/supabase";
import { buildCsv } from "@/lib/utils/csv";
import { fetchAdminRestaurantManagementRows } from "@/lib/admin/restaurants";
import { fetchOwners } from "@/lib/admin/owners";
import { fetchSubscriptions } from "@/lib/admin/subscriptions";
import { fetchPayments } from "@/lib/admin/payments";

export type ExportFormat = "csv" | "excel" | "json";
export type ExportDataset =
  | "restaurants"
  | "owners"
  | "subscriptions"
  | "payments"
  | "reservations"
  | "orders"
  | "qr_codes"
  | "analytics"
  | "menu_items"
  | "categories";

export const EXPORT_DATASETS: { id: ExportDataset; label: string }[] = [
  { id: "restaurants", label: "Restaurant list" },
  { id: "owners", label: "Restaurant owners" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "payments", label: "Payments" },
  { id: "reservations", label: "Reservations" },
  { id: "orders", label: "Orders" },
  { id: "qr_codes", label: "QR Codes" },
  { id: "analytics", label: "Analytics (QR scans)" },
  { id: "menu_items", label: "Menu Items" },
  { id: "categories", label: "Categories" },
];

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Minimal SpreadsheetML that Excel opens without extra dependencies. */
export function buildExcelXml(
  sheetName: string,
  headers: string[],
  rows: string[][],
): string {
  const escape = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const headerRow = `<Row>${headers
    .map((h) => `<Cell><Data ss:Type="String">${escape(h)}</Data></Cell>`)
    .join("")}</Row>`;
  const dataRows = rows
    .map(
      (row) =>
        `<Row>${row
          .map((cell) => `<Cell><Data ss:Type="String">${escape(cell)}</Data></Cell>`)
          .join("")}</Row>`,
    )
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${escape(sheetName)}">
  <Table>
   ${headerRow}
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function downloadExport(
  basename: string,
  format: ExportFormat,
  headers: string[],
  rows: string[][],
  jsonPayload?: unknown,
) {
  if (format === "json") {
    downloadBlob(
      `${basename}.json`,
      JSON.stringify(jsonPayload ?? { headers, rows }, null, 2),
      "application/json;charset=utf-8",
    );
    return;
  }
  if (format === "excel") {
    downloadBlob(
      `${basename}.xls`,
      buildExcelXml(basename.slice(0, 31), headers, rows),
      "application/vnd.ms-excel;charset=utf-8",
    );
    return;
  }
  downloadBlob(
    `${basename}.csv`,
    buildCsv(headers, rows),
    "text/csv;charset=utf-8",
  );
}

async function tableRows(
  table: string,
  restaurantIds?: string[],
): Promise<Record<string, unknown>[]> {
  let query = supabase.from(table).select("*").limit(5000);
  if (restaurantIds && restaurantIds.length > 0) {
    query = query.in("restaurant_id", restaurantIds);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

function objectsToSheet(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return { headers: ["empty"], rows: [["No data"]] };
  const headers = Object.keys(rows[0]);
  return {
    headers,
    rows: rows.map((row) =>
      headers.map((key) => {
        const value = row[key];
        if (value == null) return "";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
      }),
    ),
  };
}

export async function exportDataset(
  dataset: ExportDataset,
  format: ExportFormat,
  restaurantIds?: string[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const stamp = new Date().toISOString().slice(0, 10);
    const selected = restaurantIds && restaurantIds.length > 0;

    if (dataset === "restaurants") {
      const result = await fetchAdminRestaurantManagementRows();
      if (!result.ok) return result;
      let items = result.data;
      if (selected) {
        items = items.filter((item) => restaurantIds.includes(item.id));
      }
      const headers = [
        "ID",
        "Name",
        "Owner",
        "Email",
        "Plan",
        "Status",
        "Created",
        "Trial Ends",
        "QR Codes",
      ];
      const rows = items.map((item) => [
        item.id,
        item.restaurantName ?? "",
        item.ownerName ?? "",
        item.email ?? "",
        item.plan,
        item.status,
        item.createdAt,
        item.trialEndsAt ?? "",
        String(item.activeQrCodes),
      ]);
      downloadExport(`restaurants-${stamp}`, format, headers, rows, items);
      return { ok: true };
    }

    if (dataset === "owners") {
      const result = await fetchOwners();
      if (!result.ok) return result;
      const headers = ["Owner ID", "Email", "Restaurant", "Plan", "Active", "Created"];
      const rows = result.data.map((owner) => [
        owner.ownerId,
        owner.email ?? "",
        owner.restaurantName ?? "",
        owner.plan ?? "",
        owner.isActive ? "yes" : "no",
        owner.createdAt ?? "",
      ]);
      downloadExport(`owners-${stamp}`, format, headers, rows, result.data);
      return { ok: true };
    }

    if (dataset === "subscriptions") {
      const result = await fetchSubscriptions();
      if (!result.ok) return result;
      let items = result.data;
      if (selected) {
        items = items.filter((item) =>
          restaurantIds.includes(item.restaurantId),
        );
      }
      const headers = [
        "Restaurant",
        "Plan",
        "Status",
        "Price",
        "Trial Ends",
        "Renewal",
      ];
      const rows = items.map((item) => [
        item.restaurantName ?? "",
        item.plan,
        item.status,
        String(item.monthlyPrice),
        item.trialEndsAt ?? "",
        item.renewalDate ?? "",
      ]);
      downloadExport(`subscriptions-${stamp}`, format, headers, rows, items);
      return { ok: true };
    }

    if (dataset === "payments") {
      const result = await fetchPayments();
      if (!result.ok) return result;
      let items = result.data;
      if (selected) {
        items = items.filter((item) =>
          restaurantIds!.includes(item.restaurantId),
        );
      }
      const headers = [
        "Invoice",
        "Owner",
        "Email",
        "Plan",
        "Covered Restaurants",
        "Amount",
        "Method",
        "Status",
        "Paid At",
        "Reference",
      ];
      const rows = items.map((item) => [
        item.invoiceNumber ?? "",
        item.ownerName ?? "",
        item.ownerEmail ?? "",
        item.plan ?? "",
        item.coveredRestaurantNames.join(", "),
        String(item.amount),
        item.paymentMethod ?? "",
        item.status,
        item.paidAt ?? item.createdAt,
        item.reference ?? "",
      ]);
      downloadExport(`payments-${stamp}`, format, headers, rows, items);
      return { ok: true };
    }

    const tableMap: Record<
      Exclude<
        ExportDataset,
        "restaurants" | "owners" | "subscriptions" | "payments"
      >,
      string
    > = {
      reservations: "reservations",
      orders: "orders",
      qr_codes: "qr_codes",
      analytics: "qr_code_scans",
      menu_items: "menu_items",
      categories: "categories",
    };

    const table = tableMap[dataset];
    const raw = await tableRows(table, restaurantIds);
    const sheet = objectsToSheet(raw);
    downloadExport(
      `${dataset}-${stamp}`,
      format,
      sheet.headers,
      sheet.rows,
      raw,
    );
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to export dataset.",
    };
  }
}

export type RestaurantBackup = {
  version: 1;
  exportedAt: string;
  restaurant: Record<string, unknown> | null;
  subscription: Record<string, unknown> | null;
  categories: Record<string, unknown>[];
  menuItems: Record<string, unknown>[];
  qrCodes: Record<string, unknown>[];
  reservations: Record<string, unknown>[];
  orders: Record<string, unknown>[];
};

export async function createRestaurantBackup(
  restaurantId: string,
): Promise<
  { ok: true; backup: RestaurantBackup } | { ok: false; message: string }
> {
  try {
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .maybeSingle();
    if (error) return { ok: false, message: error.message };

    const [subscription, categories, menuItems, qrCodes, reservations, orders] =
      await Promise.all([
        supabase
          .from("restaurant_subscriptions")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .maybeSingle(),
        tableRows("categories", [restaurantId]),
        tableRows("menu_items", [restaurantId]),
        tableRows("qr_codes", [restaurantId]),
        tableRows("reservations", [restaurantId]),
        tableRows("orders", [restaurantId]),
      ]);

    const backup: RestaurantBackup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      restaurant: (restaurant as Record<string, unknown>) ?? null,
      subscription:
        (subscription.data as Record<string, unknown> | null) ?? null,
      categories,
      menuItems,
      qrCodes,
      reservations,
      orders,
    };

    return { ok: true, backup };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Unable to create backup.",
    };
  }
}

/** Framework-only restore: validates payload shape, does not write. */
export function validateRestaurantBackup(payload: unknown): {
  ok: true;
  preview: {
    restaurantName: string | null;
    categories: number;
    menuItems: number;
    qrCodes: number;
  };
} | { ok: false; message: string } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Invalid backup file." };
  }
  const data = payload as Partial<RestaurantBackup>;
  if (data.version !== 1) {
    return { ok: false, message: "Unsupported backup version." };
  }
  if (!data.restaurant || typeof data.restaurant !== "object") {
    return { ok: false, message: "Backup is missing restaurant data." };
  }
  return {
    ok: true,
    preview: {
      restaurantName:
        typeof data.restaurant.restaurant_name === "string"
          ? data.restaurant.restaurant_name
          : null,
      categories: Array.isArray(data.categories) ? data.categories.length : 0,
      menuItems: Array.isArray(data.menuItems) ? data.menuItems.length : 0,
      qrCodes: Array.isArray(data.qrCodes) ? data.qrCodes.length : 0,
    },
  };
}

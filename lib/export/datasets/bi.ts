import type { BiDashboardData, MultiRestaurantRow } from "@/lib/intelligence/types";
import { formatMoney } from "@/lib/intelligence/ranges";
import type { ExportDataset } from "../types";

const KPI_EXPORT: Array<{
  key: keyof BiDashboardData["kpis"];
  label: string;
  money?: boolean;
}> = [
  { key: "revenueToday", label: "Revenue Today", money: true },
  { key: "revenueYesterday", label: "Revenue Yesterday", money: true },
  { key: "ordersToday", label: "Orders Today" },
  { key: "reservationsToday", label: "Reservations Today" },
  { key: "averageOrderValue", label: "Avg Order Value", money: true },
  { key: "returningCustomers", label: "Returning Customers" },
  { key: "newCustomers", label: "New Customers" },
  { key: "loyaltyMembers", label: "Loyalty Members" },
  { key: "pendingReservations", label: "Pending Reservations" },
  { key: "cancelledReservations", label: "Cancelled Reservations" },
  { key: "marketingCampaigns", label: "Campaigns" },
  { key: "customerGrowth", label: "Customer Growth" },
];

function formatKpiValue(
  key: keyof BiDashboardData["kpis"],
  data: BiDashboardData,
  money?: boolean,
): string {
  const raw = data.kpis[key];
  if (typeof raw === "string") return raw;
  if (money) return formatMoney(raw, data.kpis.currency);
  return String(raw);
}

export function biExportRows(data: BiDashboardData): Record<string, unknown>[] {
  return [
    ...KPI_EXPORT.map(({ key, label, money }) => ({
      metric: label,
      value: formatKpiValue(key, data, money),
    })),
    {
      metric: "Repeat customer %",
      value: String(data.performance.repeatCustomerPct),
    },
    {
      metric: "First-time customer %",
      value: String(data.performance.firstTimeCustomerPct),
    },
    {
      metric: "Average spend",
      value: formatMoney(data.performance.averageSpend, data.kpis.currency),
    },
  ];
}

export function buildBiExportDataset(input: {
  bi: BiDashboardData;
  restaurantName: string;
  dateRangeLabel: string;
  multiRestaurantRows?: MultiRestaurantRow[];
}): ExportDataset {
  const kpiRows = biExportRows(input.bi);
  const columns = [
    { key: "metric", header: "Metric" },
    { key: "value", header: "Value" },
  ];

  const restaurantRows =
    input.multiRestaurantRows?.map((row) => ({
      restaurant: row.restaurantName,
      revenue: row.revenue,
      orders: row.orders,
      customers: row.customers,
      reservations: row.reservations,
    })) ?? [];

  const sheets =
    restaurantRows.length > 0
      ? [
          {
            name: "Summary",
            columns,
            rows: kpiRows,
          },
          {
            name: "By Restaurant",
            columns: [
              { key: "restaurant", header: "Restaurant / Location" },
              { key: "revenue", header: "Revenue", type: "currency" as const },
              { key: "orders", header: "Orders", type: "number" as const },
              { key: "customers", header: "Customers", type: "number" as const },
              {
                key: "reservations",
                header: "Reservations",
                type: "number" as const,
              },
            ],
            rows: restaurantRows,
          },
        ]
      : undefined;

  return {
    filenamePrefix: "bi_report",
    meta: {
      title: "Business Intelligence Report",
      restaurantName: input.restaurantName,
      dateRangeLabel: input.dateRangeLabel,
    },
    columns,
    rows: kpiRows,
    summary: [{ label: "Date range", value: input.dateRangeLabel }],
    sheets,
  };
}

import type { Customer } from "@/lib/customers/queries";
import { customerHasMarketingOptIn } from "@/lib/customers/whatsapp-chat";
import type { ExportDataset } from "../types";

const CUSTOMER_COLUMNS = [
  { key: "fullName", header: "Customer Name" },
  { key: "phone", header: "Phone" },
  { key: "email", header: "Email" },
  { key: "totalOrders", header: "Total Orders", type: "number" as const },
  { key: "totalSpent", header: "Total Spent", type: "currency" as const },
  { key: "averageOrder", header: "Average Spend", type: "currency" as const },
  { key: "firstVisit", header: "First Visit", type: "datetime" as const },
  { key: "lastVisit", header: "Last Visit", type: "datetime" as const },
  { key: "totalReservations", header: "Reservations", type: "number" as const },
  { key: "loyaltyPoints", header: "Loyalty Points", type: "number" as const },
  { key: "marketingOptIn", header: "Marketing Opt-in" },
  { key: "tags", header: "Tags" },
  { key: "restaurant", header: "Restaurant" },
  { key: "createdAt", header: "Created At", type: "datetime" as const },
  { key: "updatedAt", header: "Updated At", type: "datetime" as const },
];

export function buildCustomersExportDataset(input: {
  customers: Customer[];
  restaurantName: string;
  filterSummary: string[];
}): ExportDataset {
  const rows = input.customers.map((customer) => ({
    fullName: customer.fullName ?? "",
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    totalOrders: customer.totalOrders,
    totalSpent: customer.totalSpent,
    averageOrder: customer.averageOrder,
    firstVisit: customer.firstVisit ?? "",
    lastVisit: customer.lastVisit ?? "",
    totalReservations: customer.totalReservations,
    loyaltyPoints: customer.loyaltyPoints,
    marketingOptIn: customerHasMarketingOptIn(customer) ? "Yes" : "No",
    tags: customer.tags.join(", "),
    restaurant: input.restaurantName,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  }));

  return {
    filenamePrefix: "customers",
    meta: {
      title: "Customers Export",
      restaurantName: input.restaurantName,
      filterSummary: input.filterSummary,
    },
    columns: CUSTOMER_COLUMNS,
    rows,
    summary: [
      { label: "Customers", value: String(rows.length) },
      {
        label: "Marketing opt-in",
        value: String(rows.filter((row) => row.marketingOptIn === "Yes").length),
      },
    ],
  };
}

export function buildCustomersFilterSummary(input: {
  search: string;
  filter: string;
  birthdayMonth: number | "all";
}): string[] {
  const filters: string[] = [];
  if (input.search.trim()) filters.push(`Search: ${input.search.trim()}`);
  if (input.filter !== "all") filters.push(`Filter: ${input.filter}`);
  if (input.birthdayMonth !== "all") {
    filters.push(`Birthday month: ${input.birthdayMonth}`);
  }
  return filters;
}

export function buildLoyaltyMembersExportDataset(input: {
  customers: Customer[];
  restaurantName: string;
}): ExportDataset {
  const members = input.customers.filter(
    (customer) => customer.metadata.loyalty?.enrolled === true,
  );

  const rows = members.map((customer) => ({
    fullName: customer.fullName ?? "",
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    pointsBalance: customer.loyaltyPoints,
    totalEarned: Number(customer.metadata.loyalty?.lifetimePoints ?? customer.loyaltyPoints),
    totalRedeemed: Math.max(
      0,
      Number(customer.metadata.loyalty?.lifetimePoints ?? customer.loyaltyPoints) -
        customer.loyaltyPoints,
    ),
    enrollmentDate: customer.metadata.loyalty?.enrolledAt ?? "",
    restaurant: input.restaurantName,
  }));

  return {
    filenamePrefix: "loyalty_members",
    meta: {
      title: "Loyalty Members",
      restaurantName: input.restaurantName,
    },
    columns: [
      { key: "fullName", header: "Customer Name" },
      { key: "phone", header: "Phone" },
      { key: "email", header: "Email" },
      { key: "pointsBalance", header: "Points Balance", type: "number" },
      { key: "totalEarned", header: "Total Points Earned", type: "number" },
      { key: "totalRedeemed", header: "Total Points Redeemed", type: "number" },
      { key: "enrollmentDate", header: "Enrollment Date", type: "datetime" },
      { key: "restaurant", header: "Restaurant" },
    ],
    rows,
    summary: [{ label: "Members", value: String(rows.length) }],
  };
}

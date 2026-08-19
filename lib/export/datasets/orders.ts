import type { Order } from "@/lib/orders/types";
import {
  formatExportDate,
  formatExportDateTime,
  formatExportTime,
} from "../formatters";
import type { ExportDataset } from "../types";

function formatOrderItems(order: Order): string {
  return order.items
    .map((item) => {
      const base = `${item.itemName} x${item.quantity}`;
      return item.notes?.trim() ? `${base} (${item.notes.trim()})` : base;
    })
    .join("\n");
}

const ORDER_COLUMNS = [
  { key: "orderNumber", header: "Order Number" },
  { key: "date", header: "Date" },
  { key: "time", header: "Time" },
  { key: "orderType", header: "Order Type" },
  { key: "tableNumber", header: "Table Number" },
  { key: "customerName", header: "Customer Name" },
  { key: "customerPhone", header: "Customer Phone" },
  { key: "customerEmail", header: "Customer Email" },
  { key: "items", header: "Items" },
  { key: "subtotal", header: "Subtotal", type: "currency" as const },
  { key: "discount", header: "Discount", type: "currency" as const },
  { key: "grandTotal", header: "Grand Total", type: "currency" as const },
  { key: "paymentStatus", header: "Payment Status" },
  { key: "status", header: "Order Status" },
  { key: "notes", header: "Notes" },
  { key: "restaurant", header: "Restaurant" },
  { key: "createdAt", header: "Created At", type: "datetime" as const },
  { key: "completedAt", header: "Completed At", type: "datetime" as const },
];

export function buildOrdersExportDataset(input: {
  orders: Order[];
  restaurantName: string;
  filterSummary: string[];
  tabLabel?: string;
}): ExportDataset {
  const rows = input.orders.map((order) => ({
    orderNumber: order.orderNumber,
    date: formatExportDate(order.createdAt),
    time: formatExportTime(order.createdAt),
    orderType: order.orderType,
    tableNumber: order.tableNumber ?? "",
    customerName: order.customerName ?? "",
    customerPhone: order.customerPhone ?? "",
    customerEmail: order.customerEmail ?? "",
    items: formatOrderItems(order),
    subtotal: order.subtotal,
    discount: order.discountAmount,
    grandTotal: order.grandTotal,
    paymentStatus: order.paymentStatus,
    status: order.status,
    notes: order.specialInstructions ?? order.kitchenNotes ?? "",
    restaurant: input.restaurantName,
    createdAt: order.createdAt,
    completedAt: order.completedAt ?? "",
  }));

  const itemRows = input.orders.flatMap((order) =>
    order.items.map((item) => ({
      orderNumber: order.orderNumber,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      notes: item.notes ?? "",
      restaurant: input.restaurantName,
    })),
  );

  return {
    filenamePrefix: "orders",
    meta: {
      title: "Orders Export",
      restaurantName: input.restaurantName,
      filterSummary: input.filterSummary,
    },
    columns: ORDER_COLUMNS,
    rows,
    summary: [
      { label: "Orders", value: String(rows.length) },
      {
        label: "Grand total",
        value: rows
          .reduce((sum, row) => sum + Number(row.grandTotal ?? 0), 0)
          .toFixed(3),
      },
      { label: "Tab", value: input.tabLabel ?? "All" },
    ],
    sheets: itemRows.length
      ? [
          {
            name: "Orders",
            columns: ORDER_COLUMNS,
            rows,
          },
          {
            name: "Order Items",
            columns: [
              { key: "orderNumber", header: "Order Number" },
              { key: "itemName", header: "Item" },
              { key: "quantity", header: "Qty", type: "number" as const },
              { key: "unitPrice", header: "Unit Price", type: "currency" as const },
              { key: "lineTotal", header: "Line Total", type: "currency" as const },
              { key: "notes", header: "Notes" },
              { key: "restaurant", header: "Restaurant" },
            ],
            rows: itemRows,
          },
        ]
      : undefined,
  };
}

export function buildOrdersFilterSummary(input: {
  tabLabel: string;
  search: string;
  status: string;
  orderType: string;
}): string[] {
  const filters = [`Tab: ${input.tabLabel}`];
  if (input.search.trim()) filters.push(`Search: ${input.search.trim()}`);
  if (input.status !== "all") filters.push(`Status: ${input.status}`);
  if (input.orderType !== "all") filters.push(`Type: ${input.orderType}`);
  return filters;
}

export { formatExportDateTime };

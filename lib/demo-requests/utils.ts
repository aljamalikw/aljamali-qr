import type {
  DemoRequestFilterParams,
  DemoRequestItem,
  DemoRequestKpis,
  DemoRequestPriority,
  DemoRequestStatus,
} from "./types";

export const DEMO_REQUESTS_PAGE_SIZE = 25;

export function formatDemoDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDemoDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDemoCreatedAt(iso: string): string {
  return formatDemoDate(iso);
}

export function getPriorityBadgeClass(
  priority: DemoRequestPriority,
): string {
  switch (priority) {
    case "Low":
      return "border border-slate-500/30 bg-slate-500/10 text-slate-300";
    case "Medium":
      return "border border-gold/30 bg-gold/10 text-gold";
    case "High":
      return "border border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "Urgent":
      return "border border-red-500/30 bg-red-500/10 text-red-300";
    default:
      return "border border-white/10 bg-white/5 text-white/45";
  }
}

export function getDemoRequestStatusBadgeClass(
  status: DemoRequestStatus | "Archived",
): string {
  switch (status) {
    case "New":
      return "border border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "Contacted":
      return "border border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "Scheduled":
      return "border border-purple-500/30 bg-purple-500/10 text-purple-300";
    case "Completed":
      return "border border-green-500/30 bg-green-500/10 text-green-300";
    case "Customer":
      return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "Closed":
      return "border border-white/10 bg-white/5 text-white/45";
    case "Archived":
      return "border border-slate-500/30 bg-slate-500/10 text-slate-300";
    default:
      return "border border-white/10 bg-white/5 text-white/45";
  }
}

export function getDemoRequestStatusDotClass(
  status: DemoRequestStatus | "Archived",
): string {
  switch (status) {
    case "New":
      return "bg-blue-400";
    case "Contacted":
      return "bg-orange-400";
    case "Scheduled":
      return "bg-purple-400";
    case "Completed":
      return "bg-green-400";
    case "Customer":
      return "bg-emerald-400";
    case "Closed":
      return "bg-white/30";
    case "Archived":
      return "bg-slate-400";
    default:
      return "bg-white/30";
  }
}

export function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildTelHref(phone: string): string {
  return `tel:${phone.trim()}`;
}

export function buildWhatsAppHref(phone: string): string | null {
  const digits = normalizePhoneForWhatsApp(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function buildMailtoHref(email: string | null | undefined): string | null {
  const trimmed = email?.trim();
  if (!trimmed) return null;
  return `mailto:${trimmed}`;
}

export function computeDemoRequestKpis(items: DemoRequestItem[]): DemoRequestKpis {
  const notDeleted = items.filter((item) => !item.deletedAt);
  const active = notDeleted.filter((item) => !item.isArchived);
  const archived = notDeleted.filter((item) => item.isArchived);
  const convertedCustomers = active.filter(
    (item) => item.status === "Customer",
  ).length;
  const totalRequests = active.length;

  return {
    totalRequests,
    newRequests: active.filter((item) => item.status === "New").length,
    scheduled: active.filter((item) => item.status === "Scheduled").length,
    completed: active.filter((item) => item.status === "Completed").length,
    convertedCustomers,
    conversionRate:
      totalRequests === 0
        ? 0
        : Math.round((convertedCustomers / totalRequests) * 1000) / 10,
    archived: archived.length,
  };
}

function matchesDateRange(
  createdAt: string,
  dateFrom: string,
  dateTo: string,
): boolean {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return true;

  if (dateFrom) {
    const from = new Date(`${dateFrom}T00:00:00`);
    if (!Number.isNaN(from.getTime()) && created < from) return false;
  }

  if (dateTo) {
    const to = new Date(`${dateTo}T23:59:59.999`);
    if (!Number.isNaN(to.getTime()) && created > to) return false;
  }

  return true;
}

export function filterAndSortDemoRequests(
  items: DemoRequestItem[],
  params: DemoRequestFilterParams,
): DemoRequestItem[] {
  const query = params.search.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (params.showDeleted) {
      if (!item.deletedAt) return false;
    } else if (params.showArchived) {
      if (item.deletedAt || !item.isArchived) return false;
    } else if (item.deletedAt || item.isArchived) {
      return false;
    }

    if (params.status !== "all" && item.status !== params.status) return false;

    if (params.priority !== "all" && item.priority !== params.priority) {
      return false;
    }

    if (
      params.restaurantType !== "all" &&
      item.restaurantType !== params.restaurantType
    ) {
      return false;
    }

    if (!matchesDateRange(item.createdAt, params.dateFrom, params.dateTo)) {
      return false;
    }

    if (!query) return true;

    return (
      item.restaurantName.toLowerCase().includes(query) ||
      item.contactPerson.toLowerCase().includes(query) ||
      item.mobileNumber.toLowerCase().includes(query) ||
      (item.email?.toLowerCase().includes(query) ?? false) ||
      (item.city?.toLowerCase().includes(query) ?? false)
    );
  });

  return [...filtered].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return params.sort === "oldest" ? aTime - bTime : bTime - aTime;
  });
}

export function paginateDemoRequests<T>(
  items: T[],
  page: number,
  pageSize = DEMO_REQUESTS_PAGE_SIZE,
): { pageItems: T[]; totalPages: number; page: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    totalPages,
    page: safePage,
  };
}

export function exportDemoRequestsToCsv(items: DemoRequestItem[]): string {
  const headers = [
    "Restaurant",
    "Contact Person",
    "Mobile Number",
    "Restaurant Type",
    "Preferred Date",
    "Preferred Time",
    "Status",
    "Created",
  ];

  const escapeCell = (value: string) => {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = items.map((item) =>
    [
      item.restaurantName,
      item.contactPerson,
      item.mobileNumber,
      item.restaurantType ?? "",
      item.preferredDate,
      item.preferredTime,
      item.status,
      formatDemoCreatedAt(item.createdAt),
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

/** @deprecated Use filterAndSortDemoRequests */
export function filterDemoRequests(
  items: DemoRequestItem[],
  params: Pick<
    DemoRequestFilterParams,
    "search" | "status" | "restaurantType"
  >,
): DemoRequestItem[] {
  return filterAndSortDemoRequests(items, {
    search: params.search,
    status: params.status,
    priority: "all",
    restaurantType: params.restaurantType,
    dateFrom: "",
    dateTo: "",
    sort: "newest",
    showArchived: false,
    showDeleted: false,
  });
}

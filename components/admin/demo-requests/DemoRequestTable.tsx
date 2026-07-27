"use client";

import type { DemoRequestItem } from "@/lib/demo-requests/types";
import {
  formatDemoCreatedAt,
  formatDemoDate,
} from "@/lib/demo-requests/utils";
import { DemoRequestPriorityBadge } from "./DemoRequestPriorityBadge";
import { DemoRequestStatusBadge } from "./DemoRequestStatusBadge";

interface DemoRequestTableProps {
  items: DemoRequestItem[];
  showArchived: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onRowClick: (item: DemoRequestItem) => void;
  onArchive: (item: DemoRequestItem) => void;
  onRestore: (item: DemoRequestItem) => void;
  onDelete: (item: DemoRequestItem) => void;
}

export function DemoRequestTable({
  items,
  showArchived,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRowClick,
  onArchive,
  onRestore,
  onDelete,
}: DemoRequestTableProps) {
  const allSelected =
    items.length > 0 && items.every((item) => selectedIds.has(item.id));

  return (
    <div className="dashboard-card overflow-hidden rounded-2xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1220px] text-left">
          <thead>
            <tr className="border-b border-gold/10 bg-black/30">
              <th className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all rows"
                  className="h-4 w-4 accent-gold"
                />
              </th>
              {[
                "Restaurant",
                "Contact Person",
                "Mobile Number",
                "Restaurant Type",
                "Preferred Date",
                "Preferred Time",
                "Status",
                "Priority",
                "Created",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-white/40"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick(item)}
                className="table-row-hover cursor-pointer border-b border-white/5 last:border-0"
              >
                <td
                  className="px-4 py-4"
                  onClick={(event) => event.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => onToggleSelect(item.id)}
                    aria-label={`Select ${item.restaurantName}`}
                    className="h-4 w-4 accent-gold"
                  />
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm font-medium text-white">
                    {item.restaurantName}
                  </p>
                  {item.city ? (
                    <p className="mt-0.5 text-xs text-white/40">{item.city}</p>
                  ) : null}
                </td>
                <td className="px-4 py-4 text-sm text-white/75">
                  {item.contactPerson}
                </td>
                <td className="px-4 py-4 text-sm text-white/75">
                  {item.mobileNumber}
                </td>
                <td className="px-4 py-4 text-sm text-white/75">
                  {item.restaurantType || "—"}
                </td>
                <td className="px-4 py-4 text-sm text-white/75">
                  {formatDemoDate(item.preferredDate)}
                </td>
                <td className="px-4 py-4 text-sm text-white/75">
                  {item.preferredTime || "—"}
                </td>
                <td className="px-4 py-4">
                  <DemoRequestStatusBadge
                    status={item.status}
                    archived={item.isArchived && !item.deletedAt}
                  />
                </td>
                <td className="px-4 py-4">
                  <DemoRequestPriorityBadge priority={item.priority} />
                </td>
                <td className="px-4 py-4 text-sm text-white/50">
                  {formatDemoCreatedAt(item.createdAt)}
                </td>
                <td className="px-4 py-4">
                  <div
                    className="flex flex-wrap items-center gap-2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {showArchived || item.isArchived ? (
                      <button
                        type="button"
                        className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                        onClick={() => onRestore(item)}
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                        onClick={() => onArchive(item)}
                      >
                        Archive
                      </button>
                    )}
                    {!item.deletedAt ? (
                      <button
                        type="button"
                        className="menu-btn-danger !px-2.5 !py-1.5 text-xs"
                        onClick={() => onDelete(item)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import type { QrCodeItem } from "@/lib/dashboard/qr/types";
import { getQrTypeLabel } from "@/lib/dashboard/qr/seed-data";
import {
  formatLastScan,
  formatQrDate,
} from "@/lib/dashboard/qr/utils";
import { QrPreview } from "./QrPreview";
import { QrActionsMenu, type QrAction } from "./QrActionsMenu";

interface QrTableProps {
  items: QrCodeItem[];
  onAction: (action: QrAction, item: QrCodeItem) => void;
}

function StatusBadge({ status }: { status: QrCodeItem["status"] }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border border-white/10 bg-white/5 text-white/45"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-white/30"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function QrTable({ items, onAction }: QrTableProps) {
  if (items.length === 0) {
    return (
      <div className="dashboard-card rounded-2xl p-10 text-center">
        <p className="text-white/45">No QR codes match your filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-card hidden overflow-hidden rounded-2xl lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="border-b border-gold/10 bg-black/30">
                {[
                  "QR Preview",
                  "Name",
                  "Type",
                  "Status",
                  "Total Scans",
                  "Today's Scans",
                  "Last Scan",
                  "Created",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-white/40"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="table-row-hover group border-b border-white/5 last:border-0"
                >
                  <td className="px-4 py-3">
                    <QrPreview value={item.url} size={40} className="h-11 w-11 border border-gold/10" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white group-hover:text-gold-light">{item.name}</p>
                    {item.tableNumber && (
                      <p className="text-xs text-white/40">Table {item.tableNumber}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">{getQrTypeLabel(item.type)}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 font-serif text-gold">{item.totalScans.toLocaleString()}</td>
                  <td className="px-4 py-3 text-white/70">{item.todayScans}</td>
                  <td className="px-4 py-3 text-sm text-white/50">{formatLastScan(item.lastScan)}</td>
                  <td className="px-4 py-3 text-sm text-white/50">{formatQrDate(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <QrActionsMenu item={item} onAction={onAction} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {items.map((item) => (
          <div
            key={item.id}
            className="dashboard-card rounded-2xl p-4 transition-all hover:border-gold/25"
          >
            <div className="flex gap-4">
              <QrPreview value={item.url} size={56} className="h-16 w-16 shrink-0 border border-gold/10" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-xs text-white/45">{getQrTypeLabel(item.type)}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-black/30 px-2 py-1.5">
                    <p className="text-[10px] uppercase text-white/35">Total</p>
                    <p className="text-sm font-serif text-gold">{item.totalScans}</p>
                  </div>
                  <div className="rounded-lg bg-black/30 px-2 py-1.5">
                    <p className="text-[10px] uppercase text-white/35">Today</p>
                    <p className="text-sm text-white/70">{item.todayScans}</p>
                  </div>
                  <div className="rounded-lg bg-black/30 px-2 py-1.5">
                    <p className="text-[10px] uppercase text-white/35">Last</p>
                    <p className="text-xs text-white/50">{formatLastScan(item.lastScan)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end border-t border-white/5 pt-3">
              <QrActionsMenu item={item} onAction={onAction} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

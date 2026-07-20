"use client";

import { qrTypes } from "@/lib/dashboard/qr/seed-data";
import type { QrSortOption, QrStatusFilter, QrTypeFilter } from "@/lib/dashboard/qr/types";
import { DashboardPrimaryButton } from "@/components/dashboard/ui/DashboardPrimaryButton";
import { QrIcon } from "./icons/QrIcons";

interface QrToolbarProps {
  search: string;
  status: QrStatusFilter;
  type: QrTypeFilter;
  sort: QrSortOption;
  filteredCount: number;
  totalCount: number;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: QrStatusFilter) => void;
  onTypeChange: (v: QrTypeFilter) => void;
  onSortChange: (v: QrSortOption) => void;
  onCreate: () => void;
}

const selectClass =
  "rounded-xl border border-gold/15 bg-surface px-3 py-2.5 text-sm text-white transition-colors focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

export function QrToolbar({
  search,
  status,
  type,
  sort,
  filteredCount,
  totalCount,
  onSearchChange,
  onStatusChange,
  onTypeChange,
  onSortChange,
  onCreate,
}: QrToolbarProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
            QR Code Management
          </h1>
          <p className="mt-1 text-sm text-white/45">
            {filteredCount} of {totalCount} QR codes
          </p>
        </div>
        <DashboardPrimaryButton
          variant="cta"
          onClick={onCreate}
          className="shrink-0"
          icon={<QrIcon name="plus" className="h-[18px] w-[18px] stroke-[2.5]" />}
        >
          Create QR Code
        </DashboardPrimaryButton>
      </div>

      <div className="dashboard-card rounded-2xl p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <QrIcon
              name="search"
              className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search QR codes..."
              className="w-full rounded-xl border border-gold/15 bg-black/30 py-2.5 pe-4 ps-10 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:contents">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as QrStatusFilter)}
              className={selectClass}
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={type}
              onChange={(e) => onTypeChange(e.target.value as QrTypeFilter)}
              className={selectClass}
              aria-label="Filter by type"
            >
              <option value="all">All Types</option>
              {qrTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as QrSortOption)}
              className={selectClass}
              aria-label="Sort QR codes"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="scans">Most Scans</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

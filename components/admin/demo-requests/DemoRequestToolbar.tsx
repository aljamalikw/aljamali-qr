"use client";

import {
  DEMO_REQUEST_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  RESTAURANT_TYPE_OPTIONS,
} from "@/lib/demo-requests/constants";
import type {
  DemoRequestPriorityFilter,
  DemoRequestSortOption,
  DemoRequestStatusFilter,
  DemoRequestTypeFilter,
} from "@/lib/demo-requests/types";

interface DemoRequestToolbarProps {
  search: string;
  status: DemoRequestStatusFilter;
  priority: DemoRequestPriorityFilter;
  restaurantType: DemoRequestTypeFilter;
  dateFrom: string;
  dateTo: string;
  sort: DemoRequestSortOption;
  showArchived: boolean;
  showDeleted: boolean;
  filteredCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: DemoRequestStatusFilter) => void;
  onPriorityChange: (value: DemoRequestPriorityFilter) => void;
  onRestaurantTypeChange: (value: DemoRequestTypeFilter) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onSortChange: (value: DemoRequestSortOption) => void;
  onShowArchivedChange: (value: boolean) => void;
  onShowDeletedChange: (value: boolean) => void;
  onExport: () => void;
}

const selectClass =
  "rounded-xl border border-gold/15 bg-surface px-3 py-2.5 text-sm text-white transition-colors focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

const toggleClass =
  "inline-flex items-center gap-2 rounded-xl border border-gold/15 bg-black/30 px-3 py-2.5 text-sm text-white/70 transition-colors hover:border-gold/30 hover:text-white";

export function DemoRequestToolbar({
  search,
  status,
  priority,
  restaurantType,
  dateFrom,
  dateTo,
  sort,
  showArchived,
  showDeleted,
  filteredCount,
  totalCount,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onRestaurantTypeChange,
  onDateFromChange,
  onDateToChange,
  onSortChange,
  onShowArchivedChange,
  onShowDeletedChange,
  onExport,
}: DemoRequestToolbarProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
            Demo Requests
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Manage restaurant demo bookings, follow-ups and conversions.
          </p>
          <p className="mt-2 text-xs text-white/35">
            Showing {filteredCount} of {totalCount} loaded records
          </p>
        </div>

        <button
          type="button"
          onClick={onExport}
          className="menu-btn-secondary shrink-0"
        >
          Export CSV
        </button>
      </div>

      <div className="dashboard-card rounded-2xl p-4 sm:p-5">
        <div className="grid gap-3">
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search restaurant, contact, mobile, email, or city..."
              className="w-full rounded-xl border border-gold/15 bg-black/30 py-2.5 pe-4 ps-10 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <select
              value={status}
              onChange={(event) =>
                onStatusChange(event.target.value as DemoRequestStatusFilter)
              }
              className={selectClass}
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              {DEMO_REQUEST_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(event) =>
                onPriorityChange(event.target.value as DemoRequestPriorityFilter)
              }
              className={selectClass}
              aria-label="Filter by priority"
            >
              <option value="all">All Priorities</option>
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={restaurantType}
              onChange={(event) =>
                onRestaurantTypeChange(
                  event.target.value as DemoRequestTypeFilter,
                )
              }
              className={selectClass}
              aria-label="Filter by restaurant type"
            >
              <option value="all">All Restaurant Types</option>
              {RESTAURANT_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(event) => onDateFromChange(event.target.value)}
              className={selectClass}
              aria-label="Created from date"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(event) => onDateToChange(event.target.value)}
              className={selectClass}
              aria-label="Created to date"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <select
              value={sort}
              onChange={(event) =>
                onSortChange(event.target.value as DemoRequestSortOption)
              }
              className={selectClass}
              aria-label="Sort order"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>

            <button
              type="button"
              className={`${toggleClass} ${
                showArchived ? "border-gold/40 bg-gold/10 text-gold" : ""
              }`}
              onClick={() => {
                onShowArchivedChange(!showArchived);
                if (!showArchived) onShowDeletedChange(false);
              }}
              aria-pressed={showArchived}
            >
              Archived
            </button>

            <button
              type="button"
              className={`${toggleClass} ${
                showDeleted ? "border-gold/40 bg-gold/10 text-gold" : ""
              }`}
              onClick={() => {
                onShowDeletedChange(!showDeleted);
                if (!showDeleted) onShowArchivedChange(false);
              }}
              aria-pressed={showDeleted}
            >
              Show Deleted
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

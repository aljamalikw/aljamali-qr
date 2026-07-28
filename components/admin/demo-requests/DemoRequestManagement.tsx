"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  archiveDemoRequest,
  restoreDemoRequest,
} from "@/lib/demo-requests/archiveDemoRequest";
import { fetchDemoRequests } from "@/lib/demo-requests/fetchDemoRequests";
import { softDeleteDemoRequest } from "@/lib/demo-requests/softDeleteDemoRequest";
import type {
  DemoRequestEditableFields,
  DemoRequestItem,
  DemoRequestPriorityFilter,
  DemoRequestSortOption,
  DemoRequestStatusFilter,
  DemoRequestTypeFilter,
} from "@/lib/demo-requests/types";
import { updateDemoRequest } from "@/lib/demo-requests/updateDemoRequest";
import {
  DEMO_REQUESTS_PAGE_SIZE,
  computeDemoRequestKpis,
  downloadCsv,
  exportDemoRequestsToCsv,
  filterAndSortDemoRequests,
  paginateDemoRequests,
} from "@/lib/demo-requests/utils";
import { DemoRequestDetailsDrawer } from "./DemoRequestDetailsDrawer";
import { DemoRequestEmptyState } from "./DemoRequestEmptyState";
import { DemoRequestErrorState } from "./DemoRequestErrorState";
import { DemoRequestKpiCards } from "./DemoRequestKpiCards";
import { DemoRequestPagination } from "./DemoRequestPagination";
import { DemoRequestTable } from "./DemoRequestTable";
import { DemoRequestToolbar } from "./DemoRequestToolbar";

type ConfirmAction =
  | { type: "archive"; item: DemoRequestItem }
  | { type: "delete"; item: DemoRequestItem }
  | null;

export function DemoRequestManagement() {
  const { showToast } = useToast();
  const [items, setItems] = useState<DemoRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DemoRequestStatusFilter>("all");
  const [priority, setPriority] = useState<DemoRequestPriorityFilter>("all");
  const [restaurantType, setRestaurantType] =
    useState<DemoRequestTypeFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<DemoRequestSortOption>("newest");
  const [showArchived, setShowArchived] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DemoRequestItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [bulkAction, setBulkAction] = useState<"archive" | "delete" | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchDemoRequests();
    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      setItems([]);
      return;
    }

    setItems(result.data);
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    status,
    priority,
    restaurantType,
    dateFrom,
    dateTo,
    sort,
    showArchived,
    showDeleted,
  ]);

  const kpis = useMemo(() => computeDemoRequestKpis(items), [items]);

  const filtered = useMemo(
    () =>
      filterAndSortDemoRequests(items, {
        search,
        status,
        priority,
        restaurantType,
        dateFrom,
        dateTo,
        sort,
        showArchived,
        showDeleted,
      }),
    [
      items,
      search,
      status,
      priority,
      restaurantType,
      dateFrom,
      dateTo,
      sort,
      showArchived,
      showDeleted,
    ],
  );

  const { pageItems, totalPages, page: safePage } = useMemo(
    () => paginateDemoRequests(filtered, page, DEMO_REQUESTS_PAGE_SIZE),
    [filtered, page],
  );

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  const hasFilters =
    search.trim().length > 0 ||
    status !== "all" ||
    priority !== "all" ||
    restaurantType !== "all" ||
    dateFrom.length > 0 ||
    dateTo.length > 0 ||
    showArchived ||
    showDeleted;

  const replaceItem = useCallback((updated: DemoRequestItem) => {
    setItems((previous) =>
      previous.map((item) => (item.id === updated.id ? updated : item)),
    );
    setSelected((current) =>
      current?.id === updated.id ? updated : current,
    );
  }, []);

  const handleSave = useCallback(
    async (id: string, fields: DemoRequestEditableFields) => {
      setSaving(true);
      const result = await updateDemoRequest(id, fields);
      setSaving(false);

      if (!result.ok) {
        showToast(result.message, "error");
        return false;
      }

      replaceItem(result.data);
      showToast("Demo request updated successfully");
      return true;
    },
    [replaceItem, showToast],
  );

  const handleRestore = useCallback(
    async (item: DemoRequestItem) => {
      const result = await restoreDemoRequest(item.id);
      if (!result.ok) {
        showToast(result.message, "error");
        return;
      }
      replaceItem(result.data);
      showToast("Demo request restored");
    },
    [replaceItem, showToast],
  );

  const handleConfirm = useCallback(async () => {
    if (!confirmAction) return;
    setActionLoading(true);

    const result =
      confirmAction.type === "archive"
        ? await archiveDemoRequest(confirmAction.item.id)
        : await softDeleteDemoRequest(confirmAction.item.id);

    setActionLoading(false);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    replaceItem(result.data);
    setSelected(null);
    setConfirmAction(null);
    showToast(
      confirmAction.type === "archive"
        ? "Demo request archived"
        : "Demo request deleted",
    );
  }, [confirmAction, replaceItem, showToast]);

  const handleExport = useCallback(() => {
    if (filtered.length === 0) {
      showToast("No rows available to export", "error");
      return;
    }
    const csv = exportDemoRequestsToCsv(filtered);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`demo-requests-${stamp}.csv`, csv);
    showToast(`Exported ${filtered.length} requests`);
  }, [filtered, showToast]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((previous) => {
      const pageIds = pageItems.map((item) => item.id);
      const allSelected = pageIds.every((id) => previous.has(id));
      if (allSelected) {
        const next = new Set(previous);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...previous, ...pageIds]);
    });
  }, [pageItems]);

  const handleBulkConfirm = useCallback(async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    setActionLoading(true);
    const ids = [...selectedIds];
    for (const id of ids) {
      if (bulkAction === "archive") await archiveDemoRequest(id);
      else await softDeleteDemoRequest(id);
    }
    setActionLoading(false);
    setBulkAction(null);
    setSelectedIds(new Set());
    setSelected(null);
    await loadRequests();
    showToast(
      bulkAction === "archive"
        ? `Archived ${ids.length} requests`
        : `Deleted ${ids.length} requests`,
    );
  }, [bulkAction, loadRequests, selectedIds, showToast]);

  return (
    <div className="space-y-6">
      <DemoRequestToolbar
        search={search}
        status={status}
        priority={priority}
        restaurantType={restaurantType}
        dateFrom={dateFrom}
        dateTo={dateTo}
        sort={sort}
        showArchived={showArchived}
        showDeleted={showDeleted}
        filteredCount={filtered.length}
        totalCount={items.length}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
        onRestaurantTypeChange={setRestaurantType}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onSortChange={setSort}
        onShowArchivedChange={setShowArchived}
        onShowDeletedChange={setShowDeleted}
        onExport={handleExport}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          {Array.from({ length: 7 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <DemoRequestKpiCards kpis={kpis} />
      )}

      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <DemoRequestErrorState message={error} onRetry={loadRequests} />
      ) : filtered.length === 0 ? (
        <DemoRequestEmptyState hasFilters={hasFilters} />
      ) : (
        <>
          {selectedIds.size > 0 ? (
            <div className="dashboard-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
              <p className="text-sm text-white/70">
                {selectedIds.size} selected
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="menu-btn-secondary"
                  onClick={() => setBulkAction("archive")}
                >
                  Bulk Archive
                </button>
                <button
                  type="button"
                  className="menu-btn-danger"
                  onClick={() => setBulkAction("delete")}
                >
                  Bulk Delete
                </button>
                <button
                  type="button"
                  className="menu-btn-secondary"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </button>
              </div>
            </div>
          ) : null}
          <DemoRequestTable
            items={pageItems}
            showArchived={showArchived}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onRowClick={setSelected}
            onArchive={(item) => setConfirmAction({ type: "archive", item })}
            onRestore={handleRestore}
            onDelete={(item) => setConfirmAction({ type: "delete", item })}
          />
          <DemoRequestPagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={DEMO_REQUESTS_PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <DemoRequestDetailsDrawer
        item={selected}
        saving={saving}
        onClose={() => setSelected(null)}
        onSave={handleSave}
        onArchive={(item) => setConfirmAction({ type: "archive", item })}
        onRestore={handleRestore}
        onDelete={(item) => setConfirmAction({ type: "delete", item })}
      />

      <ConfirmModal
        open={confirmAction?.type === "archive"}
        title="Archive Demo Request?"
        description="This request will be removed from the active list but can be restored at any time."
        confirmLabel="Archive"
        cancelLabel="Cancel"
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        open={confirmAction?.type === "delete"}
        title="Delete Demo Request?"
        description="This action will remove the request from all normal views. It can still be recovered later."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal
        open={bulkAction === "archive"}
        title="Archive Selected Requests?"
        description={`${selectedIds.size} request(s) will be archived and can be restored later.`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        loading={actionLoading}
        onConfirm={handleBulkConfirm}
        onCancel={() => setBulkAction(null)}
      />

      <ConfirmModal
        open={bulkAction === "delete"}
        title="Delete Selected Requests?"
        description={`${selectedIds.size} request(s) will be soft-deleted from normal views.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleBulkConfirm}
        onCancel={() => setBulkAction(null)}
      />
    </div>
  );
}

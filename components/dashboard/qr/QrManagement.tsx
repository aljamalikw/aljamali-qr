"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type {
  BulkQrGenerateFormData,
  QrCodeItem,
  QrCreateFormData,
  QrOverviewStats,
  QrSortOption,
  QrStatusFilter,
  QrTypeFilter,
} from "@/lib/dashboard/qr/types";
import { filterAndSortQrCodes } from "@/lib/dashboard/qr/utils";
import { fetchQrOverviewStats } from "@/lib/qr-analytics/queries";
import { downloadQrCodePng, downloadQrCodeSvg, printQrCode, printQrCodesBulk } from "@/lib/dashboard/qr/qr-image";
import { setQrCodeArchived } from "@/lib/qr-codes/archiveQrCode";
import { bulkCreateQrCodes } from "@/lib/qr-codes/bulkCreateQrCodes";
import { createQrCode } from "@/lib/qr-codes/createQrCode";
import { duplicateQrCode } from "@/lib/qr-codes/duplicateQrCode";
import { fetchQrCodes } from "@/lib/qr-codes/fetchQrCodes";
import { softDeleteQrCode } from "@/lib/qr-codes/softDeleteQrCode";
import { renameQrCode, updateQrCodeStatus } from "@/lib/qr-codes/updateQrCode";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { useToast } from "@/components/ui/ToastProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { QrStatsOverview } from "./QrStatsOverview";
import { QrToolbar } from "./QrToolbar";
import { QrTable } from "./QrTable";
import { CreateQrWizard } from "./CreateQrWizard";
import { BulkGenerateQrModal } from "./BulkGenerateQrModal";
import { QrDetailsDrawer } from "./QrDetailsDrawer";
import { DeleteQrModal } from "./DeleteQrModal";
import { RenameQrModal } from "./RenameQrModal";
import { QrEmptyState } from "./QrEmptyState";
import type { QrAction } from "./QrActionsMenu";

function replaceItem(items: QrCodeItem[], nextItem: QrCodeItem): QrCodeItem[] {
  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

export function QrManagement() {
  const { showToast } = useToast();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const restaurantSlug = restaurant?.slug ?? null;

  const [items, setItems] = useState<QrCodeItem[]>([]);
  const [stats, setStats] = useState<QrOverviewStats>({
    total: 0,
    active: 0,
    totalScans: 0,
    todayScans: 0,
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QrStatusFilter>("all");
  const [type, setType] = useState<QrTypeFilter>("all");
  const [sort, setSort] = useState<QrSortOption>("newest");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [createOpen, setCreateOpen] = useState(false);
  const [bulkGenerateOpen, setBulkGenerateOpen] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [viewItem, setViewItem] = useState<QrCodeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QrCodeItem | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<QrCodeItem | null>(null);

  const loadOverviewStats = useCallback(async () => {
    if (!restaurant?.id) {
      setStats({ total: 0, active: 0, totalScans: 0, todayScans: 0 });
      return;
    }

    const result = await fetchQrOverviewStats(restaurant.id, restaurant.timezone);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    setStats({
      total: result.data.total,
      active: result.data.active,
      totalScans: result.data.totalScans,
      todayScans: result.data.todayScans,
    });
  }, [restaurant, showToast]);

  const loadQrCodes = useCallback(async (options?: { showLoading?: boolean }) => {
    if (options?.showLoading !== false) {
      setLoading(true);
    }

    const result = await fetchQrCodes();

    if (options?.showLoading !== false) {
      setLoading(false);
    }

    if (!result.ok) {
      showToast(result.message, "error");
      setItems([]);
      return false;
    }

    setItems(result.data);
    return true;
  }, [showToast]);

  useEffect(() => {
    if (restaurantLoading) return;
    loadQrCodes();
    loadOverviewStats();
  }, [loadQrCodes, loadOverviewStats, restaurantLoading]);

  const filtered = useMemo(
    () => filterAndSortQrCodes(items, { search, status, type, sort, showArchived }),
    [items, search, status, type, sort, showArchived],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const allSelected = filtered.every((item) => prev.has(item.id));
      if (allSelected) return new Set();
      return new Set(filtered.map((item) => item.id));
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleCreate = useCallback(
    async (data: QrCreateFormData) => {
      const result = await createQrCode(data);

      if (!result.ok) {
        showToast(result.message, "error");
        return false;
      }

      await loadQrCodes({ showLoading: false });
      await loadOverviewStats();

      showToast(`QR code "${data.name}" created successfully`);

      return true;
    },
    [loadOverviewStats, loadQrCodes, showToast],
  );

  const handleBulkGenerate = async (form: BulkQrGenerateFormData) => {
    setBulkGenerating(true);
    const result = await bulkCreateQrCodes(form);
    setBulkGenerating(false);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    setBulkGenerateOpen(false);
    await loadQrCodes({ showLoading: false });
    await loadOverviewStats();

    showToast(
      result.failed.length > 0
        ? `Generated ${result.created.length} QR codes, ${result.failed.length} failed`
        : `Generated ${result.created.length} QR codes`,
      result.failed.length > 0 ? "error" : "success",
    );
  };

  const handleToggleArchive = useCallback(
    async (item: QrCodeItem) => {
      const result = await setQrCodeArchived(item.id, !item.isArchived);
      if (!result.ok) {
        showToast(result.message, "error");
        return;
      }
      setItems((prev) => replaceItem(prev, result.data));
      if (viewItem?.id === item.id) setViewItem(result.data);
      showToast(item.isArchived ? `Restored "${item.name}"` : `Archived "${item.name}"`);
    },
    [showToast, viewItem],
  );

  const handleAction = useCallback(
    async (action: QrAction, item: QrCodeItem) => {
      switch (action) {
        case "view":
          setViewItem(item);
          break;
        case "rename":
          setRenameTarget(item);
          break;
        case "duplicate": {
          const result = await duplicateQrCode(item.id);
          if (!result.ok) {
            showToast(result.message, "error");
            return;
          }
          setItems((prev) => [result.data, ...prev]);
          await loadOverviewStats();
          showToast(`Duplicated "${item.name}"`);
          break;
        }
        case "download-png":
          await downloadQrCodePng(item.url, item.name);
          showToast("PNG downloaded");
          break;
        case "download-pdf":
          downloadQrCodeSvg(item.url, item.name);
          showToast("SVG downloaded");
          break;
        case "print":
          printQrCode(item.name, item.url, item.tableNumber ? `Table ${item.tableNumber}` : undefined);
          showToast("Opening print dialog...");
          break;
        case "copy-link":
          navigator.clipboard.writeText(item.url).then(() => {
            showToast("URL copied to clipboard");
          });
          break;
        case "toggle-status": {
          const next = item.status === "active" ? "inactive" : "active";
          const result = await updateQrCodeStatus(item.id, next);
          if (!result.ok) {
            showToast(result.message, "error");
            return;
          }
          setItems((prev) => replaceItem(prev, result.data));
          if (viewItem?.id === item.id) {
            setViewItem(result.data);
          }
          await loadOverviewStats();
          showToast(`QR code ${next === "active" ? "enabled" : "disabled"}`);
          break;
        }
        case "toggle-archive":
          await handleToggleArchive(item);
          break;
        case "delete":
          setDeleteTarget(item);
          break;
      }
    },
    [handleToggleArchive, loadOverviewStats, showToast, viewItem],
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const result = await softDeleteQrCode(deleteTarget.id);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    await loadOverviewStats();

    if (viewItem?.id === deleteTarget.id) setViewItem(null);

    showToast(`Deleted "${deleteTarget.name}"`);
    setDeleteTarget(null);
  };

  const confirmRename = async (name: string) => {
    if (!renameTarget) return;

    const result = await renameQrCode(renameTarget.id, name);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    setItems((prev) => replaceItem(prev, result.data));
    if (viewItem?.id === renameTarget.id) {
      setViewItem(result.data);
    }
    showToast(`Renamed to "${name}"`);
    setRenameTarget(null);
  };

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds],
  );

  const handleBulkDownload = async (format: "png" | "svg") => {
    for (const item of selectedItems) {
      if (format === "png") {
        // eslint-disable-next-line no-await-in-loop
        await downloadQrCodePng(item.url, item.name);
      } else {
        downloadQrCodeSvg(item.url, item.name);
      }
    }
    showToast(`Downloaded ${selectedItems.length} QR codes`);
  };

  const handleBulkPrint = () => {
    printQrCodesBulk(
      "QR Codes",
      selectedItems.map((item) => ({
        name: item.name,
        url: item.url,
        subtitle: item.tableNumber ? `Table ${item.tableNumber}` : item.area || undefined,
      })),
    );
    showToast("Opening print dialog...");
  };

  const handleBulkArchive = async (archived: boolean) => {
    let failures = 0;
    for (const item of selectedItems) {
      // eslint-disable-next-line no-await-in-loop
      const result = await setQrCodeArchived(item.id, archived);
      if (!result.ok) failures += 1;
    }
    clearSelection();
    await loadQrCodes({ showLoading: false });
    await loadOverviewStats();
    showToast(
      failures
        ? `Updated ${selectedItems.length - failures} of ${selectedItems.length} items`
        : archived
          ? `Archived ${selectedItems.length} QR codes`
          : `Restored ${selectedItems.length} QR codes`,
      failures ? "error" : "success",
    );
  };

  const confirmBulkDelete = async () => {
    let failures = 0;
    for (const item of selectedItems) {
      // eslint-disable-next-line no-await-in-loop
      const result = await softDeleteQrCode(item.id);
      if (!result.ok) failures += 1;
    }
    setBulkDeleteOpen(false);
    clearSelection();
    await loadQrCodes({ showLoading: false });
    await loadOverviewStats();
    showToast(
      failures
        ? `Deleted ${selectedItems.length - failures} of ${selectedItems.length} items`
        : `Deleted ${selectedItems.length} QR codes`,
      failures ? "error" : "success",
    );
  };

  const showEmpty = !loading && items.length === 0;
  const showFilteredEmpty = !loading && items.length > 0 && filtered.length === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <QrStatsOverview stats={stats} />

      {!showEmpty && (
        <QrToolbar
          search={search}
          status={status}
          type={type}
          sort={sort}
          filteredCount={filtered.length}
          totalCount={items.length}
          showArchived={showArchived}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onTypeChange={setType}
          onSortChange={setSort}
          onShowArchivedChange={setShowArchived}
          onCreate={() => setCreateOpen(true)}
          onBulkGenerate={() => setBulkGenerateOpen(true)}
        />
      )}

      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-card flex flex-wrap items-center gap-3 rounded-2xl border-gold/25 p-4"
        >
          <p className="text-sm text-white/70">
            <span className="font-semibold text-gold">{selectedIds.size}</span> selected
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => handleBulkDownload("png")} className="menu-btn-secondary text-xs">
              Download PNG
            </button>
            <button type="button" onClick={() => handleBulkDownload("svg")} className="menu-btn-secondary text-xs">
              Download SVG
            </button>
            <button type="button" onClick={handleBulkPrint} className="menu-btn-secondary text-xs">
              Print
            </button>
            <button type="button" onClick={() => handleBulkArchive(true)} className="menu-btn-secondary text-xs">
              Archive
            </button>
            <button type="button" onClick={() => handleBulkArchive(false)} className="menu-btn-secondary text-xs">
              Restore
            </button>
            <button type="button" onClick={() => setBulkDeleteOpen(true)} className="menu-btn-danger text-xs">
              Delete
            </button>
            <button type="button" onClick={clearSelection} className="menu-btn-secondary text-xs">
              Clear
            </button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="dashboard-card overflow-hidden rounded-2xl">
          <TableSkeleton rows={5} />
        </div>
      ) : showEmpty ? (
        <QrEmptyState onCreate={() => setCreateOpen(true)} />
      ) : showFilteredEmpty ? (
        <div className="dashboard-card rounded-2xl p-10 text-center transition-all hover:border-gold/15">
          <p className="text-white/45">No QR codes match your filters.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <QrTable
            items={filtered}
            onAction={handleAction}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
          />
        </motion.div>
      )}

      <CreateQrWizard
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onComplete={handleCreate}
        restaurantSlug={restaurantSlug}
      />

      <BulkGenerateQrModal
        open={bulkGenerateOpen}
        saving={bulkGenerating}
        onClose={() => setBulkGenerateOpen(false)}
        onGenerate={handleBulkGenerate}
      />

      <QrDetailsDrawer
        item={viewItem}
        onClose={() => setViewItem(null)}
        onDownloadPng={(item) => handleAction("download-png", item)}
        onDownloadSvg={(item) => handleAction("download-pdf", item)}
        onPrint={(item) => handleAction("print", item)}
        onCopyLink={(item) => handleAction("copy-link", item)}
        onToggleArchive={(item) => handleAction("toggle-archive", item)}
      />

      <DeleteQrModal
        open={deleteTarget !== null}
        name={deleteTarget?.name ?? ""}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <RenameQrModal
        open={renameTarget !== null}
        currentName={renameTarget?.name ?? ""}
        onConfirm={confirmRename}
        onCancel={() => setRenameTarget(null)}
      />

      <ConfirmModal
        open={bulkDeleteOpen}
        title="Delete selected QR codes?"
        description={<>Are you sure you want to delete <span className="font-medium text-white">{selectedIds.size}</span> QR codes?</>}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}

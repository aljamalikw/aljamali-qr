"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { initialQrCodes } from "@/lib/dashboard/qr/seed-data";
import type {
  QrCodeItem,
  QrCreateFormData,
  QrSortOption,
  QrStatusFilter,
  QrTypeFilter,
} from "@/lib/dashboard/qr/types";
import {
  buildQrUrl,
  computeOverviewStats,
  duplicateQrItem,
  filterAndSortQrCodes,
  formToQrItem,
} from "@/lib/dashboard/qr/utils";
import { downloadQrSvg, printQrPage } from "@/lib/dashboard/qr/download-utils";
import { useToast } from "@/components/ui/ToastProvider";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { QrStatsOverview } from "./QrStatsOverview";
import { QrToolbar } from "./QrToolbar";
import { QrTable } from "./QrTable";
import { CreateQrWizard } from "./CreateQrWizard";
import { QrDetailsDrawer } from "./QrDetailsDrawer";
import { DeleteQrModal } from "./DeleteQrModal";
import { RenameQrModal } from "./RenameQrModal";
import { QrEmptyState } from "./QrEmptyState";
import type { QrAction } from "./QrActionsMenu";

export function QrManagement() {
  const { showToast } = useToast();
  const [items, setItems] = useState<QrCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QrStatusFilter>("all");
  const [type, setType] = useState<QrTypeFilter>("all");
  const [sort, setSort] = useState<QrSortOption>("newest");

  const [createOpen, setCreateOpen] = useState(false);
  const [viewItem, setViewItem] = useState<QrCodeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QrCodeItem | null>(null);
  const [renameTarget, setRenameTarget] = useState<QrCodeItem | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setItems(initialQrCodes);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(
    () => filterAndSortQrCodes(items, { search, status, type, sort }),
    [items, search, status, type, sort],
  );

  const stats = useMemo(() => computeOverviewStats(items), [items]);

  const handleCreate = useCallback(
    (data: QrCreateFormData) => {
      const newItem = formToQrItem(data);
      setItems((prev) => [newItem, ...prev]);
    },
    [],
  );

  const handleAction = useCallback(
    (action: QrAction, item: QrCodeItem) => {
      switch (action) {
        case "view":
          setViewItem(item);
          break;
        case "rename":
          setRenameTarget(item);
          break;
        case "duplicate":
          setItems((prev) => [duplicateQrItem(item), ...prev]);
          showToast(`Duplicated "${item.name}"`);
          break;
        case "download-png":
          showToast(`Downloading PNG for "${item.name}"...`);
          break;
        case "download-pdf":
          downloadQrSvg(item.url, item.name);
          showToast("SVG downloaded");
          break;
        case "print":
          printQrPage(item.name, item.url);
          showToast("Opening print dialog...");
          break;
        case "copy-link":
          navigator.clipboard.writeText(item.url).then(() => {
            showToast("URL copied to clipboard");
          });
          break;
        case "toggle-status": {
          const next = item.status === "active" ? "inactive" : "active";
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: next } : i)),
          );
          if (viewItem?.id === item.id) {
            setViewItem({ ...item, status: next });
          }
          showToast(`QR code ${next === "active" ? "enabled" : "disabled"}`);
          break;
        }
        case "delete":
          setDeleteTarget(item);
          break;
      }
    },
    [showToast, viewItem],
  );

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    if (viewItem?.id === deleteTarget.id) setViewItem(null);
    showToast(`Deleted "${deleteTarget.name}"`);
    setDeleteTarget(null);
  };

  const confirmRename = (name: string) => {
    if (!renameTarget) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === renameTarget.id
          ? { ...i, name, url: buildQrUrl(name, i.type, i.tableNumber) }
          : i,
      ),
    );
    if (viewItem?.id === renameTarget.id) {
      setViewItem({
        ...renameTarget,
        name,
        url: buildQrUrl(name, renameTarget.type, renameTarget.tableNumber),
      });
    }
    showToast(`Renamed to "${name}"`);
    setRenameTarget(null);
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
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onTypeChange={setType}
          onSortChange={setSort}
          onCreate={() => setCreateOpen(true)}
        />
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
          <QrTable items={filtered} onAction={handleAction} />
        </motion.div>
      )}

      <CreateQrWizard
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onComplete={handleCreate}
      />

      <QrDetailsDrawer
        item={viewItem}
        onClose={() => setViewItem(null)}
        onDownloadPng={(item) => handleAction("download-png", item)}
        onDownloadSvg={(item) => handleAction("download-pdf", item)}
        onPrint={(item) => handleAction("print", item)}
        onCopyLink={(item) => handleAction("copy-link", item)}
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
    </div>
  );
}

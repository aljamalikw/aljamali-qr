"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { QrStatsOverview } from "./QrStatsOverview";
import { QrToolbar } from "./QrToolbar";
import { QrTable } from "./QrTable";
import { CreateQrModal } from "./CreateQrModal";
import { QrDetailsDrawer } from "./QrDetailsDrawer";
import { DeleteQrModal } from "./DeleteQrModal";
import { RenameQrModal } from "./RenameQrModal";
import { QrToast } from "./QrToast";
import type { QrAction } from "./QrActionsMenu";

function QrTableSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 rounded-xl border border-white/5 bg-black/20 p-4">
          <div className="h-11 w-11 rounded-lg bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-white/5" />
            <div className="h-3 w-1/4 rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function QrManagement() {
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
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setItems(initialQrCodes);
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const filtered = useMemo(
    () => filterAndSortQrCodes(items, { search, status, type, sort }),
    [items, search, status, type, sort],
  );

  const stats = useMemo(() => computeOverviewStats(items), [items]);

  const handleCreate = (data: QrCreateFormData) => {
    const newItem = formToQrItem(data);
    setItems((prev) => [newItem, ...prev]);
    showToast(`QR code "${newItem.name}" created`);
  };

  const handleAction = (action: QrAction, item: QrCodeItem) => {
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
        showToast(`Downloading PDF for "${item.name}"...`);
        break;
      case "print":
        showToast(`Opening print dialog for "${item.name}"...`);
        break;
      case "copy-link":
        navigator.clipboard.writeText(item.url).then(() => {
          showToast("Link copied to clipboard");
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
  };

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
      setViewItem({ ...renameTarget, name, url: buildQrUrl(name, renameTarget.type, renameTarget.tableNumber) });
    }
    showToast(`Renamed to "${name}"`);
    setRenameTarget(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <QrStatsOverview stats={stats} />

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

      {loading ? (
        <div className="dashboard-card overflow-hidden rounded-2xl">
          <QrTableSkeleton />
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

      <CreateQrModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onGenerate={(data) => {
          handleCreate(data);
        }}
      />

      <QrDetailsDrawer
        item={viewItem}
        onClose={() => setViewItem(null)}
        onDownloadPng={(item) => handleAction("download-png", item)}
        onDownloadPdf={(item) => handleAction("download-pdf", item)}
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

      <QrToast message={toast ?? ""} visible={toast !== null} />
    </div>
  );
}

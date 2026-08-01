"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { logAdminActivity } from "@/lib/admin/activity-log";
import {
  EXPORT_DATASETS,
  createRestaurantBackup,
  exportDataset,
  validateRestaurantBackup,
  type ExportDataset,
  type ExportFormat,
} from "@/lib/admin/backup-export";
import {
  fetchAdminRestaurantManagementRows,
  type AdminRestaurantManagementRow,
} from "@/lib/admin/restaurants";
import { fetchIsSuperAdmin } from "@/lib/auth/get-user-role";
import { supabase } from "@/lib/supabase";

export function AdminBackupExportPage() {
  const { showToast } = useToast();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [restaurants, setRestaurants] = useState<AdminRestaurantManagementRow[]>(
    [],
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [dataset, setDataset] = useState<ExportDataset>("restaurants");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [backupRestaurantId, setBackupRestaurantId] = useState("");
  const [restorePreview, setRestorePreview] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const isSuper = await fetchIsSuperAdmin(session?.user ?? null);
      if (mounted) setAllowed(isSuper);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchAdminRestaurantManagementRows();
    setLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setRestaurants(result.data);
  }, [showToast]);

  useEffect(() => {
    if (allowed) void load();
  }, [allowed, load]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const runExport = async (scope: "all" | "selected") => {
    if (scope === "selected" && selected.length === 0) {
      showToast("Select at least one restaurant.", "error");
      return;
    }
    setBusy(true);
    const result = await exportDataset(
      dataset,
      format,
      scope === "selected" ? selected : undefined,
    );
    setBusy(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    void logAdminActivity({
      action: "backup_exported",
      details: { dataset, format, scope, selectedCount: selected.length },
    });
    showToast("Export ready");
  };

  const runBackup = async () => {
    if (!backupRestaurantId) {
      showToast("Choose a restaurant to back up.", "error");
      return;
    }
    setBusy(true);
    const result = await createRestaurantBackup(backupRestaurantId);
    setBusy(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    const blob = new Blob([JSON.stringify(result.backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `restaurant-backup-${backupRestaurantId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    void logAdminActivity({
      action: "backup_exported",
      restaurantId: backupRestaurantId,
      details: { type: "full_restaurant_backup" },
    });
    showToast("Restaurant backup downloaded");
  };

  if (allowed === null || loading) {
    return (
      <AdminPlaceholder
        title="Backup & Export"
        description="Export platform data and create restaurant backups."
      >
        <TableSkeleton rows={4} />
      </AdminPlaceholder>
    );
  }

  if (!allowed) {
    return (
      <AdminPlaceholder
        title="Backup & Export"
        description="Export platform data and create restaurant backups."
      >
        <p className="py-12 text-center text-sm text-white/50">
          Super Admin access required.
        </p>
      </AdminPlaceholder>
    );
  }

  return (
    <AdminPlaceholder
      title="Backup & Export"
      description="Export CSV, Excel, or JSON. Create full restaurant backups. Restore is framework-only."
    >
      <div className="space-y-8">
        <section className="rounded-2xl border border-gold/15 bg-black/25 p-5">
          <h2 className="font-serif text-xl text-white">Dataset export</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <select
              value={dataset}
              onChange={(e) => setDataset(e.target.value as ExportDataset)}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"
            >
              {EXPORT_DATASETS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"
            >
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
              <option value="json">JSON</option>
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                className="menu-btn-secondary flex-1"
                disabled={busy}
                onClick={() => void runExport("selected")}
              >
                Export selected
              </button>
              <button
                type="button"
                className="menu-btn-primary flex-1"
                disabled={busy}
                onClick={() => void runExport("all")}
              >
                Export all
              </button>
            </div>
          </div>

          <div className="mt-5 max-h-64 overflow-y-auto rounded-xl border border-white/10">
            {restaurants.map((restaurant) => (
              <label
                key={restaurant.id}
                className="flex cursor-pointer items-center gap-3 border-b border-white/5 px-4 py-2.5 text-sm last:border-0 hover:bg-white/[0.02]"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(restaurant.id)}
                  onChange={() => toggle(restaurant.id)}
                />
                <span className="text-white">
                  {restaurant.restaurantName || "Unnamed restaurant"}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gold/15 bg-black/25 p-5">
          <h2 className="font-serif text-xl text-white">Full restaurant backup</h2>
          <p className="mt-2 text-sm text-white/50">
            Downloads restaurant + categories, menu items, QR codes, reservations,
            orders, and subscription as JSON.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              value={backupRestaurantId}
              onChange={(e) => setBackupRestaurantId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white"
            >
              <option value="">Select restaurant…</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.restaurantName || restaurant.id}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="menu-btn-primary shrink-0"
              disabled={busy}
              onClick={() => void runBackup()}
            >
              Create backup
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-gold/15 bg-black/25 p-5">
          <h2 className="font-serif text-xl text-white">Restore backup</h2>
          <p className="mt-2 text-sm text-white/50">
            Framework only — validates backup structure and shows a preview. No
            data is written yet.
          </p>
          <input
            type="file"
            accept="application/json,.json"
            className="mt-4 block w-full text-sm text-white/70"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                const parsed = JSON.parse(text) as unknown;
                const result = validateRestaurantBackup(parsed);
                if (!result.ok) {
                  showToast(result.message, "error");
                  return;
                }
                setRestorePreview(
                  `${result.preview.restaurantName ?? "Restaurant"} · ${result.preview.categories} categories · ${result.preview.menuItems} items · ${result.preview.qrCodes} QR codes`,
                );
              } catch {
                showToast("Invalid JSON backup file.", "error");
              }
            }}
          />
        </section>
      </div>

      <ConfirmModal
        open={Boolean(restorePreview)}
        title="Restore preview"
        description={
          restorePreview
            ? `${restorePreview}. Restore writes are not enabled in this framework release.`
            : null
        }
        confirmLabel="Understood"
        cancelLabel="Close"
        onConfirm={() => setRestorePreview(null)}
        onCancel={() => setRestorePreview(null)}
      />
    </AdminPlaceholder>
  );
}

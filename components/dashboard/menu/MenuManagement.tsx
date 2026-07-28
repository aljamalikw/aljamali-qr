"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { getCategoryLabel } from "@/lib/categories/menu-options";
import type { DashboardMenuItem, MenuFormData, MenuSortOption, MenuStatusFilter } from "@/lib/dashboard/menu/types";
import { useMenuCategoryOptions } from "@/lib/categories/useMenuCategoryOptions";
import { createMenuItem } from "@/lib/menu-items/createMenuItem";
import { duplicateMenuItem } from "@/lib/menu-items/duplicateMenuItem";
import { setMenuItemArchived } from "@/lib/menu-items/archiveMenuItem";
import { restoreMenuItem, softDeleteMenuItem } from "@/lib/menu-items/softDeleteMenuItem";
import { fetchMenuItems } from "@/lib/menu-items/fetchMenuItems";
import { updateMenuItem } from "@/lib/menu-items/updateMenuItem";
import {
  createEmptyMenuForm,
  filterAndSortMenuItems,
  formatPrice,
  menuItemToForm,
  validateMenuForm,
} from "@/lib/dashboard/menu/utils";
import { downloadCsv, exportMenuItemsToCsv, parseMenuItemsCsv } from "@/lib/dashboard/menu/csv";
import { useToast } from "@/components/ui/ToastProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DashboardPrimaryButton } from "../ui/DashboardPrimaryButton";
import { MenuEmptyState } from "./MenuEmptyState";
import { MenuFormDrawer } from "./MenuFormDrawer";

const PAGE_SIZE = 10;

export function MenuManagement() {
  const { showToast } = useToast();
  const { categories: menuCategories } = useMenuCategoryOptions();
  const [items, setItems] = useState<DashboardMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MenuStatusFilter>("all");
  const [sort, setSort] = useState<MenuSortOption>("newest");
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuFormData>(createEmptyMenuForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DashboardMenuItem | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMenuItems = useCallback(async () => {
    setLoading(true);
    const result = await fetchMenuItems();
    setLoading(false);

    if (!result.ok) {
      showToast(result.message, "error");
      setItems([]);
      return;
    }

    setItems(result.data);
  }, [showToast]);

  useEffect(() => {
    loadMenuItems();
  }, [loadMenuItems]);

  const filtered = useMemo(
    () => filterAndSortMenuItems(items, { search, status, sort, showArchived }),
    [items, search, status, sort, showArchived],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, status, sort, showArchived]);

  const categoryLabel = useCallback(
    (categoryId: string) => getCategoryLabel(categoryId, menuCategories),
    [menuCategories],
  );

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm({
      ...createEmptyMenuForm(),
      categoryId: menuCategories[0]?.id ?? "",
    });
    setFormError(null);
    setDrawerOpen(true);
  }, [menuCategories]);

  const openEdit = useCallback((item: DashboardMenuItem) => {
    setEditingId(item.id);
    setForm(menuItemToForm(item));
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  const handleSave = async () => {
    const err = validateMenuForm(form);
    if (err) {
      setFormError(err);
      return;
    }

    setSaving(true);

    const result = editingId
      ? await updateMenuItem(editingId, form)
      : await createMenuItem(form);

    setSaving(false);

    if (!result.ok) {
      setFormError(result.message);
      showToast(result.message, "error");
      return;
    }

    showToast(editingId ? "Menu item updated successfully" : "Menu item added successfully");
    setDrawerOpen(false);
    await loadMenuItems();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const allSelected = pageItems.every((item) => prev.has(item.id));
      const next = new Set(prev);
      if (allSelected) {
        pageItems.forEach((item) => next.delete(item.id));
      } else {
        pageItems.forEach((item) => next.add(item.id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleDuplicate = async (item: DashboardMenuItem) => {
    const result = await duplicateMenuItem(item.id);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    showToast(`Duplicated "${item.nameEn}"`);
    await loadMenuItems();
  };

  const handleToggleArchive = async (item: DashboardMenuItem) => {
    const nextArchived = !item.isArchived;
    const result = await setMenuItemArchived(item.id, nextArchived);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === item.id ? result.data : i)));
    showToast(nextArchived ? `Archived "${item.nameEn}"` : `Restored "${item.nameEn}"`, "success", {
      action: {
        label: "Undo",
        onClick: async () => {
          const undoResult = await setMenuItemArchived(item.id, !nextArchived);
          if (undoResult.ok) {
            setItems((prev) => prev.map((i) => (i.id === item.id ? undoResult.data : i)));
          }
        },
      },
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    const result = await softDeleteMenuItem(deleteTarget.id);
    setDeleting(false);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    const deletedItem = deleteTarget;
    setDeleteTarget(null);
    showToast(
      `Deleted "${deletedItem.nameEn}"`,
      "success",
      result.hard
        ? undefined
        : {
            action: {
              label: "Undo",
              onClick: async () => {
                const undoResult = await restoreMenuItem(deletedItem.id);
                if (undoResult.ok) await loadMenuItems();
              },
            },
          },
    );
    await loadMenuItems();
  };

  const handleBulkDuplicate = async () => {
    const ids = Array.from(selectedIds);
    let failures = 0;
    for (const id of ids) {
      const result = await duplicateMenuItem(id);
      if (!result.ok) failures += 1;
    }
    clearSelection();
    await loadMenuItems();
    showToast(
      failures ? `Duplicated ${ids.length - failures} of ${ids.length} items` : `Duplicated ${ids.length} items`,
      failures ? "error" : "success",
    );
  };

  const handleBulkArchive = async (archived: boolean) => {
    const ids = Array.from(selectedIds);
    let failures = 0;
    for (const id of ids) {
      const result = await setMenuItemArchived(id, archived);
      if (!result.ok) failures += 1;
    }
    clearSelection();
    await loadMenuItems();
    showToast(
      failures
        ? `Updated ${ids.length - failures} of ${ids.length} items`
        : archived
          ? `Archived ${ids.length} items`
          : `Restored ${ids.length} items`,
      failures ? "error" : "success",
    );
  };

  const confirmBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    setDeleting(true);
    let failures = 0;
    for (const id of ids) {
      const result = await softDeleteMenuItem(id);
      if (!result.ok) failures += 1;
    }
    setDeleting(false);
    setBulkDeleteOpen(false);
    clearSelection();
    await loadMenuItems();
    showToast(
      failures ? `Deleted ${ids.length - failures} of ${ids.length} items` : `Deleted ${ids.length} items`,
      failures ? "error" : "success",
    );
  };

  const handleExportCsv = () => {
    const source = selectedIds.size > 0 ? items.filter((i) => selectedIds.has(i.id)) : filtered;
    const csv = exportMenuItemsToCsv(source, categoryLabel);
    downloadCsv(`menu-items-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    showToast(`Exported ${source.length} items to CSV`);
  };

  const handleImportCsv = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseMenuItemsCsv(text);

      if (rows.length === 0) {
        showToast("No valid rows found in CSV", "error");
        return;
      }

      let created = 0;
      let failed = 0;

      for (const row of rows) {
        const matchedCategory = menuCategories.find(
          (c) => c.label.toLowerCase() === (row.categoryLabel ?? "").toLowerCase(),
        );

        const formData: MenuFormData = {
          ...createEmptyMenuForm(),
          ...row,
          categoryId: matchedCategory?.id ?? menuCategories[0]?.id ?? "",
        };

        const err = validateMenuForm(formData);
        if (err) {
          failed += 1;
          continue;
        }

        const result = await createMenuItem(formData);
        if (result.ok) created += 1;
        else failed += 1;
      }

      await loadMenuItems();
      showToast(
        failed ? `Imported ${created} items, ${failed} failed` : `Imported ${created} items`,
        failed ? "error" : "success",
      );
    } catch {
      showToast("Unable to read CSV file", "error");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const showEmpty = !loading && items.length === 0;
  const allOnPageSelected = pageItems.length > 0 && pageItems.every((item) => selectedIds.has(item.id));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Menu Items</h1>
          <p className="mt-1 text-sm text-white/45">Manage your bilingual menu with photos and pricing</p>
        </div>
        {!showEmpty && (
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportCsv(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="menu-btn-secondary text-xs disabled:opacity-60"
            >
              {importing ? "Importing…" : "Import CSV"}
            </button>
            <button type="button" onClick={handleExportCsv} className="menu-btn-secondary text-xs">
              Export CSV
            </button>
            <DashboardPrimaryButton variant="cta" onClick={openCreate}>
              + Add Menu Item
            </DashboardPrimaryButton>
          </div>
        )}
      </div>

      {!showEmpty && (
        <div className="dashboard-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="flex-1 rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value as MenuStatusFilter)} className="rounded-xl border border-gold/15 bg-black/30 px-3 py-2.5 text-sm text-white">
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as MenuSortOption)} className="rounded-xl border border-gold/15 bg-black/30 px-3 py-2.5 text-sm text-white">
            <option value="newest">Newest</option>
            <option value="name">Name</option>
            <option value="price-high">Price: High</option>
            <option value="price-low">Price: Low</option>
          </select>
          <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-white/60">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-gold/30"
            />
            Show archived
          </label>
        </div>
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
            <button type="button" onClick={handleBulkDuplicate} className="menu-btn-secondary text-xs">
              Duplicate
            </button>
            <button type="button" onClick={() => handleBulkArchive(true)} className="menu-btn-secondary text-xs">
              Archive
            </button>
            <button type="button" onClick={() => handleBulkArchive(false)} className="menu-btn-secondary text-xs">
              Restore
            </button>
            <button type="button" onClick={handleExportCsv} className="menu-btn-secondary text-xs">
              Export Selected
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
          <TableSkeleton rows={4} />
        </div>
      ) : showEmpty ? (
        <MenuEmptyState onAdd={openCreate} />
      ) : filtered.length === 0 ? (
        <div className="dashboard-card rounded-2xl p-10 text-center">
          <p className="text-white/45">No menu items match your filters.</p>
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="dashboard-card overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left">
                <thead>
                  <tr className="border-b border-gold/10 bg-black/30">
                    <th className="w-10 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={toggleSelectAllOnPage}
                        className="rounded border-gold/30"
                        aria-label="Select all on page"
                      />
                    </th>
                    {["Item", "Category", "Price", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => (
                    <tr key={item.id} className={`table-row-hover border-b border-white/5 last:border-0 ${item.isArchived ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-gold/30"
                          aria-label={`Select ${item.nameEn}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={item.image} alt="" className="h-11 w-11 rounded-lg object-cover" />
                          <div>
                            <p className="font-medium text-white">
                              {item.nameEn}
                              {item.isArchived && (
                                <span className="ms-2 rounded-full border border-white/15 px-1.5 py-0.5 text-[10px] uppercase text-white/40">
                                  Archived
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-white/40" dir="rtl">{item.nameAr}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">{categoryLabel(item.categoryId)}</td>
                      <td className="px-4 py-3">
                        {item.discountPrice !== null ? (
                          <span>
                            <span className="font-serif text-gold">{formatPrice(item.discountPrice)}</span>{" "}
                            <span className="text-xs text-white/30 line-through">{formatPrice(item.price)}</span>
                          </span>
                        ) : (
                          <span className="font-serif text-gold">{formatPrice(item.price)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${item.status === "published" ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border border-white/10 bg-white/5 text-white/45"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => openEdit(item)} className="menu-btn-secondary px-3 py-1.5 text-xs">Edit</button>
                          <button type="button" onClick={() => void handleDuplicate(item)} className="menu-btn-secondary px-3 py-1.5 text-xs">Duplicate</button>
                          <button type="button" onClick={() => void handleToggleArchive(item)} className="menu-btn-secondary px-3 py-1.5 text-xs">
                            {item.isArchived ? "Restore" : "Archive"}
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(item)} className="menu-btn-danger px-3 py-1.5 text-xs">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-white/40">
                Page {page} of {totalPages} &middot; {filtered.length} items
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="menu-btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="menu-btn-secondary px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <MenuFormDrawer
        open={drawerOpen}
        form={form}
        editing={editingId !== null}
        saving={saving}
        error={formError}
        categories={menuCategories}
        onChange={setForm}
        onSave={handleSave}
        onClose={() => setDrawerOpen(false)}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete menu item?"
        description={<>Are you sure you want to delete <span className="font-medium text-white">{deleteTarget?.nameEn}</span>? This cannot be undone.</>}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmModal
        open={bulkDeleteOpen}
        title="Delete selected items?"
        description={<>Are you sure you want to delete <span className="font-medium text-white">{selectedIds.size}</span> menu items?</>}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}

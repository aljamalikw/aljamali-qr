"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { initialMenuItems, getCategoryLabel } from "@/lib/dashboard/menu/seed-data";
import type { DashboardMenuItem, MenuFormData, MenuSortOption, MenuStatusFilter } from "@/lib/dashboard/menu/types";
import {
  createEmptyMenuForm,
  filterAndSortMenuItems,
  formToMenuItem,
  formatPrice,
  menuItemToForm,
  validateMenuForm,
} from "@/lib/dashboard/menu/utils";
import { useToast } from "@/components/ui/ToastProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DashboardPrimaryButton } from "../ui/DashboardPrimaryButton";
import { MenuEmptyState } from "./MenuEmptyState";
import { MenuFormDrawer } from "./MenuFormDrawer";

export function MenuManagement() {
  const { showToast } = useToast();
  const [items, setItems] = useState<DashboardMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MenuStatusFilter>("all");
  const [sort, setSort] = useState<MenuSortOption>("newest");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuFormData>(createEmptyMenuForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DashboardMenuItem | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setItems(initialMenuItems);
      setLoading(false);
    }, 650);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(
    () => filterAndSortMenuItems(items, { search, status, sort }),
    [items, search, status, sort],
  );

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(createEmptyMenuForm());
    setFormError(null);
    setDrawerOpen(true);
  }, []);

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
    await new Promise((r) => setTimeout(r, 700));
    if (editingId) {
      setItems((prev) =>
        prev.map((i) => (i.id === editingId ? formToMenuItem(form, editingId) : i)),
      );
      showToast("Menu item updated successfully");
    } else {
      setItems((prev) => [formToMenuItem(form), ...prev]);
      showToast("Menu item added successfully");
    }
    setSaving(false);
    setDrawerOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    showToast(`Deleted "${deleteTarget.nameEn}"`);
    setDeleteTarget(null);
  };

  const showEmpty = !loading && items.length === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Menu Items</h1>
          <p className="mt-1 text-sm text-white/45">Manage your bilingual menu with photos and pricing</p>
        </div>
        {!showEmpty && (
          <DashboardPrimaryButton variant="cta" onClick={openCreate}>
            + Add Menu Item
          </DashboardPrimaryButton>
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
        </div>
      )}

      {loading ? (
        <div className="dashboard-card overflow-hidden rounded-2xl">
          <TableSkeleton rows={4} />
        </div>
      ) : showEmpty ? (
        <MenuEmptyState onAdd={openCreate} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="dashboard-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead>
                <tr className="border-b border-gold/10 bg-black/30">
                  {["Item", "Category", "Price", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-white/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="table-row-hover border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt="" className="h-11 w-11 rounded-lg object-cover" />
                        <div>
                          <p className="font-medium text-white">{item.nameEn}</p>
                          <p className="text-xs text-white/40" dir="rtl">{item.nameAr}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60">{getCategoryLabel(item.categoryId)}</td>
                    <td className="px-4 py-3 font-serif text-gold">{formatPrice(item.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${item.status === "published" ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border border-white/10 bg-white/5 text-white/45"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openEdit(item)} className="menu-btn-secondary px-3 py-1.5 text-xs">Edit</button>
                        <button type="button" onClick={() => setDeleteTarget(item)} className="menu-btn-danger px-3 py-1.5 text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <MenuFormDrawer
        open={drawerOpen}
        form={form}
        editing={editingId !== null}
        saving={saving}
        error={formError}
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
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

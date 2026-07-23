"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createEmptyCategoryForm, validateCategoryForm } from "@/lib/dashboard/categories/seed-data";
import type { DashboardCategory } from "@/lib/dashboard/categories/types";
import { createCategory } from "@/lib/categories/createCategory";
import { deleteCategory } from "@/lib/categories/deleteCategory";
import { fetchCategories } from "@/lib/categories/fetchCategories";
import { updateCategory } from "@/lib/categories/updateCategory";
import { useToast } from "@/components/ui/ToastProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DashboardPrimaryButton } from "../ui/DashboardPrimaryButton";
import { CategoryEmptyState } from "./CategoryEmptyState";

const inputClass =
  "w-full rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

export function CategoryManagement() {
  const { showToast } = useToast();
  const [items, setItems] = useState<DashboardCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(createEmptyCategoryForm());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DashboardCategory | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    const result = await fetchCategories();
    setLoading(false);

    if (!result.ok) {
      showToast(result.message, "error");
      setItems([]);
      return;
    }

    setItems(result.data);
  }, [showToast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreate = () => {
    setEditingId(null);
    setForm(createEmptyCategoryForm());
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: DashboardCategory) => {
    setEditingId(item.id);
    setForm({ nameEn: item.nameEn, nameAr: item.nameAr, icon: item.icon, visible: item.visible });
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const err = validateCategoryForm(form);
    if (err) {
      setError(err);
      return;
    }

    setSaving(true);

    const result = editingId
      ? await updateCategory(editingId, form)
      : await createCategory(form);

    setSaving(false);

    if (!result.ok) {
      setError(result.message);
      showToast(result.message, "error");
      return;
    }

    showToast(editingId ? "Category updated successfully" : "Category created successfully");
    setModalOpen(false);
    await loadCategories();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    const result = await deleteCategory(deleteTarget.id);
    setDeleting(false);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    showToast(`Deleted "${deleteTarget.nameEn}"`);
    setDeleteTarget(null);
    await loadCategories();
  };

  const showEmpty = !loading && items.length === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Categories</h1>
          <p className="mt-1 text-sm text-white/45">Organize your menu into sections</p>
        </div>
        {!showEmpty && (
          <DashboardPrimaryButton variant="cta" onClick={openCreate}>
            + Add Category
          </DashboardPrimaryButton>
        )}
      </div>

      {loading ? (
        <div className="dashboard-card overflow-hidden rounded-2xl">
          <TableSkeleton rows={4} />
        </div>
      ) : showEmpty ? (
        <CategoryEmptyState onAdd={openCreate} />
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="dashboard-card group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-gold/25"
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{item.icon}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${item.visible ? "bg-emerald-500/10 text-emerald-300" : "bg-white/5 text-white/40"}`}>
                  {item.visible ? "Visible" : "Hidden"}
                </span>
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold text-white">{item.nameEn}</h3>
              <p className="text-sm text-white/45" dir="rtl">{item.nameAr}</p>
              <p className="mt-3 text-xs text-white/35">{item.itemCount} items</p>
              <div className="mt-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button type="button" onClick={() => openEdit(item)} className="menu-btn-secondary flex-1 py-1.5 text-xs">Edit</button>
                <button type="button" onClick={() => setDeleteTarget(item)} className="menu-btn-danger flex-1 py-1.5 text-xs">Delete</button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-gold/15 bg-surface-elevated p-6"
            >
              <h2 className="font-serif text-xl font-bold text-white">{editingId ? "Edit Category" : "New Category"}</h2>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Name (English)</label>
                  <input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Name (Arabic)</label>
                  <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} dir="rtl" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Icon</label>
                  <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className={inputClass} />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-white/60">
                  <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} />
                  Visible on menu
                </label>
                {error && <p className="text-sm text-red-400">{error}</p>}
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="menu-btn-secondary flex-1">Cancel</button>
                <button type="button" onClick={handleSave} disabled={saving} className="menu-btn-primary flex-1 disabled:opacity-60">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete category?"
        description={<>Delete <span className="font-medium text-white">{deleteTarget?.nameEn}</span>? Items in this category will need reassignment.</>}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

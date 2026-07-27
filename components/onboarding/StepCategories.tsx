"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AuthButton } from "@/components/auth/AuthButton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import { createCategory } from "@/lib/categories/createCategory";
import { deleteCategory } from "@/lib/categories/deleteCategory";
import { fetchCategories } from "@/lib/categories/fetchCategories";
import { reorderCategories } from "@/lib/categories/reorderCategories";
import { updateCategory } from "@/lib/categories/updateCategory";
import type { DashboardCategory } from "@/lib/dashboard/categories/types";
import {
  CATEGORY_SEED_SUGGESTIONS,
  type CategorySeedSuggestion,
} from "@/lib/onboarding/constants";

interface StepCategoriesProps {
  onBack: () => void;
  onContinue: () => Promise<void>;
}

const inputClass =
  "w-full rounded-xl border border-gold/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

export function StepCategories({ onBack, onContinue }: StepCategoriesProps) {
  const { showToast } = useToast();
  const [items, setItems] = useState<DashboardCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addNameEn, setAddNameEn] = useState("");
  const [addNameAr, setAddNameAr] = useState("");
  const [addIcon, setAddIcon] = useState("🍽️");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameEn, setEditNameEn] = useState("");
  const [editNameAr, setEditNameAr] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DashboardCategory | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchCategories();
    setLoading(false);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setItems(result.data);
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const existingNames = new Set(
    items.map((item) => item.nameEn.toLowerCase()),
  );
  const suggestions = CATEGORY_SEED_SUGGESTIONS.filter(
    (suggestion) => !existingNames.has(suggestion.nameEn.toLowerCase()),
  );

  const handleQuickAdd = async (suggestion: CategorySeedSuggestion) => {
    setAdding(true);
    const result = await createCategory({
      nameEn: suggestion.nameEn,
      nameAr: suggestion.nameAr,
      icon: suggestion.icon,
      visible: true,
    });
    setAdding(false);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setItems((previous) => [...previous, result.data]);
    showToast(`Added "${suggestion.nameEn}"`);
  };

  const handleAddSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!addNameEn.trim()) {
      showToast("Please enter a category name.", "error");
      return;
    }

    setAdding(true);
    const result = await createCategory({
      nameEn: addNameEn.trim(),
      nameAr: addNameAr.trim() || addNameEn.trim(),
      icon: addIcon.trim() || "🍽️",
      visible: true,
    });
    setAdding(false);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    setItems((previous) => [...previous, result.data]);
    setAddNameEn("");
    setAddNameAr("");
    setAddIcon("🍽️");
    setAddOpen(false);
    showToast(`Added "${result.data.nameEn}"`);
  };

  const startEdit = (item: DashboardCategory) => {
    setEditingId(item.id);
    setEditNameEn(item.nameEn);
    setEditNameAr(item.nameAr);
    setEditIcon(item.icon);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editNameEn.trim()) {
      showToast("Please enter a category name.", "error");
      return;
    }

    setSavingEdit(true);
    const result = await updateCategory(editingId, {
      nameEn: editNameEn.trim(),
      nameAr: editNameAr.trim() || editNameEn.trim(),
      icon: editIcon.trim() || "🍽️",
      visible: items.find((item) => item.id === editingId)?.visible ?? true,
    });
    setSavingEdit(false);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    setItems((previous) =>
      previous.map((item) => (item.id === editingId ? result.data : item)),
    );
    setEditingId(null);
    showToast("Category updated");
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

    setItems((previous) => previous.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    showToast(`Deleted "${deleteTarget.nameEn}"`);
  };

  const move = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const next = [...items];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setItems(next);

    setReordering(true);
    const result = await reorderCategories(next.map((item) => item.id));
    setReordering(false);

    if (!result.ok) {
      showToast(result.message, "error");
      load();
    }
  };

  const handleContinue = async () => {
    setContinuing(true);
    await onContinue();
    setContinuing(false);
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
          Organize your menu
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50">
          Create categories to group your dishes. You can skip this and add
          categories later from the dashboard.
        </p>
      </div>

      {suggestions.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-xs uppercase tracking-wider text-white/40">
            Quick add
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.nameEn}
                type="button"
                onClick={() => handleQuickAdd(suggestion)}
                disabled={adding}
                className="flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/5 px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-gold/40 hover:text-white disabled:opacity-50"
              >
                <span>{suggestion.icon}</span>
                <span>{suggestion.nameEn}</span>
                <span className="text-gold">+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((skeleton) => (
              <div
                key={skeleton}
                className="h-14 animate-pulse rounded-xl bg-white/5"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gold/15 bg-black/20 py-8 text-center text-sm text-white/40">
            No categories yet. Add one below or pick a quick suggestion above.
          </div>
        ) : (
          items.map((item, index) =>
            editingId === item.id ? (
              <div
                key={item.id}
                className="rounded-xl border border-gold/25 bg-black/30 p-3"
              >
                <div className="grid gap-2 sm:grid-cols-[3rem_1fr_1fr]">
                  <input
                    value={editIcon}
                    onChange={(event) => setEditIcon(event.target.value)}
                    className={inputClass}
                  />
                  <input
                    value={editNameEn}
                    onChange={(event) => setEditNameEn(event.target.value)}
                    placeholder="Name (English)"
                    className={inputClass}
                  />
                  <input
                    value={editNameAr}
                    onChange={(event) => setEditNameAr(event.target.value)}
                    placeholder="Name (Arabic)"
                    dir="rtl"
                    className={inputClass}
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="menu-btn-secondary flex-1 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={savingEdit}
                    className="menu-btn-primary flex-1 py-1.5 text-xs disabled:opacity-60"
                  >
                    {savingEdit ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <motion.div
                key={item.id}
                layout
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5"
              >
                <span className="text-xl">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {item.nameEn}
                  </p>
                  {item.nameAr && (
                    <p className="truncate text-xs text-white/40" dir="rtl">
                      {item.nameAr}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || reordering}
                    className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1 || reordering}
                    className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white"
                    aria-label="Edit"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Delete"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            ),
          )
        )}
      </div>

      {addOpen ? (
        <form
          onSubmit={handleAddSubmit}
          className="mt-4 space-y-2 rounded-xl border border-gold/15 bg-black/20 p-3"
        >
          <div className="grid gap-2 sm:grid-cols-[3rem_1fr_1fr]">
            <input
              value={addIcon}
              onChange={(event) => setAddIcon(event.target.value)}
              className={inputClass}
              placeholder="🍽️"
            />
            <input
              value={addNameEn}
              onChange={(event) => setAddNameEn(event.target.value)}
              placeholder="Name (English)"
              className={inputClass}
            />
            <input
              value={addNameAr}
              onChange={(event) => setAddNameAr(event.target.value)}
              placeholder="Name (Arabic, optional)"
              dir="rtl"
              className={inputClass}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="menu-btn-secondary flex-1 py-1.5 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding}
              className="menu-btn-primary flex-1 py-1.5 text-xs disabled:opacity-60"
            >
              {adding ? "Adding…" : "Add Category"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="mt-4 w-full rounded-xl border border-dashed border-gold/20 py-2.5 text-sm text-gold/80 transition-colors hover:border-gold/40 hover:text-gold"
        >
          + Add Custom Category
        </button>
      )}

      <div className="mt-6 flex gap-3">
        <AuthButton type="button" variant="secondary" onClick={onBack} className="flex-1">
          Back
        </AuthButton>
        <AuthButton
          type="button"
          onClick={handleContinue}
          loading={continuing}
          className="flex-1"
        >
          Continue
        </AuthButton>
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete category?"
        description={
          <>
            Delete{" "}
            <span className="font-medium text-white">
              {deleteTarget?.nameEn}
            </span>
            ? Items in this category will need reassignment.
          </>
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

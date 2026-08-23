"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthButton } from "@/components/auth/AuthButton";
import { MenuItemImageField } from "@/components/dashboard/menu/MenuItemImageField";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import { getCategoryLabel } from "@/lib/categories/menu-options";
import { useMenuCategoryOptions } from "@/lib/categories/useMenuCategoryOptions";
import type { DashboardMenuItem, MenuFormData } from "@/lib/dashboard/menu/types";
import { formatPrice } from "@/lib/dashboard/menu/utils";
import { createMenuItem } from "@/lib/menu-items/createMenuItem";
import { deleteMenuItem } from "@/lib/menu-items/deleteMenuItem";
import { fetchMenuItems } from "@/lib/menu-items/fetchMenuItems";
import { updateMenuItem } from "@/lib/menu-items/updateMenuItem";

interface StepMenuItemsProps {
  onBack: () => void;
  onContinue: () => Promise<void>;
  onSkip?: () => Promise<void>;
}

const inputClass =
  "w-full rounded-xl border border-gold/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

type BooleanFlagKey =
  | "vegetarian"
  | "vegan"
  | "glutenFree"
  | "halal"
  | "spicy"
  | "popular"
  | "recommended"
  | "chefSpecial";

const dietaryFlags: { key: BooleanFlagKey; label: string }[] = [
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "glutenFree", label: "Gluten Free" },
  { key: "halal", label: "Halal" },
  { key: "spicy", label: "Spicy" },
  { key: "popular", label: "Popular" },
  { key: "recommended", label: "Recommended" },
  { key: "chefSpecial", label: "Chef's Special" },
];

function createEmptyForm(): MenuFormData {
  return {
    nameEn: "",
    nameAr: "",
    categoryId: "",
    price: "",
    descriptionEn: "",
    descriptionAr: "",
    image: "",
    status: "published",
    vegetarian: false,
    spicy: false,
    chefSpecial: false,
    discountPrice: "",
    popular: false,
    recommended: false,
    vegan: false,
    glutenFree: false,
    halal: false,
    preparationTime: "",
    calories: "",
    ingredients: "",
  };
}

function itemToForm(item: DashboardMenuItem): MenuFormData {
  return {
    nameEn: item.nameEn,
    nameAr: item.nameAr,
    categoryId: item.categoryId,
    price: String(item.price),
    descriptionEn: item.descriptionEn,
    descriptionAr: item.descriptionAr,
    image: item.image,
    status: item.status,
    vegetarian: item.vegetarian,
    spicy: item.spicy,
    chefSpecial: item.chefSpecial,
    discountPrice: item.discountPrice != null ? String(item.discountPrice) : "",
    popular: item.popular ?? false,
    recommended: item.recommended ?? false,
    vegan: item.vegan ?? false,
    glutenFree: item.glutenFree ?? false,
    halal: item.halal ?? false,
    preparationTime: item.preparationTime ?? "",
    calories: item.calories ?? "",
    ingredients: item.ingredients ?? "",
  };
}

export function StepMenuItems({ onBack, onContinue, onSkip }: StepMenuItemsProps) {
  const { showToast } = useToast();
  const { categories, loading: categoriesLoading } = useMenuCategoryOptions();
  const [items, setItems] = useState<DashboardMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuFormData>(createEmptyForm());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DashboardMenuItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [continuing, setContinuing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchMenuItems();
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

  const update = <K extends keyof MenuFormData>(
    key: K,
    value: MenuFormData[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setError(null);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...createEmptyForm(), categoryId: categories[0]?.id ?? "" });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (item: DashboardMenuItem) => {
    setEditingId(item.id);
    setForm(itemToForm(item));
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nameEn.trim()) {
      setError("Please enter the item name.");
      return;
    }
    if (
      !form.price ||
      Number.isNaN(Number(form.price)) ||
      Number(form.price) <= 0
    ) {
      setError("Please enter a valid price.");
      return;
    }

    setSaving(true);
    const result = editingId
      ? await updateMenuItem(editingId, form)
      : await createMenuItem(form);
    setSaving(false);

    if (!result.ok) {
      setError(result.message);
      showToast(result.message, "error");
      return;
    }

    showToast(editingId ? "Menu item updated" : "Menu item added");
    setModalOpen(false);
    await load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    const result = await deleteMenuItem(deleteTarget.id);
    setDeleting(false);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    setItems((previous) => previous.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
    showToast(`Deleted "${deleteTarget.nameEn}"`);
  };

  const handleContinue = async () => {
    if (items.length < 1) {
      showToast("Add at least one menu item to continue.", "error");
      return;
    }
    setContinuing(true);
    await onContinue();
    setContinuing(false);
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
          Add your first dishes
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50">
          Add your first dishes now, or skip and do this later from the
          dashboard. Images are optional.
        </p>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((skeleton) => (
              <div
                key={skeleton}
                className="h-16 animate-pulse rounded-xl bg-white/5"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gold/15 bg-black/20 py-8 text-center text-sm text-white/40">
            No menu items yet.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {item.nameEn}
                </p>
                <p className="text-xs text-white/40">
                  {getCategoryLabel(item.categoryId, categories) ||
                    "Uncategorized"}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-gold">
                {formatPrice(item.price)}
              </span>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
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
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={openCreate}
        disabled={categoriesLoading}
        className="mt-4 w-full rounded-xl border border-dashed border-gold/20 py-2.5 text-sm text-gold/80 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
      >
        + Add Menu Item
      </button>

      {categories.length === 0 && !categoriesLoading && (
        <p className="mt-2 text-center text-xs text-white/35">
          Tip: add a category first so items can be organized on your menu.
        </p>
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
      {onSkip ? (
        <button
          type="button"
          disabled={continuing}
          onClick={() => void onSkip()}
          className="mt-3 w-full text-center text-xs text-white/35 underline-offset-2 transition-colors hover:text-white/60 hover:underline disabled:opacity-50"
        >
          Skip menu items for now
        </button>
      ) : null}

      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[85vh] max-w-lg -translate-y-1/2 overflow-y-auto rounded-2xl border border-gold/15 bg-surface-elevated p-6"
              role="dialog"
              aria-modal="true"
            >
              <h2 className="font-serif text-xl font-bold text-white">
                {editingId ? "Edit Menu Item" : "New Menu Item"}
              </h2>
              <div className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
                      Name *
                    </label>
                    <input
                      value={form.nameEn}
                      onChange={(event) => update("nameEn", event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
                      Category
                    </label>
                    <select
                      value={form.categoryId}
                      onChange={(event) => update("categoryId", event.target.value)}
                      className={inputClass}
                    >
                      <option value="">No category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
                    Description
                  </label>
                  <textarea
                    value={form.descriptionEn}
                    onChange={(event) => update("descriptionEn", event.target.value)}
                    rows={2}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
                      Price *
                    </label>
                    <input
                      value={form.price}
                      onChange={(event) => update("price", event.target.value)}
                      type="number"
                      step="0.001"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
                      Discount Price
                    </label>
                    <input
                      value={form.discountPrice ?? ""}
                      onChange={(event) => update("discountPrice", event.target.value)}
                      type="number"
                      step="0.001"
                      placeholder="Optional"
                      className={inputClass}
                    />
                  </div>
                </div>

                <MenuItemImageField
                  value={form.image}
                  onChange={(url) => update("image", url)}
                  disabled={saving}
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
                      Prep Time (min)
                    </label>
                    <input
                      value={form.preparationTime ?? ""}
                      onChange={(event) => update("preparationTime", event.target.value)}
                      className={inputClass}
                      placeholder="15"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
                      Calories
                    </label>
                    <input
                      value={form.calories ?? ""}
                      onChange={(event) => update("calories", event.target.value)}
                      className={inputClass}
                      placeholder="450"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
                      Availability
                    </label>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        update("status", event.target.value as MenuFormData["status"])
                      }
                      className={inputClass}
                    >
                      <option value="published">Available</option>
                      <option value="draft">Coming Soon</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
                    Ingredients
                  </label>
                  <input
                    value={form.ingredients ?? ""}
                    onChange={(event) => update("ingredients", event.target.value)}
                    className={inputClass}
                    placeholder="Comma-separated, e.g. Salmon, Lemon, Dill"
                  />
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-white/45">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {dietaryFlags.map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/60 transition-colors hover:border-gold/20"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(form[key])}
                          onChange={(event) => update(key, event.target.checked)}
                          className="rounded border-gold/30"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-400" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="menu-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="menu-btn-primary flex-1 disabled:opacity-60"
                >
                  {saving ? "Saving…" : editingId ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete menu item?"
        description={
          <>
            Delete{" "}
            <span className="font-medium text-white">
              {deleteTarget?.nameEn}
            </span>
            ?
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

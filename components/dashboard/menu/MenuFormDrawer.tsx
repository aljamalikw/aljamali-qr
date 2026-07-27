"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { MenuCategoryOption } from "@/lib/categories/menu-options";
import type { MenuFormData } from "@/lib/dashboard/menu/types";
import { MenuItemImageField } from "./MenuItemImageField";

interface MenuFormDrawerProps {
  open: boolean;
  form: MenuFormData;
  editing: boolean;
  saving: boolean;
  error: string | null;
  categories: MenuCategoryOption[];
  onChange: (form: MenuFormData) => void;
  onSave: () => void;
  onClose: () => void;
}

const inputClass =
  "w-full rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

export function MenuFormDrawer({
  open,
  form,
  editing,
  saving,
  error,
  categories,
  onChange,
  onSave,
  onClose,
}: MenuFormDrawerProps) {
  const update = <K extends keyof MenuFormData>(key: K, value: MenuFormData[K]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ opacity: 0, x: "100%", scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: "100%", scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="menu-drawer fixed inset-y-0 end-0 z-50 flex w-full max-w-lg flex-col border-s border-gold/10 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gold/10 px-5 py-4">
              <h2 className="font-serif text-xl font-bold text-white">
                {editing ? "Edit Menu Item" : "Add Menu Item"}
              </h2>
              <button type="button" onClick={onClose} className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white">
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Name (English)</label>
                <input value={form.nameEn} onChange={(e) => update("nameEn", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Name (Arabic)</label>
                <input value={form.nameAr} onChange={(e) => update("nameAr", e.target.value)} dir="rtl" className={inputClass} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Category</label>
                  <select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)} className={inputClass}>
                    {categories.length === 0 ? (
                      <option value="">No categories available</option>
                    ) : (
                      categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.label}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Price (KD)</label>
                  <input value={form.price} onChange={(e) => update("price", e.target.value)} type="number" step="0.001" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
                  Offer price (optional)
                </label>
                <input
                  value={form.discountPrice}
                  onChange={(e) => update("discountPrice", e.target.value)}
                  type="number"
                  step="0.001"
                  placeholder="Leave blank for no offer"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Description (English)</label>
                <textarea value={form.descriptionEn} onChange={(e) => update("descriptionEn", e.target.value)} rows={2} className={`${inputClass} resize-none`} />
              </div>
              <MenuItemImageField
                value={form.image}
                onChange={(url) => update("image", url)}
                disabled={saving}
              />
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Status</label>
                <select value={form.status} onChange={(e) => update("status", e.target.value as MenuFormData["status"])} className={inputClass}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Prep time</label>
                  <input value={form.preparationTime} onChange={(e) => update("preparationTime", e.target.value)} placeholder="e.g. 15 min" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Calories</label>
                  <input value={form.calories} onChange={(e) => update("calories", e.target.value)} placeholder="e.g. 480 kcal" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Ingredients (optional)</label>
                <textarea value={form.ingredients} onChange={(e) => update("ingredients", e.target.value)} rows={2} className={`${inputClass} resize-none`} placeholder="Comma-separated ingredients" />
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-white/45">Highlights</p>
                <div className="flex flex-wrap gap-3">
                  {(["popular", "recommended", "chefSpecial"] as const).map((key) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60 transition-colors hover:border-gold/20">
                      <input type="checkbox" checked={form[key]} onChange={(e) => update(key, e.target.checked)} className="rounded border-gold/30" />
                      {key === "chefSpecial" ? "Chef's Special" : key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-white/45">Dietary</p>
                <div className="flex flex-wrap gap-3">
                  {(["vegetarian", "vegan", "glutenFree", "halal", "spicy"] as const).map((key) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60 transition-colors hover:border-gold/20">
                      <input type="checkbox" checked={form[key]} onChange={(e) => update(key, e.target.checked)} className="rounded border-gold/30" />
                      {key === "glutenFree" ? "Gluten-Free" : key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
            </div>

            <div className="border-t border-gold/10 p-5">
              <button type="button" onClick={onSave} disabled={saving} className="menu-btn-primary w-full disabled:opacity-60">
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

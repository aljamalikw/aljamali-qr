"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { categories } from "@/lib/saffron-garden/menu-data";
import type { MenuCategory } from "@/lib/saffron-garden/types";
import type { MenuFormMode, MenuItemFormData } from "@/lib/dashboard/menu/types";
import {
  createEmptyFormData,
  validateFormData,
} from "@/lib/dashboard/menu/utils";
import { MenuIcon } from "./icons/MenuIcons";

interface MenuItemFormDrawerProps {
  open: boolean;
  mode: MenuFormMode;
  initialData: MenuItemFormData;
  onSave: (data: MenuItemFormData) => void;
  onClose: () => void;
}

const inputClass =
  "w-full rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45";

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-black/20 px-4 py-3 transition-colors hover:border-gold/15">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gold/30 bg-black text-gold focus:ring-gold/30"
      />
      <span className="text-sm text-white/70">{label}</span>
    </label>
  );
}

export function MenuItemFormDrawer({
  open,
  mode,
  initialData,
  onSave,
  onClose,
}: MenuItemFormDrawerProps) {
  const [form, setForm] = useState<MenuItemFormData>(initialData);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(initialData);
      setError(null);
    }
  }, [open, initialData]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const updateField = <K extends keyof MenuItemFormData>(
    key: K,
    value: MenuItemFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("image", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateFormData(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave(form);
  };

  const title = mode === "create" ? "Add Menu Item" : "Edit Menu Item";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="menu-drawer fixed inset-y-0 end-0 z-50 flex w-full max-w-lg flex-col border-s border-gold/10 bg-surface shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-form-title"
          >
            <div className="flex items-center justify-between border-b border-gold/10 px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="menu-form-title"
                  className="font-serif text-xl font-bold text-white"
                >
                  {title}
                </h2>
                <p className="mt-0.5 text-xs text-white/40">
                  {mode === "create"
                    ? "Add a new dish to your digital menu"
                    : "Update dish details and availability"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <MenuIcon name="close" className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                {/* Image upload */}
                <FormField label="Food Image">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gold/20 bg-black/20 py-8 transition-all duration-300 hover:border-gold/40 hover:bg-gold/[0.03]"
                  >
                    {form.image ? (
                      <div className="relative h-40 w-full">
                        <Image
                          src={form.image}
                          alt="Preview"
                          fill
                          className="object-cover"
                          unoptimized={form.image.startsWith("data:")}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="flex items-center gap-2 text-sm text-white">
                            <MenuIcon name="upload" className="h-4 w-4" />
                            Change image
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <MenuIcon name="image" className="h-10 w-10 text-gold/40" />
                        <p className="mt-3 text-sm font-medium text-white/60">
                          Click to upload food photo
                        </p>
                        <p className="mt-1 text-xs text-white/35">
                          PNG, JPG up to 5MB (mock upload)
                        </p>
                      </>
                    )}
                  </button>
                </FormField>

                <FormField label="Dish Name">
                  <input
                    type="text"
                    value={form.nameEn}
                    onChange={(e) => updateField("nameEn", e.target.value)}
                    placeholder="e.g. Grilled Hammour"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Arabic Dish Name">
                  <input
                    type="text"
                    value={form.nameAr}
                    onChange={(e) => updateField("nameAr", e.target.value)}
                    placeholder="e.g. همور مشوي"
                    dir="rtl"
                    className={`${inputClass} font-arabic`}
                  />
                </FormField>

                <FormField label="Description">
                  <textarea
                    value={form.descriptionEn}
                    onChange={(e) => updateField("descriptionEn", e.target.value)}
                    placeholder="Describe the dish..."
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </FormField>

                <FormField label="Arabic Description">
                  <textarea
                    value={form.descriptionAr}
                    onChange={(e) => updateField("descriptionAr", e.target.value)}
                    placeholder="وصف الطبق..."
                    dir="rtl"
                    rows={3}
                    className={`${inputClass} resize-none font-arabic`}
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Category">
                    <select
                      value={form.category}
                      onChange={(e) =>
                        updateField("category", e.target.value as MenuCategory)
                      }
                      className={inputClass}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label.en}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Price (KD)">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={form.price}
                      onChange={(e) => updateField("price", e.target.value)}
                      placeholder="0.000"
                      className={inputClass}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Preparation Time (min)">
                    <input
                      type="number"
                      min="0"
                      value={form.preparationTime}
                      onChange={(e) =>
                        updateField("preparationTime", e.target.value)
                      }
                      placeholder="20"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Calories">
                    <input
                      type="number"
                      min="0"
                      value={form.calories}
                      onChange={(e) => updateField("calories", e.target.value)}
                      placeholder="350"
                      className={inputClass}
                    />
                  </FormField>
                </div>

                <div>
                  <p className={labelClass}>Dietary & Status</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <CheckboxField
                      label="Vegetarian"
                      checked={form.vegetarian}
                      onChange={(v) => updateField("vegetarian", v)}
                    />
                    <CheckboxField
                      label="Spicy"
                      checked={form.spicy}
                      onChange={(v) => updateField("spicy", v)}
                    />
                    <CheckboxField
                      label="Chef's Special"
                      checked={form.chefSpecial}
                      onChange={(v) => updateField("chefSpecial", v)}
                    />
                    <CheckboxField
                      label="Available"
                      checked={form.available}
                      onChange={(v) => updateField("available", v)}
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex gap-3 border-t border-gold/10 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="menu-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="menu-btn-primary flex-1">
                  Save
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

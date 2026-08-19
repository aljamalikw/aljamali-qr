"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CATEGORY_TEMPLATE_GROUPS,
  type CategoryTemplate,
} from "@/lib/categories/category-templates";

interface CategoryTemplatePickerProps {
  open: boolean;
  existingNames: string[];
  onSelectTemplate: (template: CategoryTemplate) => void;
  onCreateCustom: () => void;
  onClose: () => void;
}

export function CategoryTemplatePicker({
  open,
  existingNames,
  onSelectTemplate,
  onCreateCustom,
  onClose,
}: CategoryTemplatePickerProps) {
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      const t = setTimeout(() => searchRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const lowerExisting = useMemo(
    () => new Set(existingNames.map((n) => n.toLowerCase().trim())),
    [existingNames],
  );

  const query = search.toLowerCase().trim();

  const filteredGroups = useMemo(() => {
    if (!query) return CATEGORY_TEMPLATE_GROUPS;
    return CATEGORY_TEMPLATE_GROUPS.map((g) => ({
      ...g,
      templates: g.templates.filter(
        (t) =>
          t.nameEn.toLowerCase().includes(query) ||
          t.nameAr.includes(query),
      ),
    })).filter((g) => g.templates.length > 0);
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-3 top-[5%] bottom-[5%] z-50 mx-auto flex max-w-2xl flex-col overflow-hidden rounded-2xl border border-gold/15 bg-surface-elevated sm:inset-x-4 sm:top-[8%] sm:bottom-[8%]"
            role="dialog"
            aria-modal="true"
            aria-label="Choose a category"
          >
            {/* Header */}
            <div className="shrink-0 border-b border-gold/10 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
              <h2 className="font-serif text-xl font-bold text-white sm:text-2xl">
                Choose a Category
              </h2>
              <p className="mt-1 text-sm text-white/45">
                Start with a popular category or create your own.
              </p>

              {/* Search */}
              <div className="relative mt-4">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                  🔍
                </span>
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories…"
                  className="w-full rounded-xl border border-gold/15 bg-black/30 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15"
                  aria-label="Search categories"
                />
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              {/* Custom category button */}
              <button
                type="button"
                onClick={onCreateCustom}
                className="mb-5 flex w-full items-center gap-3 rounded-xl border border-dashed border-gold/25 bg-gold/5 px-4 py-3.5 text-left text-sm font-medium text-gold transition-colors hover:border-gold/40 hover:bg-gold/10"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-lg">
                  ✏️
                </span>
                <span>+ Create Custom Category</span>
              </button>

              {filteredGroups.length === 0 ? (
                <p className="py-8 text-center text-sm text-white/40">
                  No categories match &ldquo;{search}&rdquo;
                </p>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.label} className="mb-5">
                    <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-gold/60">
                      {group.label}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {group.templates.map((t) => {
                        const exists = lowerExisting.has(
                          t.nameEn.toLowerCase(),
                        );
                        return (
                          <button
                            key={t.nameEn}
                            type="button"
                            onClick={() => onSelectTemplate(t)}
                            className="group/tpl relative flex items-center gap-2.5 rounded-xl border border-gold/10 bg-black/20 px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-gold/25 hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-gold/20"
                            aria-label={`${t.nameEn} – ${t.nameAr}`}
                          >
                            <span className="shrink-0 text-xl">{t.icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white">
                                {t.nameEn}
                              </p>
                              <p
                                className="truncate text-xs text-white/40"
                                dir="rtl"
                              >
                                {t.nameAr}
                              </p>
                            </div>
                            {exists && (
                              <span className="absolute -top-1.5 -right-1.5 rounded-full bg-gold/80 px-1.5 py-0.5 text-[9px] font-bold text-black">
                                EXISTS
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-gold/10 px-5 py-3 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="menu-btn-secondary w-full"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

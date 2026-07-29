"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { PublicCategoryGroup, PublicLanguage } from "@/lib/public-menu/types";

interface FloatingCategoryNavProps {
  groups: PublicCategoryGroup[];
  lang: PublicLanguage;
  onSelect: (categoryId: string) => void;
}

function getCategoryLabel(group: PublicCategoryGroup, lang: PublicLanguage): string {
  return lang === "ar" ? group.category.nameAr.trim() || group.category.nameEn : group.category.nameEn;
}

export function FloatingCategoryNav({ groups, lang, onSelect }: FloatingCategoryNavProps) {
  const [open, setOpen] = useState(false);

  if (groups.length === 0) return null;

  return (
    <div className="fixed bottom-5 start-5 z-30 lg:hidden">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="mb-3 max-h-[55vh] w-56 overflow-y-auto rounded-3xl border border-gold/25 bg-black/90 p-2 shadow-2xl backdrop-blur-xl"
          >
            {groups.map((group) => (
              <button
                key={group.category.id}
                type="button"
                onClick={() => {
                  onSelect(group.category.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-sm text-white/70 transition-colors hover:bg-gold/10 hover:text-gold"
              >
                <span>{group.category.icon}</span>
                <span className="min-w-0 flex-1 truncate">{getCategoryLabel(group, lang)}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.92 }}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold text-2xl text-black shadow-xl shadow-gold/25"
        aria-label="Quick category navigation"
        aria-expanded={open}
      >
        {open ? "✕" : "☰"}
      </motion.button>
    </div>
  );
}

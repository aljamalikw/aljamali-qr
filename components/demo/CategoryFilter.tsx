"use client";

import type { Language, MenuCategory } from "@/lib/saffron-garden/types";
import { categories, t } from "@/lib/saffron-garden/menu-data";

interface CategoryFilterProps {
  lang: Language;
  active: MenuCategory | "all";
  onChange: (category: MenuCategory | "all") => void;
  counts: Record<MenuCategory | "all", number>;
}

export function CategoryFilter({
  lang,
  active,
  onChange,
  counts,
}: CategoryFilterProps) {
  return (
    <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
          active === "all"
            ? "bg-gold text-black shadow-lg shadow-gold/20"
            : "border border-white/10 bg-surface text-white/70 hover:border-gold/30 hover:text-gold"
        }`}
      >
        {t("allCategories", lang)} ({counts.all})
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onChange(cat.id)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
            active === cat.id
              ? "bg-gold text-black shadow-lg shadow-gold/20"
              : "border border-white/10 bg-surface text-white/70 hover:border-gold/30 hover:text-gold"
          }`}
        >
          <span className="me-1.5">{cat.icon}</span>
          {cat.label[lang]} ({counts[cat.id]})
        </button>
      ))}
    </div>
  );
}

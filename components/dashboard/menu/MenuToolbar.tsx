"use client";

import { categories } from "@/lib/saffron-garden/menu-data";
import type { MenuCategory } from "@/lib/saffron-garden/types";
import type { AvailabilityFilter, MenuSortOption } from "@/lib/dashboard/menu/types";
import { MenuIcon } from "./icons/MenuIcons";

interface MenuToolbarProps {
  search: string;
  category: MenuCategory | "all";
  availability: AvailabilityFilter;
  sort: MenuSortOption;
  totalCount: number;
  filteredCount: number;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: MenuCategory | "all") => void;
  onAvailabilityChange: (value: AvailabilityFilter) => void;
  onSortChange: (value: MenuSortOption) => void;
  onAdd: () => void;
}

const selectClass =
  "rounded-xl border border-gold/15 bg-surface px-3 py-2.5 text-sm text-white transition-colors focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

export function MenuToolbar({
  search,
  category,
  availability,
  sort,
  totalCount,
  filteredCount,
  onSearchChange,
  onCategoryChange,
  onAvailabilityChange,
  onSortChange,
  onAdd,
}: MenuToolbarProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
            Menu Management
          </h1>
          <p className="mt-1 text-sm text-white/45">
            {filteredCount} of {totalCount} dishes
            {filteredCount !== totalCount ? " matching filters" : " in your menu"}
          </p>
        </div>

        <button type="button" onClick={onAdd} className="menu-btn-primary shrink-0">
          <MenuIcon name="plus" className="h-4 w-4" />
          Add Menu Item
        </button>
      </div>

      <div className="dashboard-card rounded-2xl p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <MenuIcon
              name="search"
              className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search dishes by name or category..."
              className="w-full rounded-xl border border-gold/15 bg-black/30 py-2.5 pe-4 ps-10 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:contents">
            <select
              value={category}
              onChange={(e) =>
                onCategoryChange(e.target.value as MenuCategory | "all")
              }
              className={selectClass}
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label.en}
                </option>
              ))}
            </select>

            <select
              value={availability}
              onChange={(e) =>
                onAvailabilityChange(e.target.value as AvailabilityFilter)
              }
              className={selectClass}
              aria-label="Filter by availability"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>

            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as MenuSortOption)}
              className={selectClass}
              aria-label="Sort menu items"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price">Price</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

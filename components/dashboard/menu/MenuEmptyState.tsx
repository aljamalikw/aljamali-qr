"use client";

import { MenuIcon } from "./icons/MenuIcons";

interface MenuEmptyStateProps {
  onAdd: () => void;
}

export function MenuEmptyState({ onAdd }: MenuEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-gold/15 bg-surface-elevated text-gold/40">
          <MenuIcon name="empty" className="h-16 w-16" />
        </div>
      </div>

      <h2 className="mt-8 font-serif text-2xl font-bold text-white sm:text-3xl">
        No menu items yet
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-white/45 sm:text-base">
        Start building your digital menu by adding your first dish. Guests will
        see it instantly on your QR menu.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="menu-btn-primary mt-8"
      >
        <MenuIcon name="plus" className="h-4 w-4" />
        Add First Dish
      </button>
    </div>
  );
}

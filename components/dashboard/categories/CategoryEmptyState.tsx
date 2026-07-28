"use client";

interface CategoryEmptyStateProps {
  onAdd: () => void;
}

export function CategoryEmptyState({ onAdd }: CategoryEmptyStateProps) {
  return (
    <div className="dashboard-card flex flex-col items-center rounded-2xl px-6 py-20 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-gold/15 bg-surface-elevated text-5xl">
          📂
        </div>
      </div>
      <h2 className="mt-8 font-serif text-2xl font-bold text-white">No categories yet</h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/45">
        Organize your menu into beautiful sections — starters, mains, desserts, and more.
      </p>
      <button type="button" onClick={onAdd} className="dashboard-cta-primary mt-8">
        + Create First Category
      </button>
    </div>
  );
}

"use client";

import { EmptyState } from "@/components/ui/EmptyState";

interface CategoryEmptyStateProps {
  onAdd: () => void;
}

export function CategoryEmptyState({ onAdd }: CategoryEmptyStateProps) {
  return (
    <EmptyState
      icon="📂"
      title="No categories yet"
      description="Organize your menu into beautiful sections — starters, mains, desserts, and more."
      actionLabel="+ Create First Category"
      onAction={onAdd}
    />
  );
}

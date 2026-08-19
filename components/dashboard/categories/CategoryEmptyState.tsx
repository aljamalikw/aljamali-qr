"use client";

import { EmptyState } from "@/components/ui/EmptyState";

interface CategoryEmptyStateProps {
  onAdd: () => void;
}

export function CategoryEmptyState({ onAdd }: CategoryEmptyStateProps) {
  return (
    <EmptyState
      icon="📂"
      title="Organize your menu into sections"
      description="Choose a category to get started."
      actionLabel="+ Add Category"
      onAction={onAdd}
    />
  );
}

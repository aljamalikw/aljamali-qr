"use client";

import { EmptyState } from "@/components/ui/EmptyState";

interface MenuEmptyStateProps {
  onAdd: () => void;
}

export function MenuEmptyState({ onAdd }: MenuEmptyStateProps) {
  return (
    <EmptyState
      icon="🍽️"
      title="Your menu is empty"
      description="Add your first dish to start building a premium bilingual menu your guests will love."
      actionLabel="+ Add First Menu Item"
      onAction={onAdd}
    />
  );
}

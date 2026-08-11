"use client";

import { EmptyState } from "@/components/ui/EmptyState";

interface QrEmptyStateProps {
  onCreate: () => void;
}

export function QrEmptyState({ onCreate }: QrEmptyStateProps) {
  return (
    <EmptyState
      icon="▦"
      title="No QR codes yet"
      description="Create your first scannable QR code for tables, delivery, or custom zones."
      actionLabel="+ Create First QR Code"
      onAction={onCreate}
    />
  );
}

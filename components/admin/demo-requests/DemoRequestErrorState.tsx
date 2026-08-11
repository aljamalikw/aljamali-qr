"use client";

import { ErrorCard } from "@/components/ui/ErrorCard";

interface DemoRequestErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function DemoRequestErrorState({
  message,
  onRetry,
}: DemoRequestErrorStateProps) {
  return (
    <ErrorCard
      title="Unable to load demo requests"
      message={message}
      onRetry={onRetry}
    />
  );
}

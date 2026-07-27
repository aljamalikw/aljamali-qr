"use client";

import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";

interface AdminPlaceholderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function AdminPlaceholder({
  title,
  description,
  children,
}: AdminPlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-white/45">{description}</p>
      </div>
      <DashboardCard className="p-6 sm:p-8">
        {children ?? (
          <p className="text-sm text-white/50">
            This module is ready for the next implementation phase.
          </p>
        )}
      </DashboardCard>
    </div>
  );
}

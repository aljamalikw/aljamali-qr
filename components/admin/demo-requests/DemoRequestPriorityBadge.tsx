"use client";

import type { DemoRequestPriority } from "@/lib/demo-requests/types";
import { getPriorityBadgeClass } from "@/lib/demo-requests/utils";

export function DemoRequestPriorityBadge({
  priority,
}: {
  priority: DemoRequestPriority;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityBadgeClass(priority)}`}
    >
      {priority}
    </span>
  );
}

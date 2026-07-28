"use client";

import type { DemoRequestStatus } from "@/lib/demo-requests/types";
import {
  getDemoRequestStatusBadgeClass,
  getDemoRequestStatusDotClass,
} from "@/lib/demo-requests/utils";

export function DemoRequestStatusBadge({
  status,
  archived = false,
}: {
  status: DemoRequestStatus;
  archived?: boolean;
}) {
  const display = archived ? "Archived" : status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getDemoRequestStatusBadgeClass(display)}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${getDemoRequestStatusDotClass(display)}`}
      />
      {display}
    </span>
  );
}

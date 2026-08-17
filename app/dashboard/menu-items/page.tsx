import { Suspense } from "react";
import { MenuManagement } from "@/components/dashboard/menu/MenuManagement";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function MenuItemsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <TableSkeleton rows={6} />
        </div>
      }
    >
      <MenuManagement />
    </Suspense>
  );
}

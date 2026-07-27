import { Suspense } from "react";
import { AdminOwnersPage } from "@/components/admin/modules/AdminOwnersPage";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function Page() {
  return (
    <Suspense fallback={<TableSkeleton rows={6} />}>
      <AdminOwnersPage />
    </Suspense>
  );
}

import { Suspense } from "react";
import { AdminSupportPage } from "@/components/admin/modules/AdminSupportPage";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function Page() {
  return (
    <Suspense fallback={<TableSkeleton rows={6} />}>
      <AdminSupportPage />
    </Suspense>
  );
}

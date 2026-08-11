interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton-shimmer rounded-lg ${className}`} aria-hidden="true" />;
}

export function StatCardSkeleton() {
  return (
    <div className="dashboard-card rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-11 w-11 rounded-xl" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4 sm:p-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-white/5 bg-black/20 p-4"
        >
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="hidden h-6 w-16 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/** Compact list placeholders for dashboard/admin side panels. */
export function ListPanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/5 bg-black/20 px-3 py-3"
        >
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function AuthCardSkeleton() {
  return (
    <div
      className="auth-glass-card rounded-2xl p-6 sm:p-8"
      aria-busy="true"
      aria-label="Loading authentication"
    >
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto h-4 w-64 max-w-full" />
        </div>
        <FormSkeleton />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function AuthPageSkeleton() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6"
      aria-busy="true"
      aria-label="Loading authentication"
    >
      <div className="w-full max-w-md">
        <AuthCardSkeleton />
      </div>
    </div>
  );
}

export function DashboardShellSkeleton() {
  return (
    <div
      className="min-h-screen bg-background"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <aside className="dashboard-sidebar fixed inset-y-0 start-0 z-50 hidden w-[260px] lg:block">
        <div className="flex h-full flex-col px-3 py-5">
          <div className="flex items-center gap-3 border-b border-gold/10 px-1 pb-5">
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="space-y-1 px-0 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </div>
          <div className="mt-auto space-y-1 border-t border-gold/10 pt-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="hidden h-10 w-full rounded-xl lg:block" />
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:[margin-inline-start:260px]">
        <header className="dashboard-topbar sticky top-0 z-30 flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl lg:hidden" />
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="hidden h-3 w-44 sm:block" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="hidden items-center gap-3 rounded-xl border border-gold/15 bg-surface-elevated/80 px-3 py-1.5 sm:flex">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="hidden min-w-0 space-y-1.5 md:block">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-9 w-9 rounded-full sm:hidden" />
          </div>
        </header>

        <main className="px-4 pb-10 pt-2 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-8">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-64 max-w-full" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </main>
      </div>
    </div>
  );
}

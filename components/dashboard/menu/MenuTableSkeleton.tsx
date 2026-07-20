export function MenuTableSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4 sm:p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-white/5 bg-black/20 p-4"
        >
          <div className="h-12 w-12 shrink-0 rounded-xl bg-white/5 sm:h-14 sm:w-14" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded-lg bg-white/5" />
            <div className="h-3 w-1/4 rounded-lg bg-white/5" />
          </div>
          <div className="hidden h-4 w-16 rounded-lg bg-white/5 sm:block" />
          <div className="hidden h-6 w-20 rounded-full bg-white/5 md:block" />
        </div>
      ))}
    </div>
  );
}

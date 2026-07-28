"use client";

export function DemoRequestEmptyState({
  hasFilters,
}: {
  hasFilters: boolean;
}) {
  return (
    <div className="dashboard-card flex flex-col items-center rounded-2xl px-6 py-20 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-gold/15 bg-surface-elevated text-gold/60">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-10 w-10"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
          </svg>
        </div>
      </div>
      <h2 className="mt-8 font-serif text-2xl font-bold text-white">
        {hasFilters ? "No matching demo requests" : "No demo requests yet."}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-white/45">
        {hasFilters
          ? "Try adjusting your search or filters to find a request."
          : "When restaurants schedule demonstrations they will appear here."}
      </p>
    </div>
  );
}

"use client";

interface QrEmptyStateProps {
  onCreate: () => void;
}

export function QrEmptyState({ onCreate }: QrEmptyStateProps) {
  return (
    <div className="dashboard-card flex flex-col items-center rounded-2xl px-6 py-20 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-gold/15 bg-surface-elevated text-4xl text-gold/50">
          ▦
        </div>
      </div>
      <h2 className="mt-8 font-serif text-2xl font-bold text-white">
        No QR codes yet
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/45">
        Create your first scannable QR code for tables, delivery, or custom zones.
      </p>
      <button type="button" onClick={onCreate} className="dashboard-cta-primary mt-8">
        + Create First QR Code
      </button>
    </div>
  );
}

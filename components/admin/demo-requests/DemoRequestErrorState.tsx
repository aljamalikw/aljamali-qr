"use client";

interface DemoRequestErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function DemoRequestErrorState({
  message,
  onRetry,
}: DemoRequestErrorStateProps) {
  return (
    <div className="dashboard-card flex flex-col items-center rounded-2xl px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      </div>
      <h2 className="mt-6 font-serif text-xl font-bold text-white">
        Unable to load demo requests
      </h2>
      <p className="mt-2 max-w-md text-sm text-white/50">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="menu-btn-primary mt-6"
      >
        Try Again
      </button>
    </div>
  );
}

"use client";

type ErrorCardProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

/**
 * Shared error card with consistent icon, typography, and retry action.
 */
export function ErrorCard({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try Again",
  className = "",
}: ErrorCardProps) {
  return (
    <div
      className={`dashboard-card flex flex-col items-center rounded-2xl px-6 py-14 text-center sm:py-16 ${className}`}
      role="alert"
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-7 w-7"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      </div>
      <h2 className="mt-5 font-serif text-xl font-bold text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-white/50">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="menu-btn-primary mt-6">
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

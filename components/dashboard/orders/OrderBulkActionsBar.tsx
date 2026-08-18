"use client";

interface OrderBulkActionsBarProps {
  selectedCount: number;
  bulkLoading: boolean;
  onAcceptSelected: () => void;
  onCancelSelected: () => void;
  onClearSelection: () => void;
}

export function OrderBulkActionsBar({
  selectedCount,
  bulkLoading,
  onAcceptSelected,
  onCancelSelected,
  onClearSelection,
}: OrderBulkActionsBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      role="region"
      aria-label="Bulk order actions"
    >
      <p className="text-sm font-medium text-white">
        <span className="text-gold">{selectedCount}</span>{" "}
        {selectedCount === 1 ? "order" : "orders"} selected
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onAcceptSelected}
          disabled={bulkLoading}
          className="menu-btn-primary !px-3 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          Accept Selected
        </button>
        <button
          type="button"
          onClick={onCancelSelected}
          disabled={bulkLoading}
          className="menu-btn-danger !px-3 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel Selected
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          disabled={bulkLoading}
          className="menu-btn-secondary !px-3 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

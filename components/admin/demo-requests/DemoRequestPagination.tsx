"use client";

interface DemoRequestPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function DemoRequestPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: DemoRequestPaginationProps) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-white/45">
        Showing {start}–{end} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="menu-btn-secondary !px-3 !py-2 text-sm disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <span className="min-w-[5rem] text-center text-sm text-white/60">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="menu-btn-secondary !px-3 !py-2 text-sm disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

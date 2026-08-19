"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  exportFormatLoadingLabel,
  exportFormatSuccessLabel,
  runExport,
} from "@/lib/export/export-data";
import type { ExportDataset, ExportFormat } from "@/lib/export/types";
import { EXPORT_FORMAT_LABELS } from "@/lib/export/types";

type ExportMenuProps = {
  /** Builds the dataset from current page filters at export time. */
  getDataset: () => ExportDataset | Promise<ExportDataset>;
  /** Button label prefix (default: Export). */
  label?: string;
  /** Optional gate per format (e.g. BI Enterprise Excel/PDF). */
  isFormatAllowed?: (format: ExportFormat) => boolean;
  disabled?: boolean;
  className?: string;
  onSuccess?: (format: ExportFormat, rowCount: number) => void;
  onError?: (message: string) => void;
  onEmpty?: () => void;
};

const FORMATS: ExportFormat[] = ["xlsx", "csv", "pdf", "docx"];

export function ExportMenu({
  getDataset,
  label = "Export",
  isFormatAllowed,
  disabled = false,
  className = "",
  onSuccess,
  onError,
  onEmpty,
}: ExportMenuProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (disabled || loadingFormat) return;
      if (isFormatAllowed && !isFormatAllowed(format)) return;

      const dataset = await Promise.resolve(getDataset());
      if (dataset.rows.length === 0) {
        onEmpty?.();
        setOpen(false);
        return;
      }

      setLoadingFormat(format);
      setOpen(false);
      try {
        const result = await runExport(format, dataset);
        if (!result.ok) {
          if (result.empty) {
            onEmpty?.();
          } else {
            onError?.(result.message);
          }
          return;
        }
        onSuccess?.(format, dataset.rows.length);
        void exportFormatSuccessLabel(format);
      } catch {
        onError?.("Could not generate export. Please try again.");
      } finally {
        setLoadingFormat(null);
      }
    },
    [
      disabled,
      getDataset,
      isFormatAllowed,
      loadingFormat,
      onEmpty,
      onError,
      onSuccess,
    ],
  );

  const allowedFormats = FORMATS.filter(
    (format) => !isFormatAllowed || isFormatAllowed(format),
  );

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        className="menu-btn-secondary shrink-0 inline-flex items-center gap-2"
        disabled={disabled || Boolean(loadingFormat)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Export data"
        onClick={() => setOpen((value) => !value)}
      >
        {loadingFormat ? (
          <>
            <span className="inline-block h-3 w-3 animate-spin rounded-full border border-gold/30 border-t-gold" />
            {exportFormatLoadingLabel(loadingFormat)}
          </>
        ) : (
          <>
            {label}
            <span aria-hidden className="text-white/45">
              ▾
            </span>
          </>
        )}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Export format"
          className="absolute right-0 top-[calc(100%+6px)] z-40 min-w-[180px] overflow-hidden rounded-xl border border-gold/15 bg-[#121212] py-1 shadow-xl"
        >
          {allowedFormats.map((format) => (
            <button
              key={format}
              type="button"
              role="menuitem"
              className="flex w-full px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-gold/10 hover:text-gold focus:bg-gold/10 focus:text-gold focus:outline-none"
              onClick={() => void handleExport(format)}
            >
              {EXPORT_FORMAT_LABELS[format]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { exportFormatSuccessLabel };

"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: ReactNode;
  /** Shown under the title when `scrollable` is enabled (e.g. owner name). */
  headerSubtitle?: ReactNode;
  confirmLabel?: string;
  loadingConfirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
  hideConfirmButton?: boolean;
  /** Tall forms: viewport-bound panel with sticky header/footer and scrollable body. */
  scrollable?: boolean;
  /** Wider panel for form-heavy dialogs. */
  size?: "md" | "lg";
  /** Show an accessible close control in the header (recommended with `scrollable`). */
  showCloseButton?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SIZE_CLASS = {
  md: "max-w-md",
  lg: "max-w-lg",
} as const;

/**
 * Accessible confirm dialog with focus trap, Escape, and labelled title/description.
 * Pass `scrollable` for multi-field forms that must stay within the viewport.
 */
export function ConfirmModal({
  open,
  title,
  description,
  headerSubtitle,
  confirmLabel = "Confirm",
  loadingConfirmLabel,
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  hideConfirmButton = false,
  scrollable = false,
  size = "md",
  showCloseButton = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    previouslyFocused.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;

    const panel = panelRef.current;
    const focusables = panel
      ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      : [];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const focusTimer = window.setTimeout(() => first?.focus(), 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        event.preventDefault();
        onCancelRef.current();
        return;
      }
      if (event.key !== "Tab" || focusables.length === 0) return;

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open, loading]);

  const footer = (
    <div
      className={`flex flex-col-reverse gap-3 sm:flex-row ${
        scrollable ? "" : "mt-8"
      }`}
    >
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className={`menu-btn-secondary disabled:opacity-50 ${
          hideConfirmButton ? "w-full" : "flex-1"
        }`}
      >
        {cancelLabel}
      </button>
      {!hideConfirmButton ? (
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 disabled:opacity-50 ${
            variant === "danger" ? "menu-btn-danger" : "menu-btn-primary"
          }`}
        >
          {loading ? loadingConfirmLabel ?? "Processing..." : confirmLabel}
        </button>
      ) : null}
    </div>
  );

  const panelBorderClass =
    variant === "danger" ? "border-red-500/20" : "border-gold/15";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={loading ? undefined : onCancel}
            aria-hidden="true"
          />
          {scrollable ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            >
              <motion.div
                ref={panelRef}
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className={`flex max-h-[min(calc(100vh-2rem),56rem)] w-full flex-col overflow-hidden rounded-2xl border bg-surface-elevated shadow-2xl ${SIZE_CLASS[size]} ${panelBorderClass}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
                  <div className="min-w-0 text-start">
                    <h2
                      id={titleId}
                      className="font-serif text-lg font-bold text-white sm:text-xl"
                    >
                      {title}
                    </h2>
                    {headerSubtitle ? (
                      <div className="mt-1 text-sm text-white/55">
                        {headerSubtitle}
                      </div>
                    ) : null}
                  </div>
                  {showCloseButton ? (
                    <button
                      type="button"
                      onClick={onCancel}
                      disabled={loading}
                      className="shrink-0 rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-50"
                      aria-label="Close dialog"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
                <div
                  id={descriptionId}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-sm leading-relaxed text-white/50 sm:px-6"
                >
                  {description}
                </div>
                <div className="shrink-0 border-t border-white/10 px-5 py-4 sm:px-6">
                  {footer}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={`fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[calc(100vh-2rem)] -translate-y-1/2 overflow-y-auto rounded-2xl border bg-surface-elevated p-6 sm:p-8 ${SIZE_CLASS[size]} ${panelBorderClass}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
            >
              <h2
                id={titleId}
                className="text-center font-serif text-xl font-bold text-white"
              >
                {title}
              </h2>
              <div
                id={descriptionId}
                className="mt-3 text-center text-sm leading-relaxed text-white/50"
              >
                {description}
              </div>
              {footer}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { getQrTypeLabel } from "@/lib/dashboard/qr/seed-data";
import type { QrCodeItem } from "@/lib/dashboard/qr/types";
import {
  formatLastScan,
  formatQrDate,
} from "@/lib/dashboard/qr/utils";
import { QrPreview } from "./QrPreview";
import { QrIcon } from "./icons/QrIcons";

interface QrDetailsDrawerProps {
  item: QrCodeItem | null;
  onClose: () => void;
  onDownloadPng: (item: QrCodeItem) => void;
  onDownloadSvg: (item: QrCodeItem) => void;
  onPrint: (item: QrCodeItem) => void;
  onCopyLink: (item: QrCodeItem) => void;
}

export function QrDetailsDrawer({
  item,
  onClose,
  onDownloadPng,
  onDownloadSvg,
  onPrint,
  onCopyLink,
}: QrDetailsDrawerProps) {
  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            initial={{ opacity: 0, x: "100%", scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: "100%", scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="menu-drawer fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col border-s border-gold/10 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-details-title"
          >
            <div className="flex items-center justify-between border-b border-gold/10 px-5 py-4">
              <div>
                <h2 id="qr-details-title" className="font-serif text-xl font-bold text-white">
                  {item.name}
                </h2>
                <p className="text-xs text-white/45">{getQrTypeLabel(item.type)}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <QrIcon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              <div className="flex justify-center">
                <div className="qr-frame rounded-3xl p-1">
                  <div className="rounded-[22px] bg-white p-6">
                    <QrPreview value={item.url} size={200} />
                  </div>
                </div>
              </div>

              <p className="mt-4 truncate text-center text-xs text-white/40">{item.url}</p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onDownloadPng(item)}
                  className="menu-btn-secondary text-xs"
                >
                  <QrIcon name="download" className="h-4 w-4" />
                  PNG
                </button>
                <button
                  type="button"
                  onClick={() => onDownloadSvg(item)}
                  className="menu-btn-secondary text-xs transition-transform hover:-translate-y-0.5"
                >
                  <QrIcon name="download" className="h-4 w-4" />
                  SVG
                </button>
                <button
                  type="button"
                  onClick={() => onPrint(item)}
                  className="menu-btn-secondary text-xs"
                >
                  <QrIcon name="print" className="h-4 w-4" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => onCopyLink(item)}
                  className="menu-btn-secondary text-xs"
                >
                  <QrIcon name="link" className="h-4 w-4" />
                  Copy Link
                </button>
              </div>

              <div className="mt-8 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gold">
                  Statistics
                </h3>
                {[
                  { label: "Total scans", value: item.totalScans.toLocaleString() },
                  { label: "Today's scans", value: String(item.todayScans) },
                  { label: "Last scanned", value: formatLastScan(item.lastScan) },
                  { label: "Created", value: formatQrDate(item.createdAt) },
                  { label: "Status", value: item.status === "active" ? "Active" : "Inactive" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3"
                  >
                    <span className="text-sm text-white/50">{stat.label}</span>
                    <span className="font-medium text-white">{stat.value}</span>
                  </div>
                ))}
              </div>

              {item.description && (
                <div className="mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gold">
                    Description
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">
                    {item.description}
                  </p>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

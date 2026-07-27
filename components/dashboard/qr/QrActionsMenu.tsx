"use client";

import { useEffect, useRef, useState } from "react";
import type { QrCodeItem } from "@/lib/dashboard/qr/types";
import { QrIcon } from "./icons/QrIcons";

export type QrAction =
  | "view"
  | "rename"
  | "duplicate"
  | "download-png"
  | "download-pdf"
  | "print"
  | "copy-link"
  | "toggle-status"
  | "toggle-archive"
  | "delete";

interface QrActionsMenuProps {
  item: QrCodeItem;
  onAction: (action: QrAction, item: QrCodeItem) => void;
}

const menuItems: { action: QrAction; label: string; icon: Parameters<typeof QrIcon>[0]["name"]; danger?: boolean }[] = [
  { action: "view", label: "View", icon: "view" },
  { action: "rename", label: "Rename", icon: "rename" },
  { action: "duplicate", label: "Duplicate", icon: "duplicate" },
  { action: "download-png", label: "Download PNG", icon: "download" },
  { action: "download-pdf", label: "Download SVG", icon: "download" },
  { action: "print", label: "Print", icon: "print" },
  { action: "copy-link", label: "Copy Link", icon: "link" },
  { action: "toggle-status", label: "Enable / Disable", icon: "toggle" },
  { action: "toggle-archive", label: "Archive", icon: "duplicate" },
  { action: "delete", label: "Delete", icon: "delete", danger: true },
];

export function QrActionsMenu({ item, onAction }: QrActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative flex items-center gap-1" ref={ref}>
      <button
        type="button"
        onClick={() => onAction("view", item)}
        className="rounded-lg p-2 text-white/45 transition-colors hover:bg-gold/10 hover:text-gold"
        aria-label="View QR code"
        title="View"
      >
        <QrIcon name="view" className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-lg p-2 text-white/45 transition-colors hover:bg-gold/10 hover:text-gold"
        aria-label="More actions"
        aria-expanded={open}
      >
        <QrIcon name="more" className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute end-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-gold/15 bg-surface-elevated py-1 shadow-2xl">
          {menuItems.map((mi) => (
            <button
              key={mi.action}
              type="button"
              onClick={() => {
                setOpen(false);
                onAction(mi.action, item);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/5 ${
                mi.danger ? "text-red-400 hover:text-red-300" : "text-white/70 hover:text-gold"
              }`}
            >
              <QrIcon name={mi.icon} className="h-4 w-4 shrink-0" />
              {mi.action === "toggle-status"
                ? item.status === "active"
                  ? "Disable"
                  : "Enable"
                : mi.action === "toggle-archive"
                  ? item.isArchived
                    ? "Restore"
                    : "Archive"
                  : mi.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

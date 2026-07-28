"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardIcon } from "@/components/dashboard/icons/DashboardIcons";
import {
  DEMO_REQUEST_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  SALESPERSON_OPTIONS,
} from "@/lib/demo-requests/constants";
import { mapItemToEditableFields } from "@/lib/demo-requests/mappers";
import type {
  DemoRequestEditableFields,
  DemoRequestItem,
  DemoRequestPriority,
  DemoRequestStatus,
} from "@/lib/demo-requests/types";
import {
  buildMailtoHref,
  buildTelHref,
  buildWhatsAppHref,
  formatDemoDate,
  formatDemoDateTime,
} from "@/lib/demo-requests/utils";
import { DemoRequestPriorityBadge } from "./DemoRequestPriorityBadge";
import { DemoRequestStatusBadge } from "./DemoRequestStatusBadge";

interface DemoRequestDetailsDrawerProps {
  item: DemoRequestItem | null;
  saving: boolean;
  onClose: () => void;
  onSave: (id: string, fields: DemoRequestEditableFields) => Promise<boolean>;
  onArchive: (item: DemoRequestItem) => void;
  onRestore: (item: DemoRequestItem) => void;
  onDelete: (item: DemoRequestItem) => void;
}

type TimelineEntry = {
  id: string;
  label: string;
  at: string;
  tone: "default" | "success" | "warning" | "danger";
};

const labelClass =
  "block text-xs font-medium uppercase tracking-wider text-white/40";
const readonlyClass = "mt-1 text-sm text-white/85";
const inputClass = "auth-input w-full appearance-none";

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className={readonlyClass}>{value || "—"}</p>
    </div>
  );
}

function buildTimelineEntries(item: DemoRequestItem): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      id: "created",
      label: "Request submitted",
      at: item.createdAt,
      tone: "default",
    },
  ];

  if (
    item.updatedAt &&
    item.updatedAt !== item.createdAt &&
    Math.abs(
      new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime(),
    ) > 60_000
  ) {
    entries.push({
      id: "updated",
      label: "Record updated",
      at: item.updatedAt,
      tone: "default",
    });
  }

  if (item.lastContactedAt) {
    entries.push({
      id: "last-contact",
      label: "Last contacted",
      at: item.lastContactedAt,
      tone: "success",
    });
  }

  if (item.nextFollowUpAt) {
    entries.push({
      id: "next-follow-up",
      label: "Next follow-up scheduled",
      at: item.nextFollowUpAt,
      tone: "warning",
    });
  }

  if (item.archivedAt) {
    entries.push({
      id: "archived",
      label: "Archived",
      at: item.archivedAt,
      tone: "warning",
    });
  }

  if (item.deletedAt) {
    entries.push({
      id: "deleted",
      label: "Soft deleted",
      at: item.deletedAt,
      tone: "danger",
    });
  }

  return entries.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}

const timelineDotClass: Record<TimelineEntry["tone"], string> = {
  default: "bg-gold/70 ring-gold/20",
  success: "bg-emerald-400 ring-emerald-400/20",
  warning: "bg-orange-400 ring-orange-400/20",
  danger: "bg-red-400 ring-red-400/20",
};

export function DemoRequestDetailsDrawer({
  item,
  saving,
  onClose,
  onSave,
  onArchive,
  onRestore,
  onDelete,
}: DemoRequestDetailsDrawerProps) {
  const [fields, setFields] = useState<DemoRequestEditableFields | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) {
      setFields(null);
      setError(null);
      return;
    }
    setFields(mapItemToEditableFields(item));
    setError(null);
  }, [item]);

  const timelineEntries = useMemo(
    () => (item ? buildTimelineEntries(item) : []),
    [item],
  );

  const updateField = <K extends keyof DemoRequestEditableFields>(
    key: K,
    value: DemoRequestEditableFields[K],
  ) => {
    setFields((previous) =>
      previous ? { ...previous, [key]: value } : previous,
    );
    setError(null);
  };

  const handleSave = async () => {
    if (!item || !fields) return;
    const ok = await onSave(item.id, fields);
    if (!ok) {
      setError("Unable to save changes. Please try again.");
    }
  };

  const handleConvert = async () => {
    if (!item || !fields || item.deletedAt) return;
    const converted: DemoRequestEditableFields = {
      ...fields,
      status: "Customer",
    };
    setFields(converted);
    const ok = await onSave(item.id, converted);
    if (!ok) {
      setError("Unable to convert to customer. Please try again.");
    }
  };

  const telHref = item ? buildTelHref(item.mobileNumber) : null;
  const whatsappHref = item ? buildWhatsAppHref(item.mobileNumber) : null;
  const mailtoHref = item ? buildMailtoHref(item.email) : null;

  return (
    <AnimatePresence>
      {item && fields && (
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
            className="menu-drawer fixed inset-0 z-50 flex w-full flex-col border-s border-gold/10 shadow-2xl sm:inset-y-0 sm:start-auto sm:end-0 sm:max-w-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-request-drawer-title"
          >
            <div className="flex items-center justify-between border-b border-gold/10 px-5 py-4">
              <div>
                <h2
                  id="demo-request-drawer-title"
                  className="font-serif text-xl font-bold text-white"
                >
                  Demo Request
                </h2>
                <p className="mt-1 text-xs text-white/45">
                  {item.restaurantName}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <DashboardIcon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">
              <div className="flex flex-wrap items-center gap-2">
                <DemoRequestStatusBadge
                  status={item.status}
                  archived={item.isArchived && !item.deletedAt}
                />
                <DemoRequestPriorityBadge priority={item.priority} />
                {item.assignedSalesperson ? (
                  <span className="rounded-full border border-gold/20 bg-gold/5 px-2.5 py-1 text-xs text-gold/90">
                    {item.assignedSalesperson}
                  </span>
                ) : null}
                {item.deletedAt ? (
                  <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-300">
                    Deleted
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <a
                  href={telHref ?? undefined}
                  className={`menu-btn-secondary justify-center text-center text-xs ${
                    !telHref ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  Call
                </a>
                <a
                  href={whatsappHref ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`menu-btn-secondary justify-center text-center text-xs ${
                    !whatsappHref ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  WhatsApp
                </a>
                <a
                  href={mailtoHref ?? undefined}
                  className={`menu-btn-secondary justify-center text-center text-xs ${
                    !mailtoHref ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  Email
                </a>
              </div>

              <section className="space-y-4 rounded-2xl border border-gold/10 bg-black/20 p-4">
                <h3 className="font-serif text-lg text-white">Request Details</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailField label="Restaurant Name" value={item.restaurantName} />
                  <DetailField label="Contact Person" value={item.contactPerson} />
                  <DetailField label="Mobile Number" value={item.mobileNumber} />
                  <DetailField label="Email" value={item.email} />
                  <DetailField label="City" value={item.city} />
                  <DetailField label="Restaurant Type" value={item.restaurantType} />
                  <DetailField label="Branches" value={item.branches} />
                  <DetailField
                    label="Preferred Date"
                    value={formatDemoDate(item.preferredDate)}
                  />
                  <DetailField label="Preferred Time" value={item.preferredTime} />
                  <DetailField
                    label="Alternative Date"
                    value={formatDemoDate(item.alternateDate)}
                  />
                  <DetailField label="Current Menu" value={item.currentMenuType} />
                  <DetailField
                    label="Archive Status"
                    value={
                      item.deletedAt
                        ? "Soft deleted"
                        : item.isArchived
                          ? "Archived"
                          : "Active"
                    }
                  />
                </div>
                <DetailField label="Notes" value={item.notes} />
              </section>

              <section className="space-y-4 rounded-2xl border border-gold/10 bg-black/20 p-4">
                <h3 className="font-serif text-lg text-white">Timeline</h3>
                <ol className="space-y-4">
                  {timelineEntries.map((entry, index) => (
                    <li key={entry.id} className="relative flex gap-3 ps-1">
                      {index < timelineEntries.length - 1 ? (
                        <span
                          className="absolute start-[7px] top-4 h-[calc(100%+0.5rem)] w-px bg-gold/15"
                          aria-hidden="true"
                        />
                      ) : null}
                      <span
                        className={`relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ${timelineDotClass[entry.tone]}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1 pb-1">
                        <p className="text-sm font-medium text-white/85">
                          {entry.label}
                        </p>
                        <p className="mt-0.5 text-xs text-white/45">
                          {formatDemoDateTime(entry.at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="space-y-4 rounded-2xl border border-gold/10 bg-black/20 p-4">
                <h3 className="font-serif text-lg text-white">CRM Editing</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="demo-status" className={labelClass}>
                      Status
                    </label>
                    <select
                      id="demo-status"
                      className={inputClass}
                      value={fields.status}
                      onChange={(event) =>
                        updateField(
                          "status",
                          event.target.value as DemoRequestStatus,
                        )
                      }
                      disabled={Boolean(item.deletedAt)}
                    >
                      {DEMO_REQUEST_STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="demo-priority" className={labelClass}>
                      Priority
                    </label>
                    <select
                      id="demo-priority"
                      className={inputClass}
                      value={fields.priority}
                      onChange={(event) =>
                        updateField(
                          "priority",
                          event.target.value as DemoRequestPriority,
                        )
                      }
                      disabled={Boolean(item.deletedAt)}
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="assigned-salesperson" className={labelClass}>
                    Assigned Salesperson
                  </label>
                  <select
                    id="assigned-salesperson"
                    className={inputClass}
                    value={fields.assignedSalesperson}
                    onChange={(event) =>
                      updateField("assignedSalesperson", event.target.value)
                    }
                    disabled={Boolean(item.deletedAt)}
                  >
                    {SALESPERSON_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="internal-notes" className={labelClass}>
                    Internal Notes
                  </label>
                  <textarea
                    id="internal-notes"
                    rows={4}
                    className={`${inputClass} min-h-[110px] resize-y`}
                    value={fields.internalNotes}
                    onChange={(event) =>
                      updateField("internalNotes", event.target.value)
                    }
                    disabled={Boolean(item.deletedAt)}
                    placeholder="Private notes for your team..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="last-contact" className={labelClass}>
                      Last Contact Date
                    </label>
                    <input
                      id="last-contact"
                      type="datetime-local"
                      className={inputClass}
                      value={fields.lastContactedAt}
                      onChange={(event) =>
                        updateField("lastContactedAt", event.target.value)
                      }
                      disabled={Boolean(item.deletedAt)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="next-follow-up" className={labelClass}>
                      Next Follow-up
                    </label>
                    <input
                      id="next-follow-up"
                      type="datetime-local"
                      className={inputClass}
                      value={fields.nextFollowUpAt}
                      onChange={(event) =>
                        updateField("nextFollowUpAt", event.target.value)
                      }
                      disabled={Boolean(item.deletedAt)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="follow-up-notes" className={labelClass}>
                    Follow-up Notes
                  </label>
                  <textarea
                    id="follow-up-notes"
                    rows={3}
                    className={`${inputClass} min-h-[90px] resize-y`}
                    value={fields.followUpNotes}
                    onChange={(event) =>
                      updateField("followUpNotes", event.target.value)
                    }
                    disabled={Boolean(item.deletedAt)}
                    placeholder="What should happen on the next follow-up..."
                  />
                </div>

                {error ? (
                  <p className="text-sm text-red-400" role="alert">
                    {error}
                  </p>
                ) : null}

                {!item.deletedAt ? (
                  <div className="space-y-2">
                    {fields.status !== "Customer" ? (
                      <button
                        type="button"
                        className="menu-btn-secondary w-full border-emerald-500/30 text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                        onClick={handleConvert}
                        disabled={saving}
                      >
                        {saving ? "Converting..." : "Convert to Customer"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="menu-btn-primary w-full"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                ) : null}
              </section>
            </div>

            {!item.deletedAt ? (
              <div className="flex flex-wrap gap-2 border-t border-gold/10 px-5 py-4">
                {item.isArchived ? (
                  <button
                    type="button"
                    className="menu-btn-secondary flex-1"
                    onClick={() => onRestore(item)}
                  >
                    Restore
                  </button>
                ) : (
                  <button
                    type="button"
                    className="menu-btn-secondary flex-1"
                    onClick={() => onArchive(item)}
                  >
                    Archive
                  </button>
                )}
                <button
                  type="button"
                  className="menu-btn-danger flex-1"
                  onClick={() => onDelete(item)}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

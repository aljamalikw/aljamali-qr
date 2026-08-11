"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { DemoRequestPagination } from "@/components/admin/demo-requests/DemoRequestPagination";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  deleteAnnouncement,
  fetchAnnouncements,
  upsertAnnouncement,
} from "@/lib/announcements/queries";
import type {
  AnnouncementFormData,
  AnnouncementItem,
  AnnouncementStatus,
} from "@/lib/announcements/types";
import { paginateDemoRequests } from "@/lib/demo-requests/utils";
import { notifyOwnersOfAnnouncement } from "@/lib/notifications/createNotification";

const PAGE_SIZE = 8;

const ANNOUNCEMENT_STATUSES: AnnouncementStatus[] = [
  "Draft",
  "Published",
  "Scheduled",
  "Expired",
];

const emptyForm = (): AnnouncementFormData => ({
  title: "",
  message: "",
  status: "Draft",
  publishAt: "",
  expiresAt: "",
});

function statusClass(status: AnnouncementStatus): string {
  switch (status) {
    case "Published":
      return "text-emerald-300";
    case "Scheduled":
      return "text-sky-300";
    case "Expired":
      return "text-white/40";
    default:
      return "text-gold";
  }
}

export function AdminAnnouncementsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [form, setForm] = useState<AnnouncementFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AnnouncementStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementItem | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchAnnouncements();
    setLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      setItems([]);
      return;
    }
    setItems(result.data);
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query)
      );
    });
  }, [items, search, status]);

  const { pageItems, totalPages, page: safePage } = useMemo(
    () => paginateDemoRequests(filtered, page, PAGE_SIZE),
    [filtered, page],
  );

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      showToast("Title and message are required.", "error");
      return;
    }
    setSaving(true);
    const result = await upsertAnnouncement(form, editingId ?? undefined);
    setSaving(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    showToast(editingId ? "Announcement updated" : "Announcement created");

    if (result.data.status === "Published") {
      void notifyOwnersOfAnnouncement({
        title: result.data.title,
        announcementId: result.data.id,
      });
    }

    setForm(emptyForm());
    setEditingId(null);
    load();
  };

  const handleEdit = (item: AnnouncementItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      message: item.message,
      status: item.status,
      publishAt: item.publishAt ? item.publishAt.slice(0, 16) : "",
      expiresAt: item.expiresAt ? item.expiresAt.slice(0, 16) : "",
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const result = await deleteAnnouncement(deleteTarget.id);
    setDeleteLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    showToast("Announcement deleted");
    if (editingId === deleteTarget.id) {
      setEditingId(null);
      setForm(emptyForm());
    }
    setDeleteTarget(null);
    load();
  };

  return (
    <AdminPlaceholder
      title="Announcements"
      description="Publish announcements that appear on restaurant owner dashboards."
    >
      <div className="grid gap-8 xl:grid-cols-2">
        <form className="space-y-4" onSubmit={handleSave}>
          <div className="space-y-1.5">
            <label
              htmlFor="announcement-title"
              className="block text-xs font-medium uppercase tracking-wider text-white/40"
            >
              Title
            </label>
            <input
              id="announcement-title"
              className="auth-input w-full"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="System maintenance notice"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="announcement-message"
              className="block text-xs font-medium uppercase tracking-wider text-white/40"
            >
              Message
            </label>
            <textarea
              id="announcement-message"
              className="auth-input min-h-[140px] w-full resize-y"
              value={form.message}
              onChange={(e) =>
                setForm((p) => ({ ...p, message: e.target.value }))
              }
              placeholder="Write the announcement message..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="announcement-publish-at"
                className="block text-xs font-medium uppercase tracking-wider text-white/40"
              >
                Publish Date
              </label>
              <input
                id="announcement-publish-at"
                type="datetime-local"
                className="auth-input w-full"
                value={form.publishAt}
                onChange={(e) =>
                  setForm((p) => ({ ...p, publishAt: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="announcement-expires-at"
                className="block text-xs font-medium uppercase tracking-wider text-white/40"
              >
                Expiry
              </label>
              <input
                id="announcement-expires-at"
                type="datetime-local"
                className="auth-input w-full"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm((p) => ({ ...p, expiresAt: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="announcement-status"
              className="block text-xs font-medium uppercase tracking-wider text-white/40"
            >
              Status
            </label>
            <select
              id="announcement-status"
              className="auth-input w-full appearance-none"
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  status: e.target.value as AnnouncementStatus,
                }))
              }
            >
              {ANNOUNCEMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="menu-btn-primary" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Create Announcement"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="menu-btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm());
                }}
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-serif text-lg text-white">All Announcements</h3>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or message…"
              aria-label="Search announcements"
              className="auth-input w-full"
            />
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as AnnouncementStatus | "all")
              }
              aria-label="Filter by status"
              className="auth-input w-full sm:w-44"
            >
              <option value="all">All statuses</option>
              {ANNOUNCEMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <TableSkeleton rows={4} />
          ) : filtered.length === 0 ? (
            <EmptyState
              compact
              title={
                search.trim() || status !== "all"
                  ? "No matching announcements"
                  : "No announcements yet"
              }
              description={
                search.trim() || status !== "all"
                  ? "Try adjusting your search or status filter."
                  : "Create your first announcement to notify restaurant owners."
              }
              className="border-0 bg-transparent"
            />
          ) : (
            <>
              <div className="space-y-3">
                {pageItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gold/15 bg-black/25 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p
                          className={`mt-1 text-xs font-semibold ${statusClass(item.status)}`}
                        >
                          {item.status}
                        </p>
                        <p className="mt-2 text-sm text-white/55">
                          {item.message}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="menu-btn-danger !px-2.5 !py-1.5 text-xs"
                          onClick={() => setDeleteTarget(item)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <DemoRequestPagination
                page={safePage}
                totalPages={totalPages}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Announcement?"
        description={`"${deleteTarget?.title ?? ""}" will be permanently removed.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminPlaceholder>
  );
}

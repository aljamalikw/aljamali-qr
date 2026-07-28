"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { DemoRequestPagination } from "@/components/admin/demo-requests/DemoRequestPagination";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  assignSupportTicket,
  bulkCloseSupportTickets,
  closeSupportTicket,
  createTicketReply,
  exportSupportTicketsToCsv,
  fetchSupportTickets,
  fetchTicketReplies,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  updateSupportTicketStatus,
  type SupportTicket,
  type SupportTicketReply,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/admin/support";
import {
  formatDemoDate,
  formatDemoDateTime,
  getPriorityBadgeClass,
  paginateDemoRequests,
} from "@/lib/demo-requests/utils";
import { csvTimestamp, downloadCsv } from "@/lib/utils/csv";
import { notifyRestaurantOwner } from "@/lib/notifications/createNotification";

const PAGE_SIZE = 10;

export function AdminSupportPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "all">("all");
  const [priority, setPriority] = useState<TicketPriority | "all">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<SupportTicketReply[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [assignName, setAssignName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkClose, setBulkClose] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchSupportTickets();
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      setItems([]);
      return;
    }
    setItems(result.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status, priority]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (priority !== "all" && item.priority !== priority) return false;
      if (!query) return true;
      return (
        item.ticketNumber.toLowerCase().includes(query) ||
        item.subject.toLowerCase().includes(query) ||
        (item.restaurantName?.toLowerCase().includes(query) ?? false) ||
        (item.assignedStaff?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [items, search, status, priority]);

  const { pageItems, totalPages, page: safePage } = useMemo(
    () => paginateDemoRequests(filtered, page, PAGE_SIZE),
    [filtered, page],
  );

  const openTicket = async (ticket: SupportTicket) => {
    setSelected(ticket);
    setAssignName(ticket.assignedStaff ?? "");
    setReplyBody("");
    const result = await fetchTicketReplies(ticket.id);
    setReplies(result.ok ? result.data : []);
  };

  const replaceTicket = (ticket: SupportTicket) => {
    setItems((prev) => prev.map((t) => (t.id === ticket.id ? ticket : t)));
    setSelected(ticket);
  };

  const handleAssign = async () => {
    if (!selected) return;
    setActionLoading(true);
    const result = await assignSupportTicket(selected.id, assignName);
    setActionLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    replaceTicket(result.data);
    showToast("Ticket assigned");
  };

  const handleStatus = async (next: TicketStatus) => {
    if (!selected) return;
    setActionLoading(true);
    const result = await updateSupportTicketStatus(selected.id, next);
    setActionLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    replaceTicket(result.data);
    showToast(`Status set to ${next}`);
  };

  const handleReply = async () => {
    if (!selected || !replyBody.trim()) return;
    setActionLoading(true);
    const result = await createTicketReply(selected.id, replyBody);
    setActionLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setReplies((prev) => [...prev, result.data]);
    setReplyBody("");
    showToast("Reply sent");

    if (selected.restaurantId) {
      void notifyRestaurantOwner(selected.restaurantId, {
        type: "support_reply",
        title: "New reply on your support ticket",
        body: `${selected.subject}: ${replyBody.trim().slice(0, 140)}`,
        href: "/dashboard/support",
      });
    }
  };

  const handleClose = async () => {
    if (!selected) return;
    setActionLoading(true);
    const result = await closeSupportTicket(selected.id);
    setActionLoading(false);
    setConfirmClose(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    replaceTicket(result.data);
    showToast("Ticket closed");
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((previous) => {
      const pageIds = pageItems.map((item) => item.id);
      const allSelected = pageIds.every((id) => previous.has(id));
      if (allSelected) {
        const next = new Set(previous);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...previous, ...pageIds]);
    });
  }, [pageItems]);

  const handleBulkClose = async () => {
    if (selectedIds.size === 0) return;
    setActionLoading(true);
    const result = await bulkCloseSupportTickets([...selectedIds]);
    setActionLoading(false);
    setBulkClose(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setSelectedIds(new Set());
    await load();
    showToast(`Closed ${selectedIds.size} ticket(s)`);
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      showToast("No rows available to export", "error");
      return;
    }
    const csv = exportSupportTicketsToCsv(filtered);
    downloadCsv(`support-tickets-${csvTimestamp()}.csv`, csv);
    showToast(`Exported ${filtered.length} tickets`);
  };

  const allPageSelected =
    pageItems.length > 0 && pageItems.every((item) => selectedIds.has(item.id));

  return (
    <AdminPlaceholder
      title="Support"
      description="Ticket system for status, priority, assignment and closure."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket, subject, restaurant…"
            aria-label="Search support tickets"
            className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as TicketStatus | "all")
              }
              aria-label="Filter by status"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
            >
              <option value="all">All statuses</option>
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as TicketPriority | "all")
              }
              aria-label="Filter by priority"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
            >
              <option value="all">All priorities</option>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="menu-btn-secondary"
              onClick={handleExport}
            >
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-white/50">{error}</p>
            <button
              type="button"
              className="menu-btn-primary mt-6"
              onClick={() => void load()}
            >
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-white/50">
              {search || status !== "all" || priority !== "all"
                ? "No tickets match your filters."
                : "No support tickets yet."}
            </p>
          </div>
        ) : (
          <>
            {selectedIds.size > 0 ? (
              <div className="dashboard-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
                <p className="text-sm text-white/70">
                  {selectedIds.size} selected
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="menu-btn-danger"
                    onClick={() => setBulkClose(true)}
                  >
                    Bulk Close
                  </button>
                  <button
                    type="button"
                    className="menu-btn-secondary"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left">
                <thead>
                  <tr className="border-b border-gold/10">
                    <th className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all tickets on this page"
                        className="h-4 w-4 accent-gold"
                      />
                    </th>
                    {[
                      "Ticket",
                      "Subject",
                      "Restaurant",
                      "Status",
                      "Priority",
                      "Assigned",
                      "Closed",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-white/40"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="table-row-hover cursor-pointer border-b border-white/5"
                      onClick={() => void openTicket(ticket)}
                    >
                      <td
                        className="px-3 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(ticket.id)}
                          onChange={() => toggleSelect(ticket.id)}
                          aria-label={`Select ${ticket.ticketNumber}`}
                          className="h-4 w-4 accent-gold"
                        />
                      </td>
                      <td className="px-3 py-3 text-sm text-white">
                        {ticket.ticketNumber}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/70">
                        {ticket.subject}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/50">
                        {ticket.restaurantName ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-orange-300">
                        {ticket.status}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getPriorityBadgeClass(ticket.priority)}`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-white/70">
                        {ticket.assignedStaff ?? "Unassigned"}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/40">
                        {formatDemoDate(ticket.closedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

        {selected ? (
          <div className="rounded-2xl border border-gold/15 bg-black/25 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40">
                  {selected.ticketNumber}
                </p>
                <h3 className="mt-1 font-serif text-xl text-white">
                  {selected.subject}
                </h3>
                <p className="mt-1 text-sm text-white/45">
                  {selected.restaurantName ?? "No restaurant"} ·{" "}
                  {formatDemoDateTime(selected.createdAt)}
                </p>
              </div>
              <button
                type="button"
                className="menu-btn-secondary !px-3 !py-1.5 text-xs"
                onClick={() => setSelected(null)}
              >
                Close panel
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <select
                value={selected.status}
                onChange={(e) =>
                  void handleStatus(e.target.value as TicketStatus)
                }
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              >
                {TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="flex gap-2 sm:col-span-2">
                <input
                  value={assignName}
                  onChange={(e) => setAssignName(e.target.value)}
                  placeholder="Assign staff name"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
                <button
                  type="button"
                  className="menu-btn-secondary shrink-0"
                  disabled={actionLoading}
                  onClick={() => void handleAssign()}
                >
                  Assign
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-xs uppercase tracking-wider text-white/40">
                Replies
              </p>
              {replies.length === 0 ? (
                <p className="text-sm text-white/45">No replies yet.</p>
              ) : (
                replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="rounded-xl border border-white/5 bg-black/20 px-3 py-3"
                  >
                    <p className="text-sm text-white/80 whitespace-pre-wrap">
                      {reply.body}
                    </p>
                    <p className="mt-2 text-xs text-white/35">
                      {formatDemoDateTime(reply.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 space-y-3">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={3}
                placeholder="Write a reply…"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="menu-btn-primary"
                  disabled={actionLoading || !replyBody.trim()}
                  onClick={() => void handleReply()}
                >
                  Send Reply
                </button>
                {selected.status !== "Closed" ? (
                  <button
                    type="button"
                    className="menu-btn-danger"
                    disabled={actionLoading}
                    onClick={() => setConfirmClose(true)}
                  >
                    Close Ticket
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmModal
        open={confirmClose}
        title="Close Ticket?"
        description="This ticket will be marked as Closed."
        confirmLabel="Close Ticket"
        variant="danger"
        loading={actionLoading}
        onConfirm={() => void handleClose()}
        onCancel={() => setConfirmClose(false)}
      />

      <ConfirmModal
        open={bulkClose}
        title="Close Selected Tickets?"
        description={`${selectedIds.size} ticket(s) will be marked as Closed.`}
        confirmLabel="Close Tickets"
        variant="danger"
        loading={actionLoading}
        onConfirm={() => void handleBulkClose()}
        onCancel={() => setBulkClose(false)}
      />
    </AdminPlaceholder>
  );
}

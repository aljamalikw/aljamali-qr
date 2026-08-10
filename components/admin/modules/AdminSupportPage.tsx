"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { DemoRequestPagination } from "@/components/admin/demo-requests/DemoRequestPagination";
import { SupportConversation } from "@/components/support/SupportConversation";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { restaurantCountLabel } from "@/lib/admin/group-by-owner";
import {
  assignSupportTicket,
  bulkCloseSupportTickets,
  closeSupportTicket,
  createTicketReply,
  exportSupportTicketsToCsv,
  fetchSupportTickets,
  fetchTicketReplies,
  getTicketCategoryBadgeClass,
  getTicketStatusBadgeClass,
  groupSupportTicketsByOwner,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  updateSupportTicketStatus,
  type SupportOwnerGroup,
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
  const searchParams = useSearchParams();
  const ticketParam = searchParams.get("ticket");
  const [items, setItems] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TicketStatus | "all">("all");
  const [priority, setPriority] = useState<TicketPriority | "all">("all");
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<SupportTicketReply[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [assignName, setAssignName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkClose, setBulkClose] = useState(false);

  const openTicket = useCallback(async (ticket: SupportTicket) => {
    setSelected(ticket);
    setAssignName(ticket.assignedStaff ?? "");
    setReplyBody("");
    const result = await fetchTicketReplies(ticket.id);
    if (result.ok) setReplies(result.data);
    else setReplies([]);
  }, []);

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
    if (!ticketParam || items.length === 0) return;
    const ticket = items.find((item) => item.id === ticketParam);
    if (!ticket) return;
    if (ticket.ownerId) {
      setExpandedIds((previous) => new Set(previous).add(ticket.ownerId!));
    }
    void openTicket(ticket);
  }, [ticketParam, items, openTicket]);

  useEffect(() => {
    setPage(1);
  }, [search, status, priority]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (priority !== "all" && item.priority !== priority) return false;
      if (!query) return true;
      return (
        item.ticketNumber.toLowerCase().includes(query) ||
        item.subject.toLowerCase().includes(query) ||
        (item.ownerName?.toLowerCase().includes(query) ?? false) ||
        (item.ownerEmail?.toLowerCase().includes(query) ?? false) ||
        (item.restaurantName?.toLowerCase().includes(query) ?? false) ||
        (item.assignedStaff?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [items, search, status, priority]);

  const ownerGroups = useMemo(
    () => groupSupportTicketsByOwner(filteredTickets),
    [filteredTickets],
  );

  const { pageItems, totalPages, page: safePage } = useMemo(
    () => paginateDemoRequests(ownerGroups, page, PAGE_SIZE),
    [ownerGroups, page],
  );

  const toggleExpanded = useCallback((ownerId: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(ownerId)) next.delete(ownerId);
      else next.add(ownerId);
      return next;
    });
  }, []);

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
    const result = await createTicketReply(selected.id, replyBody, {
      nextStatus: "Waiting for Customer",
    });
    setActionLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setReplies((prev) => [...prev, result.data]);
    setReplyBody("");
    const updated = {
      ...selected,
      status: "Waiting for Customer" as const,
      updatedAt: new Date().toISOString(),
    };
    replaceTicket(updated);
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

  const ticketsOnPage = useMemo(
    () => pageItems.flatMap((group) => group.tickets),
    [pageItems],
  );

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
      const pageIds = ticketsOnPage.map((item) => item.id);
      const allSelected =
        pageIds.length > 0 && pageIds.every((id) => previous.has(id));
      if (allSelected) {
        const next = new Set(previous);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...previous, ...pageIds]);
    });
  }, [ticketsOnPage]);

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
    if (filteredTickets.length === 0) {
      showToast("No rows available to export", "error");
      return;
    }
    const csv = exportSupportTicketsToCsv(filteredTickets);
    downloadCsv(`support-tickets-${csvTimestamp()}.csv`, csv);
    showToast(`Exported ${filteredTickets.length} tickets`);
  };

  const allPageSelected =
    ticketsOnPage.length > 0 &&
    ticketsOnPage.every((item) => selectedIds.has(item.id));

  return (
    <AdminPlaceholder
      title="Support"
      description="Owner-grouped tickets with conversation, status, and assignment."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search owner, email, or restaurant…"
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
        ) : ownerGroups.length === 0 ? (
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
              <table className="w-full min-w-[980px] text-left">
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
                      "Owner",
                      "Email",
                      "Phone",
                      "Restaurants",
                      "Tickets",
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
                  {pageItems.map((group: SupportOwnerGroup) => {
                    const expanded = expandedIds.has(group.ownerId);
                    const ownerLabel =
                      group.ownerName?.trim() || "Unnamed owner";

                    return (
                      <Fragment key={group.ownerId}>
                        <tr className="table-row-hover border-b border-white/5">
                          <td className="px-3 py-3" />
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => toggleExpanded(group.ownerId)}
                              aria-expanded={expanded}
                              className="flex max-w-xs items-start gap-2 text-start"
                            >
                              <span
                                className="mt-0.5 inline-block w-3 shrink-0 text-gold/80"
                                aria-hidden="true"
                              >
                                {expanded ? "▼" : "▶"}
                              </span>
                              <span className="text-sm font-medium text-white">
                                {ownerLabel}
                              </span>
                            </button>
                          </td>
                          <td className="px-3 py-3 text-sm text-white/70">
                            {group.ownerEmail ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-sm text-white/70">
                            {group.ownerPhone ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-sm text-white/70">
                            {restaurantCountLabel(group.restaurantCount)}
                          </td>
                          <td className="px-3 py-3 text-sm text-white/70">
                            {group.ticketCount} ticket
                            {group.ticketCount === 1 ? "" : "s"}
                          </td>
                        </tr>
                        {expanded ? (
                          <tr className="border-b border-white/5 bg-black/20">
                            <td colSpan={6} className="px-3 py-3">
                              <div className="mb-4">
                                <p className="mb-2 text-[11px] uppercase tracking-wider text-white/35">
                                  Restaurants
                                </p>
                                <ul className="mb-4 space-y-1">
                                  {group.restaurants.map((restaurant) => (
                                    <li
                                      key={restaurant.id}
                                      className="flex items-center gap-2 text-sm text-white/70"
                                    >
                                      <span className="text-gold/70">•</span>
                                      {restaurant.name?.trim() ||
                                        "Unnamed restaurant"}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <p className="mb-2 text-[11px] uppercase tracking-wider text-white/35">
                                Tickets
                              </p>
                              <div className="overflow-x-auto rounded-xl border border-white/5">
                                <table className="w-full min-w-[900px] text-left">
                                  <thead>
                                    <tr className="border-b border-white/5">
                                      <th className="px-3 py-2" />
                                      {[
                                        "Ticket",
                                        "Subject",
                                        "Restaurant",
                                        "Status",
                                        "Priority",
                                        "Updated",
                                      ].map((heading) => (
                                        <th
                                          key={heading}
                                          className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/35"
                                        >
                                          {heading}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.tickets.map((ticket) => (
                                      <tr
                                        key={ticket.id}
                                        className="cursor-pointer border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                                        onClick={() => void openTicket(ticket)}
                                      >
                                        <td
                                          className="px-3 py-2.5"
                                          onClick={(event) =>
                                            event.stopPropagation()
                                          }
                                        >
                                          <input
                                            type="checkbox"
                                            checked={selectedIds.has(ticket.id)}
                                            onChange={() =>
                                              toggleSelect(ticket.id)
                                            }
                                            aria-label={`Select ${ticket.ticketNumber}`}
                                            className="h-4 w-4 accent-gold"
                                          />
                                        </td>
                                        <td className="px-3 py-2.5 text-sm text-white">
                                          {ticket.ticketNumber}
                                        </td>
                                        <td className="px-3 py-2.5 text-sm text-white/75">
                                          {ticket.subject}
                                        </td>
                                        <td className="px-3 py-2.5 text-sm text-white/50">
                                          {ticket.restaurantName ?? "—"}
                                        </td>
                                        <td className="px-3 py-2.5">
                                          <span
                                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${getTicketStatusBadgeClass(ticket.status)}`}
                                          >
                                            {ticket.status}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                          <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getPriorityBadgeClass(ticket.priority)}`}
                                          >
                                            {ticket.priority}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-sm text-white/40">
                                          {formatDemoDate(ticket.updatedAt)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <DemoRequestPagination
              page={safePage}
              totalPages={totalPages}
              totalItems={ownerGroups.length}
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
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${getTicketStatusBadgeClass(selected.status)}`}
                  >
                    {selected.status}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getPriorityBadgeClass(selected.priority)}`}
                  >
                    {selected.priority}
                  </span>
                  {selected.category ? (
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${getTicketCategoryBadgeClass()}`}
                    >
                      {selected.category}
                    </span>
                  ) : null}
                </div>
                <dl className="mt-3 grid gap-1 text-sm text-white/55 sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-white/35">
                      Owner
                    </dt>
                    <dd>{selected.ownerName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-white/35">
                      Restaurant
                    </dt>
                    <dd>{selected.restaurantName ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-white/35">
                      Email
                    </dt>
                    <dd>{selected.ownerEmail ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-white/35">
                      Phone
                    </dt>
                    <dd>{selected.ownerPhone ?? "—"}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-white/40">
                  Last updated {formatDemoDateTime(selected.updatedAt)}
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

            <div className="mt-5">
              <p className="mb-3 text-xs uppercase tracking-wider text-white/40">
                Conversation
              </p>
              <SupportConversation ticket={selected} replies={replies} />
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

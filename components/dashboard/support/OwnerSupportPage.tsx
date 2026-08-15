"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { SupportConversation } from "@/components/support/SupportConversation";
import { FormSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import {
  createSupportTicket,
  createTicketReply,
  fetchOwnerSupportTickets,
  fetchTicketReplies,
  getTicketCategoryBadgeClass,
  getTicketStatusBadgeClass,
  markTicketSeen,
  ticketHasUnreadSupportReplies,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type SupportTicket,
  type SupportTicketReply,
  type TicketPriority,
} from "@/lib/admin/support";
import {
  formatDemoDate,
  formatDemoDateTime,
  getPriorityBadgeClass,
} from "@/lib/demo-requests/utils";
import {
  getWhatsAppTelHref,
  getWhatsAppUrl,
  OFFICIAL_ALJAMALI_WHATSAPP_DISPLAY,
} from "@/lib/company/whatsapp";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";

const SUPPORT_PHONE_DISPLAY = OFFICIAL_ALJAMALI_WHATSAPP_DISPLAY;
const SUPPORT_TEL = getWhatsAppTelHref() ?? "tel:+96565592134";
const SUPPORT_WHATSAPP =
  getWhatsAppUrl(
    "Hello Aljamali QR, I need help with my restaurant account.",
  ) ?? "https://wa.me/96565592134";

export function OwnerSupportPage() {
  const { showToast } = useToast();
  const { user } = useAuthUser();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [category, setCategory] =
    useState<(typeof TICKET_CATEGORIES)[number]>("Other");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<SupportTicketReply[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (!restaurant?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await fetchOwnerSupportTickets(restaurant.id);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      setTickets([]);
      return;
    }
    setTickets(result.data);

    const nextUnread: Record<string, boolean> = {};
    await Promise.all(
      result.data.map(async (ticket) => {
        const replyResult = await fetchTicketReplies(ticket.id);
        if (!replyResult.ok) return;
        nextUnread[ticket.id] = ticketHasUnreadSupportReplies(
          ticket,
          replyResult.data,
        );
      }),
    );
    setUnreadMap(nextUnread);
  }, [restaurant?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const openTicket = async (ticket: SupportTicket) => {
    setSelected(ticket);
    setReplyBody("");
    const result = await fetchTicketReplies(ticket.id);
    const list = result.ok ? result.data : [];
    setReplies(list);
    markTicketSeen(ticket.id);
    setUnreadMap((prev) => ({ ...prev, [ticket.id]: false }));
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!restaurant?.id) return;
    if (!subject.trim()) {
      showToast("Subject is required", "error");
      return;
    }
    setSaving(true);
    const result = await createSupportTicket({
      restaurantId: restaurant.id,
      restaurantName: restaurant.restaurant_name,
      ownerId: restaurant.owner_id || user?.id || null,
      ownerEmail: user?.email || restaurant.email,
      subject,
      category,
      priority,
      body,
    });
    setSaving(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setTickets((prev) => [result.data, ...prev]);
    setSubject("");
    setBody("");
    setPriority("Medium");
    setCategory("Other");
    showToast("Support ticket created");
    void openTicket(result.data);
  };

  const handleOwnerReply = async () => {
    if (!selected || !replyBody.trim()) return;
    setReplyLoading(true);
    const result = await createTicketReply(selected.id, replyBody.trim(), {
      nextStatus: "Waiting for Admin",
    });
    setReplyLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setReplies((prev) => [...prev, result.data]);
    setReplyBody("");
    const updated = {
      ...selected,
      status: "Waiting for Admin" as const,
      updatedAt: new Date().toISOString(),
    };
    setSelected(updated);
    setTickets((prev) =>
      prev.map((ticket) => (ticket.id === updated.id ? updated : ticket)),
    );
    markTicketSeen(selected.id);
    showToast("Reply sent");
  };

  const canReply = useMemo(() => {
    if (!selected) return false;
    return selected.status !== "Closed" && selected.status !== "Resolved";
  }, [selected]);

  if (restaurantLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="dashboard-card rounded-2xl p-6 sm:p-8">
          <FormSkeleton />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-4xl py-16 text-center">
        <p className="text-sm text-white/50">
          Complete restaurant onboarding to open support tickets.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
          Support
        </h1>
        <p className="mt-1 text-sm text-white/45">
          Contact Aljamali QR without leaving your dashboard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DashboardCard className="p-5 sm:p-6" delay={0.02}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold/80">
            Call Us
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Speak directly with the Aljamali QR team.
          </p>
          <p className="mt-3 text-sm text-white/70">{SUPPORT_PHONE_DISPLAY}</p>
          <div className="mt-5">
            <a href={SUPPORT_TEL} className="menu-btn-primary inline-flex">
              📞 Call Now
            </a>
          </div>
        </DashboardCard>

        <DashboardCard className="p-5 sm:p-6" delay={0.06}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold/80">
            WhatsApp Support
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Chat with our team on WhatsApp for faster assistance.
          </p>
          <div className="mt-5">
            <a
              href={SUPPORT_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="dashboard-cta-primary inline-flex"
            >
              💬 Chat on WhatsApp
            </a>
          </div>
        </DashboardCard>
      </div>

      <form
        onSubmit={(e) => void handleCreate(e)}
        className="dashboard-card space-y-4 rounded-2xl p-6 sm:p-8"
      >
        <h2 className="font-serif text-xl text-white">New ticket</h2>
        <p className="text-xs text-white/40">
          Restaurant and owner details are attached automatically.
        </p>
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
            Subject
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white"
            placeholder="Briefly describe the issue"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
              Category
            </label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as (typeof TICKET_CATEGORIES)[number])
              }
              className="w-full rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white"
            >
              {TICKET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              className="w-full rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white"
            >
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">
            Details
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white"
            placeholder="Add any details that help us resolve this faster"
          />
        </div>
        <button type="submit" className="menu-btn-primary" disabled={saving}>
          {saving ? "Submitting…" : "Create Ticket"}
        </button>
      </form>

      <div className="dashboard-card rounded-2xl p-6 sm:p-8">
        <h2 className="mb-4 font-serif text-xl text-white">Your tickets</h2>
        {loading ? (
          <TableSkeleton rows={4} />
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-white/50">{error}</p>
            <button
              type="button"
              className="menu-btn-primary mt-4"
              onClick={() => void load()}
            >
              Try Again
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-white/45">No tickets yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-gold/10">
                  {[
                    "Ticket",
                    "Subject",
                    "Status",
                    "Priority",
                    "Updated",
                    "",
                  ].map((heading) => (
                    <th
                      key={heading || "actions"}
                      className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-white/40"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-white/5">
                    <td className="px-3 py-3 text-sm text-white">
                      <span className="inline-flex items-center gap-2">
                        {ticket.ticketNumber}
                        {unreadMap[ticket.id] ? (
                          <span className="inline-flex h-2 w-2 rounded-full bg-gold" />
                        ) : null}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-white/70">
                      {ticket.subject}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${getTicketStatusBadgeClass(ticket.status)}`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getPriorityBadgeClass(ticket.priority)}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-white/50">
                      {formatDemoDate(ticket.updatedAt)}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                        onClick={() => void openTicket(ticket)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected ? (
        <div className="dashboard-card space-y-4 rounded-2xl p-6 sm:p-8">
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
              <p className="mt-2 text-xs text-white/40">
                Last updated {formatDemoDateTime(selected.updatedAt)}
              </p>
            </div>
            <button
              type="button"
              className="menu-btn-secondary !px-3 !py-1.5 text-xs"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>

          <div>
            <p className="mb-3 text-xs uppercase tracking-wider text-white/40">
              Conversation
            </p>
            <SupportConversation ticket={selected} replies={replies} />
          </div>

          {canReply ? (
            <div className="space-y-3 border-t border-white/5 pt-4">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={3}
                placeholder="Write a reply…"
                className="w-full rounded-xl border border-gold/15 bg-black/30 px-3 py-2 text-sm text-white"
              />
              <button
                type="button"
                className="menu-btn-primary"
                disabled={replyLoading || !replyBody.trim()}
                onClick={() => void handleOwnerReply()}
              >
                {replyLoading ? "Sending…" : "Send Reply"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-white/45">
              This ticket is {selected.status.toLowerCase()} and no longer
              accepts replies.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

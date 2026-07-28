"use client";

import { useCallback, useEffect, useState } from "react";
import { FormSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  createSupportTicket,
  fetchOwnerSupportTickets,
  TICKET_PRIORITIES,
  type SupportTicket,
  type TicketPriority,
} from "@/lib/admin/support";
import {
  formatDemoDate,
  getPriorityBadgeClass,
} from "@/lib/demo-requests/utils";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";

const CATEGORIES = [
  "Billing",
  "QR Codes",
  "Menu",
  "Account",
  "Technical",
  "Other",
] as const;

export function OwnerSupportPage() {
  const { showToast } = useToast();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Other");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

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
  }, [restaurant?.id]);

  useEffect(() => {
    void load();
  }, [load]);

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
  };

  if (restaurantLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="dashboard-card rounded-2xl p-6 sm:p-8">
          <FormSkeleton />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
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
          Create tickets and track responses from the Aljamali QR team.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleCreate(e)}
        className="dashboard-card space-y-4 rounded-2xl p-6 sm:p-8"
      >
        <h2 className="font-serif text-xl text-white">New ticket</h2>
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
                setCategory(e.target.value as (typeof CATEGORIES)[number])
              }
              className="w-full rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white"
            >
              {CATEGORIES.map((c) => (
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
              onChange={(e) =>
                setPriority(e.target.value as TicketPriority)
              }
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
        <button
          type="submit"
          className="menu-btn-primary"
          disabled={saving}
        >
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
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-gold/10">
                  {["Ticket", "Subject", "Status", "Priority", "Created"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-white/40"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-white/5">
                    <td className="px-3 py-3 text-sm text-white">
                      {ticket.ticketNumber}
                    </td>
                    <td className="px-3 py-3 text-sm text-white/70">
                      {ticket.subject}
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
                    <td className="px-3 py-3 text-sm text-white/50">
                      {formatDemoDate(ticket.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

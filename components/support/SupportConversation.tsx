"use client";

import {
  formatDemoDateTime,
} from "@/lib/demo-requests/utils";
import {
  replySenderLabel,
  type SupportTicket,
  type SupportTicketReply,
} from "@/lib/admin/support";

export function SupportConversation({
  ticket,
  replies,
  emptyLabel = "No messages yet.",
}: {
  ticket: SupportTicket;
  replies: SupportTicketReply[];
  emptyLabel?: string;
}) {
  if (replies.length === 0) {
    return <p className="text-sm text-white/45">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-3">
      {replies.map((reply) => {
        const sender = replySenderLabel(reply, ticket);
        const isOwner = sender === "Owner";
        return (
          <div
            key={reply.id}
            className={`rounded-xl border px-3.5 py-3 ${
              isOwner
                ? "border-white/10 bg-black/25"
                : "border-gold/20 bg-gold/[0.07]"
            }`}
          >
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isOwner ? "text-white/45" : "text-gold/80"
                }`}
              >
                {isOwner ? "Owner" : "Aljamali QR Support"}
              </p>
              <p className="text-xs text-white/35">
                {formatDemoDateTime(reply.createdAt)}
              </p>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85">
              {reply.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}

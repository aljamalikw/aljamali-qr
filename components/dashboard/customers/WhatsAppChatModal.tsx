"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import type { Customer } from "@/lib/customers/sync-customer";
import {
  customerHasMarketingOptIn,
  DEFAULT_CUSTOMER_WHATSAPP_TEMPLATE,
  openCustomerWhatsAppChat,
  renderCustomerWhatsAppMessage,
} from "@/lib/customers/whatsapp-chat";
import { normalizeWhatsAppPhone } from "@/lib/marketing/whatsapp/phone";

type WhatsAppChatModalProps = {
  open: boolean;
  restaurantId: string;
  restaurantName: string;
  customer: Customer | null;
  /** When set, message is prefilled from campaign body instead of default CRM template. */
  campaignId?: string | null;
  campaignMessage?: string | null;
  onClose: () => void;
  onOpened?: () => void;
};

export function WhatsAppChatModal({
  open,
  restaurantId,
  restaurantName,
  customer,
  campaignId,
  campaignMessage,
  onClose,
  onOpened,
}: WhatsAppChatModalProps) {
  const { showToast } = useToast();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const optedIn = customer ? customerHasMarketingOptIn(customer) : false;
  const phone = customer ? normalizeWhatsAppPhone(customer.phone) : null;

  const defaultMessage = useMemo(() => {
    if (!customer) return DEFAULT_CUSTOMER_WHATSAPP_TEMPLATE;
    const template =
      campaignMessage?.trim() || DEFAULT_CUSTOMER_WHATSAPP_TEMPLATE;
    return renderCustomerWhatsAppMessage({
      template,
      customer,
      restaurantName,
    });
  }, [campaignMessage, customer, restaurantName]);

  useEffect(() => {
    if (open) {
      setMessage(defaultMessage);
    }
  }, [open, defaultMessage]);

  if (!open || !customer) return null;

  const handleOpen = async () => {
    if (!optedIn) {
      showToast(
        "Customer has not opted in to promotional messaging.",
        "error",
      );
      return;
    }
    if (!phone) {
      showToast("This customer has no valid phone number.", "error");
      return;
    }

    setBusy(true);
    const result = await openCustomerWhatsAppChat({
      restaurantId,
      restaurantName,
      customer,
      message,
      campaignId,
    });
    setBusy(false);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    showToast("WhatsApp opened with your message.");
    onOpened?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-chat-title"
        className="dashboard-card relative z-10 w-full max-w-lg space-y-4 rounded-t-2xl border border-gold/15 p-5 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="whatsapp-chat-title"
              className="font-serif text-xl font-bold text-white"
            >
              Send WhatsApp Message
            </h2>
            <p className="mt-1 text-sm text-white/50">
              {customer.fullName?.trim() || "Guest"}
              {phone ? ` · +${phone}` : " · No phone"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {!optedIn ? (
          <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/90">
            Customer has not opted in to promotional messaging.
          </p>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Message
          </span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
          />
        </label>

        <p className="text-xs text-white/40">
          Opens WhatsApp with this message pre-filled. You press Send inside
          WhatsApp — nothing is sent automatically.
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="menu-btn-secondary"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleOpen()}
            disabled={busy || !optedIn || !phone}
            title={
              !optedIn
                ? "Customer has not opted in to promotional messaging."
                : !phone
                  ? "No valid phone number"
                  : undefined
            }
            className="menu-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Opening…" : "Open WhatsApp"}
          </button>
        </div>
      </div>
    </div>
  );
}

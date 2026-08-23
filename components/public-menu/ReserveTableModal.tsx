"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { createReservation } from "@/lib/reservations/createReservation";
import {
  PUBLIC_RESERVATION_TYPES,
  type PublicReservationType,
} from "@/lib/reservations/types";
import { t } from "@/lib/public-menu/i18n";
import type { PublicLanguage } from "@/lib/public-menu/types";

const MIN_GUESTS = 1;
const MAX_GUESTS = 100;

interface ReserveTableModalProps {
  open: boolean;
  onClose: () => void;
  restaurantId: string;
  lang: PublicLanguage;
}

const RESERVATION_TYPE_LABELS: Record<PublicReservationType, { en: string; ar: string }> = {
  Birthday: { en: "Birthday", ar: "عيد ميلاد" },
  Business: { en: "Business", ar: "عمل" },
  Family: { en: "Family", ar: "عائلي" },
  Anniversary: { en: "Anniversary", ar: "ذكرى سنوية" },
  Outdoor: { en: "Outdoor", ar: "خارجي" },
  Indoor: { en: "Indoor", ar: "داخلي" },
};

function emptyForm() {
  return {
    customerName: "",
    mobileNumber: "",
    email: "",
    reservationDate: "",
    reservationTime: "",
    guests: MIN_GUESTS,
    specialRequests: "",
    reservationType: "Family" as PublicReservationType,
  };
}

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const fieldLabelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45";
const fieldInputClass =
  "w-full rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

function clampGuests(value: number): number {
  if (!Number.isFinite(value)) return MIN_GUESTS;
  return Math.min(MAX_GUESTS, Math.max(MIN_GUESTS, Math.trunc(value)));
}

function GuestStepper({
  id,
  value,
  lang,
  onChange,
}: {
  id: string;
  value: number;
  lang: PublicLanguage;
  onChange: (guests: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectValue = () => {
    requestAnimationFrame(() => {
      inputRef.current?.select();
    });
  };

  const applyGuests = (next: number) => {
    const guests = clampGuests(next);
    setDraft(String(guests));
    onChange(guests);
  };

  return (
    <div
      dir="ltr"
      className="flex min-h-[42px] items-stretch overflow-hidden rounded-xl border border-gold/15 bg-black/30 focus-within:border-gold/40 focus-within:outline-none focus-within:ring-2 focus-within:ring-gold/15"
    >
      <button
        type="button"
        disabled={value <= MIN_GUESTS}
        onClick={() => applyGuests(value - 1)}
        className="flex w-11 shrink-0 items-center justify-center text-lg leading-none text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:text-gold/30 disabled:hover:bg-transparent"
        aria-label={t("decreaseGuests", lang)}
      >
        −
      </button>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        aria-live="polite"
        className="min-w-0 flex-1 bg-transparent text-center text-sm font-medium text-white outline-none"
        value={editing ? draft : String(value)}
        onFocus={() => {
          setEditing(true);
          setDraft(String(value));
          selectValue();
        }}
        onClick={selectValue}
        onMouseUp={(event) => {
          event.preventDefault();
          selectValue();
        }}
        onChange={(event) => {
          const next = event.target.value.replace(/\D/g, "");
          setDraft(next);
          if (next === "") return;
          const parsed = Number.parseInt(next, 10);
          if (Number.isFinite(parsed) && parsed >= MIN_GUESTS) {
            onChange(clampGuests(parsed));
          }
        }}
        onBlur={() => {
          setEditing(false);
          applyGuests(Number.parseInt(draft, 10));
        }}
        required
      />
      <button
        type="button"
        disabled={value >= MAX_GUESTS}
        onClick={() => applyGuests(value + 1)}
        className="flex w-11 shrink-0 items-center justify-center text-lg leading-none text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:text-gold/30 disabled:hover:bg-transparent"
        aria-label={t("increaseGuests", lang)}
      >
        +
      </button>
    </div>
  );
}

export function ReserveTableModal({
  open,
  onClose,
  restaurantId,
  lang,
}: ReserveTableModalProps) {
  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(emptyForm());
      setError(null);
      setSuccess(false);
    }
  }

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    if (
      !form.customerName.trim() ||
      !form.mobileNumber.trim() ||
      !form.reservationDate ||
      !form.reservationTime ||
      form.guests < MIN_GUESTS
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createReservation({
      restaurantId,
      customerName: form.customerName,
      mobileNumber: form.mobileNumber,
      email: form.email.trim() || undefined,
      reservationDate: form.reservationDate,
      reservationTime: form.reservationTime,
      guests: form.guests,
      specialRequests: form.specialRequests.trim() || undefined,
      reservationType: form.reservationType,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setSuccess(true);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="reserve-table-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/15 bg-surface-elevated p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            dir={lang === "ar" ? "rtl" : "ltr"}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute end-4 top-4 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
              aria-label={t("close", lang)}
            >
              ✕
            </button>

            {success ? (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl text-emerald-400">
                  ✓
                </span>
                <h2 className="mt-5 font-serif text-2xl font-bold text-white">
                  {t("reservationSuccessTitle", lang)}
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/55">
                  {t("reservationSuccessDesc", lang)}
                </p>
                <div className="mt-7 flex w-full flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(emptyForm());
                      setSuccess(false);
                    }}
                    className="menu-btn-secondary flex-1"
                  >
                    {t("reserveAnother", lang)}
                  </button>
                  <button type="button" onClick={handleClose} className="menu-btn-primary flex-1">
                    {t("close", lang)}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="pe-8 font-serif text-2xl font-bold text-white">
                  {t("reserveTableTitle", lang)}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  {t("reserveTableDesc", lang)}
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="reserve-name" className={fieldLabelClass}>
                      {t("customerName", lang)} *
                    </label>
                    <input
                      id="reserve-name"
                      className={fieldInputClass}
                      value={form.customerName}
                      onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="reserve-mobile" className={fieldLabelClass}>
                        {t("mobileNumber", lang)} *
                      </label>
                      <input
                        id="reserve-mobile"
                        type="tel"
                        className={fieldInputClass}
                        value={form.mobileNumber}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, mobileNumber: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="reserve-email" className={fieldLabelClass}>
                        {t("emailOptional", lang)}
                      </label>
                      <input
                        id="reserve-email"
                        type="email"
                        className={fieldInputClass}
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid items-end gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="reserve-date" className={fieldLabelClass}>
                        {t("reservationDate", lang)} *
                      </label>
                      <input
                        id="reserve-date"
                        type="date"
                        min={todayIsoDate()}
                        className={`${fieldInputClass} min-h-[42px]`}
                        value={form.reservationDate}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, reservationDate: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="reserve-time" className={fieldLabelClass}>
                        {t("reservationTime", lang)} *
                      </label>
                      <input
                        id="reserve-time"
                        type="time"
                        className={`${fieldInputClass} min-h-[42px]`}
                        value={form.reservationTime}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, reservationTime: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="reserve-guests" className={fieldLabelClass}>
                        {t("guests", lang)} *
                      </label>
                      <GuestStepper
                        id="reserve-guests"
                        value={form.guests}
                        lang={lang}
                        onChange={(guests) => setForm((p) => ({ ...p, guests }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reserve-type" className={fieldLabelClass}>
                      {t("reservationType", lang)}
                    </label>
                    <select
                      id="reserve-type"
                      className={`${fieldInputClass} appearance-none`}
                      value={form.reservationType}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          reservationType: e.target.value as PublicReservationType,
                        }))
                      }
                    >
                      {PUBLIC_RESERVATION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {RESERVATION_TYPE_LABELS[type][lang]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="reserve-notes" className={fieldLabelClass}>
                      {t("specialRequests", lang)}
                    </label>
                    <textarea
                      id="reserve-notes"
                      rows={3}
                      className={`${fieldInputClass} min-h-[80px] resize-y`}
                      placeholder={t("specialRequestsPlaceholder", lang)}
                      value={form.specialRequests}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, specialRequests: e.target.value }))
                      }
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-400" role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="menu-btn-primary w-full disabled:opacity-60"
                  >
                    {submitting ? t("submittingReservation", lang) : t("submitReservation", lang)}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

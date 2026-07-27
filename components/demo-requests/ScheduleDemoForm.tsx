"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthInput } from "@/components/auth/AuthInput";
import {
  CURRENT_MENU_TYPE_OPTIONS,
  PREFERRED_TIME_OPTIONS,
  RESTAURANT_TYPE_OPTIONS,
  SUCCESS_CONFIRMATION_CARDS,
  createEmptyDemoRequestForm,
} from "@/lib/demo-requests/constants";
import { createDemoRequest } from "@/lib/demo-requests/createDemoRequest";
import type {
  DemoRequestFormData,
  DemoRequestFormErrors,
} from "@/lib/demo-requests/types";
import { validateDemoRequestForm } from "@/lib/demo-requests/validation";

const selectClass = "auth-input w-full appearance-none cursor-pointer";
const fieldLabelClass =
  "block text-xs font-medium uppercase tracking-wider text-white/45";

function FieldError({ id, error }: { id: string; error?: string }) {
  return (
    <AnimatePresence mode="wait">
      {error ? (
        <motion.p
          id={id}
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.2 }}
          className="text-xs text-red-400"
          role="alert"
        >
          {error}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}

function CheckIcon() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="M4.5 10.5l3.5 3.5 7.5-8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function DemoSuccessScreen() {
  return (
    <AuthCard>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-8 w-8"
            aria-hidden="true"
          >
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">
          Thank You!
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55 sm:text-base">
          We&apos;ve received your demo request.
          <br />
          Our team will contact you shortly to confirm your visit.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {SUCCESS_CONFIRMATION_CARDS.map((label, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.12 + index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center gap-3 rounded-xl border border-gold/15 bg-black/30 px-4 py-3.5 text-start"
            >
              <CheckIcon />
              <span className="text-sm font-medium text-white/85">{label}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="auth-btn-secondary inline-flex w-full items-center justify-center sm:w-auto sm:min-w-[220px]"
          >
            Back to Home
          </Link>
        </div>
      </motion.div>
    </AuthCard>
  );
}

export function ScheduleDemoForm() {
  const [form, setForm] = useState<DemoRequestFormData>(
    createEmptyDemoRequestForm,
  );
  const [errors, setErrors] = useState<DemoRequestFormErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof DemoRequestFormData>(
    key: K,
    value: DemoRequestFormData[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (errors[key]) {
      setErrors((previous) => ({ ...previous, [key]: undefined }));
    }
    setFormError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors = validateDemoRequestForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setFormError("");

    const result = await createDemoRequest(form);
    setLoading(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return <DemoSuccessScreen />;
  }

  return (
    <AuthCard>
      <div className="mb-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Free On-Site Demo
        </p>
      </div>

      <AuthHeader
        title="Schedule Your Free Demo"
        subtitle="See how Aljamali QR can modernize your restaurant with digital menus, QR codes and powerful analytics."
      />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthInput
            id="restaurant-name"
            label="Restaurant Name *"
            placeholder="Saffron Garden"
            value={form.restaurantName}
            onChange={(event) => update("restaurantName", event.target.value)}
            error={errors.restaurantName}
            autoComplete="organization"
          />
          <AuthInput
            id="contact-person"
            label="Contact Person *"
            placeholder="Ahmed Al-Rashid"
            value={form.contactPerson}
            onChange={(event) => update("contactPerson", event.target.value)}
            error={errors.contactPerson}
            autoComplete="name"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthInput
            id="mobile-number"
            label="Mobile Number *"
            type="tel"
            placeholder="+965 5000 0000"
            value={form.mobileNumber}
            onChange={(event) => update("mobileNumber", event.target.value)}
            error={errors.mobileNumber}
            autoComplete="tel"
          />
          <AuthInput
            id="email-address"
            label="Email Address"
            type="email"
            placeholder="you@restaurant.com"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            error={errors.email}
            autoComplete="email"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthInput
            id="city"
            label="City"
            placeholder="Kuwait City"
            value={form.city}
            onChange={(event) => update("city", event.target.value)}
            error={errors.city}
            autoComplete="address-level2"
          />

          <div className="space-y-1.5">
            <label htmlFor="restaurant-type" className={fieldLabelClass}>
              Restaurant Type
            </label>
            <select
              id="restaurant-type"
              className={`${selectClass} ${
                errors.restaurantType
                  ? "border-red-500/40 focus:border-red-500/50 focus:ring-red-500/20"
                  : ""
              }`}
              value={form.restaurantType}
              onChange={(event) => update("restaurantType", event.target.value)}
              aria-invalid={errors.restaurantType ? true : undefined}
              aria-describedby={
                errors.restaurantType ? "restaurant-type-error" : undefined
              }
            >
              <option value="">Select type</option>
              {RESTAURANT_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FieldError id="restaurant-type-error" error={errors.restaurantType} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthInput
            id="number-of-branches"
            label="Number of Branches"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            placeholder="1"
            value={form.branches}
            onChange={(event) => update("branches", event.target.value)}
            error={errors.branches}
          />

          <div className="space-y-1.5">
            <label htmlFor="current-menu" className={fieldLabelClass}>
              Current Menu
            </label>
            <select
              id="current-menu"
              className={selectClass}
              value={form.currentMenuType}
              onChange={(event) => update("currentMenuType", event.target.value)}
            >
              <option value="">Select current menu</option>
              {CURRENT_MENU_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthInput
            id="preferred-visit-date"
            label="Preferred Visit Date *"
            type="date"
            value={form.preferredDate}
            onChange={(event) => update("preferredDate", event.target.value)}
            error={errors.preferredDate}
          />

          <div className="space-y-1.5">
            <label htmlFor="preferred-time" className={fieldLabelClass}>
              Preferred Visit Time *
            </label>
            <select
              id="preferred-time"
              className={`${selectClass} ${
                errors.preferredTime
                  ? "border-red-500/40 focus:border-red-500/50 focus:ring-red-500/20"
                  : ""
              }`}
              value={form.preferredTime}
              onChange={(event) => update("preferredTime", event.target.value)}
              aria-invalid={errors.preferredTime ? true : undefined}
              aria-describedby={
                errors.preferredTime ? "preferred-time-error" : undefined
              }
            >
              <option value="">Select time</option>
              {PREFERRED_TIME_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FieldError id="preferred-time-error" error={errors.preferredTime} />
          </div>
        </div>

        <AuthInput
          id="alternative-date"
          label="Alternative Date"
          type="date"
          value={form.alternateDate}
          onChange={(event) => update("alternateDate", event.target.value)}
          error={errors.alternateDate}
        />

        <div className="space-y-1.5">
          <label htmlFor="additional-notes" className={fieldLabelClass}>
            Additional Notes
          </label>
          <textarea
            id="additional-notes"
            rows={5}
            className="auth-input w-full resize-y min-h-[140px]"
            placeholder="Tell us about your restaurant, goals, or any special requests..."
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
          />
        </div>

        {formError ? (
          <p className="text-sm text-red-400" role="alert">
            {formError}
          </p>
        ) : null}

        <AuthButton type="submit" loading={loading}>
          Schedule My Free Demo
        </AuthButton>

        <p className="text-center text-xs text-white/35">
          No obligation. Our team will confirm your visit by phone or email.
        </p>
      </form>
    </AuthCard>
  );
}

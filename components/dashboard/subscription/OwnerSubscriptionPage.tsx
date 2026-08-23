"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { useSubscriptionAccess } from "@/components/dashboard/SubscriptionAccessProvider";
import {
  ensureRestaurantSubscription,
  fetchOwnerSubscription,
  type RestaurantSubscription,
  type SubscriptionPlan,
} from "@/lib/admin/subscriptions";
import {
  fetchPaymentsForRestaurant,
  formatPaymentAmount,
  type PaymentItem,
} from "@/lib/admin/payments";
import { formatDemoDate } from "@/lib/demo-requests/utils";
import { pricingPlans } from "@/lib/landing-data";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { getSubscriptionAccess } from "@/lib/subscriptions/engine";
import {
  DEFAULT_TRIAL_PLAN,
  SUBSCRIPTION_PLANS,
  formatPlanAmountKd,
  formatPlanPriceLabel,
  formatRestaurantUsage,
  isPayablePlan,
  isSubscriptionPlanId,
  type SubscriptionPlanId,
} from "@/lib/subscriptions/plans";

const SUPPORT_EMAIL = "support@aljamaliqr.com";
const SALES_EMAIL = "aljamaliqr@gmail.com";

function planFeatureLabels(planId: SubscriptionPlanId): string[] {
  const marketing = pricingPlans.find(
    (p) => p.id === SUBSCRIPTION_PLANS[planId].id,
  );
  if (!marketing) return [];
  return [
    ...marketing.features.map((f) => f.label),
    ...(marketing.premiumFeatures?.map((f) => f.label) ?? []),
  ];
}

function statusLabel(status: string): string {
  if (status === "suspended") return "Trial ended";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusTone(status: string): string {
  switch (status) {
    case "active":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "trial":
      return "border-gold/35 bg-gold/10 text-gold";
    case "grace":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "expired":
    case "cancelled":
    case "suspended":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    default:
      return "border-white/10 bg-white/5 text-white/60";
  }
}

function invoiceStatusClass(status: PaymentItem["status"] | "paid" | "pending"): string {
  switch (status) {
    case "paid":
      return "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "overdue":
      return "border border-red-500/30 bg-red-500/10 text-red-300";
    case "refunded":
      return "border border-white/10 bg-white/5 text-white/45";
    default:
      return "border border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
}

export function OwnerSubscriptionPage() {
  const { showToast } = useToast();
  const {
    restaurant,
    restaurantCount,
    loading: restaurantLoading,
  } = useRestaurant();
  const { refresh: refreshAccess } = useSubscriptionAccess();
  const plansRef = useRef<HTMLElement | null>(null);

  const [subscription, setSubscription] =
    useState<RestaurantSubscription | null>(null);
  const [invoices, setInvoices] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmPlan, setConfirmPlan] = useState<SubscriptionPlan | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!restaurant?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const [subResult, invoicesResult] = await Promise.all([
      fetchOwnerSubscription(restaurant.id),
      fetchPaymentsForRestaurant(restaurant.id),
    ]);

    let subData = subResult.ok ? subResult.data : null;
    if (subResult.ok && !subResult.data) {
      const storedPlan = restaurant.subscription_plan;
      const ensured = await ensureRestaurantSubscription(
        restaurant.id,
        isSubscriptionPlanId(typeof storedPlan === "string" ? storedPlan : "")
          ? (storedPlan as SubscriptionPlan)
          : DEFAULT_TRIAL_PLAN,
      );
      if (ensured.ok) subData = ensured.data;
    }

    setLoading(false);

    if (!subResult.ok && !subData) {
      setError(subResult.ok ? "Unable to load subscription." : subResult.message);
      setSubscription(null);
      return;
    }

    setSubscription(subData);
    setInvoices(invoicesResult.ok ? invoicesResult.data : []);
    await refreshAccess();
  }, [restaurant, refreshAccess]);

  useEffect(() => {
    void load();
  }, [load]);

  const openSalesContact = () => {
    const mailto = `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(
      "Enterprise plan inquiry",
    )}${
      restaurant
        ? `&body=${encodeURIComponent(
            `Restaurant: ${restaurant.restaurant_name ?? ""} (${restaurant.id})\n\nI'd like to discuss the Enterprise plan.`,
          )}`
        : ""
    }`;
    if (typeof window !== "undefined") {
      window.open(mailto, "_blank");
    }
    showToast("Opening sales contact...");
  };

  const openSupportRequest = (subject: string) => {
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}${
      restaurant
        ? `&body=${encodeURIComponent(`Restaurant: ${restaurant.restaurant_name ?? ""} (${restaurant.id})`)}`
        : ""
    }`;
    if (typeof window !== "undefined") {
      window.open(mailto, "_blank");
    }
    showToast("Opening support request...");
  };

  const scrollToPlans = () => {
    plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startMyFatoorahPayment = async (plan: SubscriptionPlan) => {
    if (!restaurant?.id || paying) return;
    if (plan === "Enterprise") {
      openSalesContact();
      return;
    }

    setPaying(true);
    setPaymentError(null);

    try {
      const response = await fetch("/api/payments/myfatoorah/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          plan,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        paymentUrl?: string;
        error?: string;
      } | null;

      if (!response.ok || !payload?.paymentUrl) {
        const message =
          payload?.error?.trim() ||
          "We couldn't start your payment. Please try again in a moment.";
        setPaymentError(message);
        showToast(message, "error");
        return;
      }

      window.location.assign(payload.paymentUrl);
    } catch {
      const message =
        "We couldn't reach the payment service. Please check your connection and try again.";
      setPaymentError(message);
      showToast(message, "error");
    } finally {
      setPaying(false);
      setConfirmPlan(null);
    }
  };

  const access = useMemo(() => {
    if (!subscription) return null;
    return getSubscriptionAccess({
      plan: subscription.plan,
      status: subscription.status,
      trialStartedAt: subscription.trialStartedAt,
      trialEndsAt: subscription.trialEndsAt,
      gracePeriodDays: subscription.gracePeriodDays,
      renewalDate: subscription.renewalDate,
      cancelledAt: subscription.cancelledAt,
    });
  }, [subscription]);

  if (restaurantLoading || loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="dashboard-card rounded-2xl p-6 sm:p-8">
          <FormSkeleton />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-5xl py-16 text-center">
        <p className="text-sm text-white/50">
          Complete restaurant onboarding to view your subscription.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl py-16 text-center">
        <p className="text-sm text-white/50">{error}</p>
        <button
          type="button"
          className="menu-btn-primary mt-6"
          onClick={() => void load()}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Canonical plan from restaurant_subscriptions (Billing source of truth).
  const currentPlan: SubscriptionPlan = isSubscriptionPlanId(
    subscription?.plan ?? restaurant.subscription_plan ?? "",
  )
    ? ((subscription?.plan ?? restaurant.subscription_plan) as SubscriptionPlan)
    : DEFAULT_TRIAL_PLAN;
  const effectiveStatus = access?.effectiveStatus ?? subscription?.status ?? "trial";
  const daysRemaining =
    access?.trialDaysLeft ?? access?.graceDaysLeft ?? null;
  const monthlyPriceLabel = formatPlanPriceLabel(currentPlan);
  const restaurantUsageLabel = formatRestaurantUsage(
    currentPlan,
    restaurantCount,
  );
  const thisLocationCovered = subscription?.isCovered !== false;

  const isExpired =
    effectiveStatus === "expired" ||
    effectiveStatus === "cancelled" ||
    effectiveStatus === "suspended";
  const isTrial = effectiveStatus === "trial";
  const isActive =
    effectiveStatus === "active" || effectiveStatus === "grace";

  const historyRows = invoices.map((invoice) => ({
    id: invoice.id,
    invoice:
      invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`,
    date: formatDemoDate(invoice.paidAt ?? invoice.createdAt),
    plan: currentPlan,
    amount: formatPaymentAmount(invoice.amount, invoice.currency),
    status: invoice.status,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
          Billing
        </h1>
        <p className="mt-1 text-sm text-white/45">
          Manage your subscription, upgrade plans, and review payment history.
        </p>
      </div>

      {isExpired ? (
        <div className="rounded-2xl border border-red-500/35 bg-gradient-to-b from-red-500/15 to-black/40 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">
            Subscription required
          </p>
          <h2 className="mt-3 font-serif text-2xl font-bold text-white sm:text-3xl">
            {effectiveStatus === "suspended"
              ? "Your trial has ended. Choose a plan to continue."
              : "Your subscription has ended. Choose a plan to continue."}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/55">
            Professional features are paused until you choose a paid plan. You
            will not be charged automatically.
          </p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-start">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                Starter · {formatPlanPriceLabel("Starter")}
              </dt>
              <dd className="mt-1 text-sm text-white/70">
                QR menus, categories, and restaurant settings for one location.
              </dd>
            </div>
            <div className="rounded-xl border border-gold/25 bg-gold/5 px-4 py-3 text-start">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                Professional · {formatPlanPriceLabel("Professional")}
              </dt>
              <dd className="mt-1 text-sm text-white/70">
                Online ordering, kitchen display, loyalty, marketing, and
                reviews.
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={scrollToPlans}
            className="menu-btn-primary mt-6"
          >
            Choose a Plan
          </button>
        </div>
      ) : null}

      {/* Current Plan */}
      <section className="dashboard-card relative overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-b from-gold/[0.08] via-black/50 to-black/60 p-6 sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_55%)]"
          aria-hidden="true"
        />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-white/40">
                Current Plan
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-white">
                {currentPlan}
              </h2>
              {isTrial ? (
                <p className="mt-2 max-w-xl text-sm text-white/55">
                  You are on a {currentPlan} trial with full {currentPlan}{" "}
                  features. You will not be charged until you choose a paid plan.
                </p>
              ) : null}
              {effectiveStatus === "suspended" ? (
                <p className="mt-2 max-w-xl text-sm text-white/55">
                  Your trial has ended. This restaurant currently has
                  Starter-level access until you choose a paid plan.
                </p>
              ) : null}
            </div>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${statusTone(effectiveStatus)}`}
            >
              {statusLabel(effectiveStatus)}
            </span>
          </div>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/5 bg-black/25 px-4 py-3">
              <dt className="text-[11px] uppercase tracking-wider text-white/40">
                Trial end date
              </dt>
              <dd className="mt-1 text-sm text-white/85">
                {formatDemoDate(subscription?.trialEndsAt)}
              </dd>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/25 px-4 py-3">
              <dt className="text-[11px] uppercase tracking-wider text-white/40">
                Renewal date
              </dt>
              <dd className="mt-1 text-sm text-white/85">
                {formatDemoDate(subscription?.renewalDate)}
              </dd>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/25 px-4 py-3">
              <dt className="text-[11px] uppercase tracking-wider text-white/40">
                Monthly price
              </dt>
              <dd className="mt-1 text-sm font-medium text-gold">
                {isTrial ? "No charge during trial" : monthlyPriceLabel}
              </dd>
              {isTrial ? (
                <p className="mt-1 text-xs text-white/40">
                  {monthlyPriceLabel} after you subscribe
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-white/5 bg-black/25 px-4 py-3">
              <dt className="text-[11px] uppercase tracking-wider text-white/40">
                Restaurants
              </dt>
              <dd className="mt-1 text-sm text-white/85">
                {restaurantUsageLabel}
              </dd>
              {!thisLocationCovered ? (
                <p className="mt-2 text-xs text-amber-200/80">
                  This restaurant is not covered by your {currentPlan} plan.
                  Upgrade to Enterprise to cover additional restaurants.
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-white/5 bg-black/25 px-4 py-3">
              <dt className="text-[11px] uppercase tracking-wider text-white/40">
                Grace period
              </dt>
              <dd className="mt-1 text-sm text-white/85">
                {subscription?.gracePeriodDays ?? 3} days
              </dd>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/25 px-4 py-3">
              <dt className="text-[11px] uppercase tracking-wider text-white/40">
                Days remaining
              </dt>
              <dd className="mt-1 text-sm text-white/85">
                {daysRemaining === null
                  ? "—"
                  : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`}
              </dd>
            </div>
          </dl>

          {!isExpired ? (
            <div className="mt-6 flex flex-wrap gap-3 border-t border-white/5 pt-6">
              {isTrial ? (
                <>
                  <button
                    type="button"
                    onClick={scrollToPlans}
                    className="menu-btn-primary text-xs sm:text-sm"
                  >
                    Choose a Plan
                  </button>
                  {isPayablePlan(currentPlan) ? (
                    <button
                      type="button"
                      onClick={() => setConfirmPlan(currentPlan)}
                      disabled={paying}
                      className="menu-btn-secondary text-xs sm:text-sm disabled:opacity-60"
                    >
                      {`Renew ${currentPlan} · ${formatPlanAmountKd(currentPlan)}`}
                    </button>
                  ) : null}
                </>
              ) : null}

              {isActive ? (
                <>
                  <button
                    type="button"
                    onClick={scrollToPlans}
                    className="menu-btn-primary text-xs sm:text-sm"
                  >
                    Manage Subscription
                  </button>
                  <button
                    type="button"
                    onClick={scrollToPlans}
                    className="menu-btn-secondary text-xs sm:text-sm"
                  >
                    Change Plan
                  </button>
                  {isPayablePlan(currentPlan) ? (
                    <button
                      type="button"
                      onClick={() => setConfirmPlan(currentPlan)}
                      disabled={paying}
                      className="menu-btn-secondary text-xs sm:text-sm disabled:opacity-60"
                    >
                      {`Renew ${currentPlan} · ${formatPlanAmountKd(currentPlan)}`}
                    </button>
                  ) : null}
                </>
              ) : null}

              {subscription?.status !== "cancelled" ? (
                <button
                  type="button"
                  onClick={() => openSupportRequest("Cancel my subscription")}
                  className="menu-btn-danger text-xs sm:text-sm"
                  disabled={paying}
                >
                  Cancel Subscription
                </button>
              ) : null}
            </div>
          ) : null}

          {paymentError ? (
            <p className="mt-4 text-sm text-red-300" role="alert">
              {paymentError}
            </p>
          ) : null}
        </div>
      </section>

      {/* Available Plans */}
      <section ref={plansRef} className="scroll-mt-6">
        <div className="mb-5">
          <h2 className="font-serif text-xl font-bold text-white sm:text-2xl">
            Available Plans
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Choose Starter or Professional to pay securely. Enterprise is
            contact-sales only.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Same `pricingPlans` catalog as Landing — Starter / Professional / Enterprise only. */}
          {pricingPlans.map((marketing) => {
            const plan = marketing.name as SubscriptionPlanId;
            const catalog = SUBSCRIPTION_PLANS[plan];
            const isCurrent = plan === currentPlan && !isExpired;
            const isEnterprise = catalog.contactSales;
            const isPopular = catalog.highlighted;
            const features = planFeatureLabels(plan);
            // Exact Landing monthly display: "8 KWD / month" | "Contact Us"
            const priceLabel = marketing.monthlySuffix
              ? `${marketing.monthlyPrice} ${marketing.monthlySuffix}`
              : marketing.monthlyPrice;

            return (
              <article
                key={marketing.id}
                className={`relative flex h-full flex-col rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300 ${
                  isPopular
                    ? "border-gold/45 bg-gradient-to-b from-gold/[0.12] to-black/50 shadow-[0_16px_48px_rgba(212,175,55,0.12)]"
                    : "border-gold/20 bg-black/35"
                }`}
              >
                {marketing.badge ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black shadow-lg shadow-gold/25">
                    {marketing.badge}
                  </span>
                ) : null}

                <h3 className="font-serif text-2xl font-bold text-white">
                  {marketing.name}
                </h3>
                <p className="mt-1 text-sm text-white/50">{marketing.subtitle}</p>

                <div className="mt-5">
                  <p
                    className={`font-serif text-3xl font-bold ${
                      isEnterprise ? "text-gold" : "text-white"
                    }`}
                  >
                    {priceLabel}
                  </p>
                </div>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {features.slice(0, 8).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-white/65"
                    >
                      <span className="mt-0.5 text-gold" aria-hidden="true">
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {isEnterprise ? (
                    <button
                      type="button"
                      onClick={openSalesContact}
                      className="menu-btn-secondary w-full text-sm"
                    >
                      Contact Sales
                    </button>
                  ) : isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="menu-btn-secondary w-full cursor-not-allowed text-sm opacity-50"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmPlan(plan)}
                      disabled={paying}
                      className={`w-full text-sm disabled:opacity-60 ${
                        isPopular ? "menu-btn-primary" : "menu-btn-secondary"
                      }`}
                    >
                      {plan === "Professional"
                        ? "Upgrade"
                        : `Choose Starter · ${formatPlanAmountKd("Starter")}`}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Payment History */}
      <section className="dashboard-card rounded-2xl p-6 sm:p-8">
        <div>
            <h2 className="font-serif text-xl font-bold text-white">
              Payment History
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Invoices and payment status for your restaurant.
            </p>
        </div>

        {historyRows.length === 0 ? (
          <p className="mt-5 text-sm text-white/45">
            No payments yet. Invoices will appear here after you subscribe.
          </p>
        ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
                <th className="pb-3 pr-4 font-medium">Invoice</th>
                <th className="pb-3 pr-4 font-medium">Date</th>
                <th className="pb-3 pr-4 font-medium">Plan</th>
                <th className="pb-3 pr-4 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="py-3.5 pr-4 font-medium text-white">
                    {row.invoice}
                  </td>
                  <td className="py-3.5 pr-4 text-white/60">{row.date}</td>
                  <td className="py-3.5 pr-4 text-white/70">{row.plan}</td>
                  <td className="py-3.5 pr-4 font-serif text-gold">
                    {row.amount}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${invoiceStatusClass(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </section>

      {/* Confirmation modal */}
      {confirmPlan && confirmPlan !== "Enterprise" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-plan-title"
          onClick={() => {
            if (!paying) setConfirmPlan(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gold/30 bg-[#0d0d0d] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.65)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              id="confirm-plan-title"
              className="font-serif text-2xl font-bold text-white"
            >
              {confirmPlan === "Professional"
                ? "Upgrade to Professional"
                : `Choose ${confirmPlan}`}
            </h3>
            <dl className="mt-6 space-y-3 rounded-xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm text-white/50">Plan</dt>
                <dd className="text-sm font-medium text-white">{confirmPlan}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-sm text-white/50">Monthly Price</dt>
                <dd className="font-serif text-lg font-bold text-gold">
                  {formatPlanPriceLabel(confirmPlan)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              You will immediately activate this subscription after successful
              payment.
            </p>
            {paymentError ? (
              <p className="mt-3 text-sm text-red-300" role="alert">
                {paymentError}
              </p>
            ) : null}
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmPlan(null)}
                disabled={paying}
                className="menu-btn-secondary text-sm disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void startMyFatoorahPayment(confirmPlan)}
                disabled={paying}
                className="menu-btn-primary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                {paying ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    Preparing payment…
                  </>
                ) : (
                  "Proceed to Payment"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

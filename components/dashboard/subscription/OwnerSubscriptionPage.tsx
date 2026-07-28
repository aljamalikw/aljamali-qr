"use client";

import { useCallback, useEffect, useState } from "react";
import { FormSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  ensureRestaurantSubscription,
  fetchOwnerSubscription,
  SUBSCRIPTION_PLANS,
  type RestaurantSubscription,
  type SubscriptionPlan,
} from "@/lib/admin/subscriptions";
import {
  fetchPaymentsForRestaurant,
  formatPaymentAmount,
  type PaymentItem,
} from "@/lib/admin/payments";
import { fetchQrOverviewStats } from "@/lib/qr-analytics/queries";
import { formatDemoDate } from "@/lib/demo-requests/utils";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { getSubscriptionAccess } from "@/lib/subscriptions/engine";
import {
  getPlanMonthlyPrices,
  PLAN_PRICES,
} from "@/lib/subscriptions/pricing";
import { useSubscriptionAccess } from "@/components/dashboard/SubscriptionAccessProvider";

const SUPPORT_EMAIL = "support@aljamaliqr.com";

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function invoiceStatusClass(status: PaymentItem["status"]): string {
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
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const { refresh: refreshAccess } = useSubscriptionAccess();
  const [subscription, setSubscription] =
    useState<RestaurantSubscription | null>(null);
  const [invoices, setInvoices] = useState<PaymentItem[]>([]);
  const [qrCount, setQrCount] = useState<number>(0);
  const [planPrices, setPlanPrices] =
    useState<Record<SubscriptionPlan, number>>(PLAN_PRICES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!restaurant?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const [subResult, invoicesResult, qrStatsResult, prices] =
      await Promise.all([
        fetchOwnerSubscription(restaurant.id),
        fetchPaymentsForRestaurant(restaurant.id),
        fetchQrOverviewStats(restaurant.id, restaurant.timezone),
        getPlanMonthlyPrices(),
      ]);

    setPlanPrices(prices);

    let subData = subResult.ok ? subResult.data : null;
    if (subResult.ok && !subResult.data) {
      const ensured = await ensureRestaurantSubscription(restaurant.id);
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
    setQrCount(qrStatsResult.ok ? qrStatsResult.data.total : 0);
    await refreshAccess();
  }, [restaurant, refreshAccess]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const startMyFatoorahPayment = async (plan: SubscriptionPlan) => {
    if (!restaurant?.id || paying) return;

    setPaying(true);
    setPaymentError(null);
    setSelectedPlan(plan);

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
    }
  };

  if (restaurantLoading || loading) {
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
          Complete restaurant onboarding to view your subscription.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
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

  const currentPlan =
    subscription?.plan ??
    (restaurant.subscription_plan as SubscriptionPlan) ??
    "Starter";
  const planForPayment = selectedPlan ?? currentPlan;

  const access = subscription
    ? getSubscriptionAccess({
        plan: subscription.plan,
        status: subscription.status,
        trialStartedAt: subscription.trialStartedAt,
        trialEndsAt: subscription.trialEndsAt,
        gracePeriodDays: subscription.gracePeriodDays,
        renewalDate: subscription.renewalDate,
        cancelledAt: subscription.cancelledAt,
      })
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
          Billing
        </h1>
        <p className="mt-1 text-sm text-white/45">
          Your current plan, trial window, and billing details for Aljamali QR.
        </p>
      </div>

      {access?.message && (
        <div
          className={`rounded-2xl border p-4 sm:p-5 ${
            access.effectiveStatus === "expired" ||
            access.effectiveStatus === "cancelled" ||
            (access.trialDaysLeft !== null && access.trialDaysLeft <= 3)
              ? "border-red-500/30 bg-red-500/10"
              : "border-gold/25 bg-gold/10"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              access.effectiveStatus === "expired" ||
              access.effectiveStatus === "cancelled"
                ? "text-red-300"
                : "text-gold"
            }`}
          >
            {access.message}
          </p>
          <button
            type="button"
            onClick={() => void startMyFatoorahPayment(planForPayment)}
            disabled={paying}
            className="menu-btn-primary mt-3 inline-flex items-center gap-2 text-xs disabled:opacity-60"
          >
            {paying ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                Preparing payment…
              </>
            ) : (
              "Pay Now"
            )}
          </button>
        </div>
      )}

      <div className="dashboard-card rounded-2xl p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.15em] text-white/40">
          Current plan
        </p>
        <h2 className="mt-2 font-serif text-3xl text-white">{currentPlan}</h2>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-white/40">
              Status
            </dt>
            <dd className="mt-1 text-sm text-gold">
              {subscription
                ? statusLabel(subscription.status)
                : restaurant.is_active === false
                  ? "Suspended"
                  : "Active"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-white/40">
              Monthly price
            </dt>
            <dd className="mt-1 text-sm text-white/80">
              {formatPaymentAmount(
                subscription?.monthlyPrice ??
                  planPrices[currentPlan] ??
                  19,
                subscription?.currency ?? restaurant.currency ?? "KWD",
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-white/40">
              Trial ends
            </dt>
            <dd className="mt-1 text-sm text-white/80">
              {formatDemoDate(subscription?.trialEndsAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-white/40">
              Grace period
            </dt>
            <dd className="mt-1 text-sm text-white/80">
              {subscription?.gracePeriodDays ?? 3} days
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-white/40">
              Renewal date
            </dt>
            <dd className="mt-1 text-sm text-white/80">
              {formatDemoDate(subscription?.renewalDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-white/40">
              Started
            </dt>
            <dd className="mt-1 text-sm text-white/80">
              {formatDemoDate(
                subscription?.trialStartedAt ??
                  subscription?.startedAt ??
                  restaurant.created_at,
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-white/5 pt-6">
          <button
            type="button"
            onClick={() => void startMyFatoorahPayment(planForPayment)}
            disabled={paying}
            className="menu-btn-primary inline-flex items-center gap-2 text-xs disabled:opacity-60"
          >
            {paying ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                Preparing payment…
              </>
            ) : (
              "Pay Now"
            )}
          </button>
          <button
            type="button"
            onClick={() => openSupportRequest("Change my subscription plan")}
            className="menu-btn-secondary text-xs"
            disabled={paying}
          >
            Change Plan
          </button>
          {subscription?.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => openSupportRequest("Cancel my subscription")}
              className="menu-btn-danger text-xs"
              disabled={paying}
            >
              Cancel Subscription
            </button>
          )}
        </div>
        {paymentError && (
          <p className="mt-4 text-sm text-red-300" role="alert">
            {paymentError}
          </p>
        )}
      </div>

      <div className="dashboard-card rounded-2xl p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.15em] text-white/40">Usage</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-4">
            <p className="text-xs uppercase tracking-wider text-white/40">
              QR codes
            </p>
            <p className="mt-1 font-serif text-2xl text-gold">{qrCount}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-4">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Languages enabled
            </p>
            <p className="mt-1 font-serif text-2xl text-gold">
              {restaurant.languages?.length || 1}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan: SubscriptionPlan) => {
          const isCurrent = plan === currentPlan;
          const isSelected = plan === planForPayment;
          return (
            <div
              key={plan}
              className={`rounded-2xl border p-5 ${
                isSelected
                  ? "border-gold/40 bg-gold/10"
                  : "border-gold/15 bg-black/25"
              }`}
            >
              <p className="font-serif text-xl text-white">{plan}</p>
              <p className="mt-2 text-sm text-white/60">
                {formatPaymentAmount(planPrices[plan])}/mo
              </p>
              {isCurrent ? (
                <p className="mt-4 text-xs uppercase tracking-wider text-gold">
                  Your plan
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan(plan);
                  void startMyFatoorahPayment(plan);
                }}
                disabled={paying}
                className="menu-btn-secondary mt-4 inline-flex w-full items-center justify-center gap-2 text-xs disabled:opacity-60"
              >
                {paying && isSelected ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Preparing…
                  </>
                ) : isCurrent ? (
                  "Renew"
                ) : (
                  `Pay for ${plan}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="dashboard-card rounded-2xl p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.15em] text-white/40">
          Invoices
        </p>
        {invoices.length === 0 ? (
          <p className="mt-4 text-sm text-white/45">No invoices yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-black/20 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {invoice.invoiceNumber ||
                      `Invoice ${invoice.id.slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-white/40">
                    {formatDemoDate(invoice.paidAt ?? invoice.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-serif text-gold">
                    {formatPaymentAmount(invoice.amount, invoice.currency)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs capitalize ${invoiceStatusClass(invoice.status)}`}
                  >
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import {
  generateRestaurantLoginLink,
  startImpersonation,
} from "@/lib/admin/impersonation-client";
import {
  adminCancelSubscription,
  adminExtendTrial,
  adminReactivateSubscription,
  adminResetTrial,
  adminUpgradeRestaurantPlan,
  fetchManageRestaurantDetails,
  type ManageRestaurantDetails,
} from "@/lib/admin/manage-restaurant";
import type { AdminRestaurantManagementRow } from "@/lib/admin/restaurants";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  formatTrialCountdown,
} from "@/lib/admin/restaurant-status";
import {
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "@/lib/admin/subscriptions";
import { formatDemoDate } from "@/lib/demo-requests/utils";

type LifecycleAction = "suspend" | "activate" | "archive" | "delete";

type SubscriptionAction =
  | "upgrade"
  | "extend"
  | "reset"
  | "cancel"
  | "reactivate"
  | null;

type ManageRestaurantDrawerProps = {
  restaurant: AdminRestaurantManagementRow;
  currentUserId: string | null;
  onClose: () => void;
  onChanged: () => Promise<void> | void;
  onRequestAction: (
    action: LifecycleAction,
    restaurant: AdminRestaurantManagementRow,
  ) => void;
  onImpersonateContinue: () => void;
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/30 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-white/40">{label}</p>
      <div className="mt-1 text-sm text-white/85">{value}</div>
    </div>
  );
}

export function ManageRestaurantDrawer({
  restaurant,
  currentUserId,
  onClose,
  onChanged,
  onRequestAction,
  onImpersonateContinue,
}: ManageRestaurantDrawerProps) {
  const { showToast } = useToast();
  const [details, setDetails] = useState<ManageRestaurantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<SubscriptionPlan>(
    (SUBSCRIPTION_PLANS.includes(restaurant.plan as SubscriptionPlan)
      ? restaurant.plan
      : "Starter") as SubscriptionPlan,
  );
  const [pendingSubAction, setPendingSubAction] =
    useState<SubscriptionAction>(null);
  const [loginLink, setLoginLink] = useState<string | null>(null);
  const [impersonateOpen, setImpersonateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchManageRestaurantDetails(restaurant.id);
    if (result.ok) {
      setDetails(result.data);
      if (result.data.subscription?.plan) {
        setUpgradePlan(result.data.subscription.plan);
      }
    } else {
      showToast(result.message, "error");
    }
    setLoading(false);
  }, [restaurant.id, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const name =
    details?.restaurant.restaurant_name?.trim() ||
    restaurant.restaurantName?.trim() ||
    "Unnamed restaurant";

  const trial = formatTrialCountdown(
    details?.subscription?.trialEndsAt ?? restaurant.trialEndsAt,
  );

  const trialRemaining =
    details?.subscription?.status === "trial" || restaurant.status === "trial"
      ? trial.remainingLabel
      : details?.subscription
        ? `${details.subscription.status}`
        : "—";

  const runSubscriptionAction = async () => {
    if (!pendingSubAction) return;
    setBusy(true);
    let result: { ok: true } | { ok: false; message: string };

    switch (pendingSubAction) {
      case "upgrade":
        result = await adminUpgradeRestaurantPlan(restaurant.id, upgradePlan);
        break;
      case "extend":
        result = await adminExtendTrial(restaurant.id, 7);
        break;
      case "reset":
        result = await adminResetTrial(restaurant.id);
        break;
      case "cancel":
        result = await adminCancelSubscription(restaurant.id);
        break;
      case "reactivate":
        result = await adminReactivateSubscription(restaurant.id);
        break;
      default:
        result = { ok: false, message: "Unknown action." };
    }

    setBusy(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    setPendingSubAction(null);
    showToast("Subscription updated");
    await load();
    await onChanged();
  };

  const handleGenerateLoginLink = async () => {
    setBusy(true);
    const result = await generateRestaurantLoginLink(restaurant.id);
    setBusy(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setLoginLink(result.link);
    try {
      await navigator.clipboard.writeText(result.link);
      showToast("Login link copied to clipboard");
    } catch {
      showToast("Login link generated");
    }
  };

  const handleConfirmImpersonate = async () => {
    setBusy(true);
    const result = await startImpersonation(restaurant.id, "Login as Restaurant");
    setBusy(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setImpersonateOpen(false);
    onImpersonateContinue();
  };

  const isOwn =
    Boolean(currentUserId) && restaurant.ownerId === currentUserId;

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <button
          type="button"
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          aria-label="Close manage drawer"
          onClick={onClose}
        />
        <aside className="relative z-10 flex h-full w-full max-w-none flex-col border-s border-gold/20 bg-[#0d0d0d] shadow-2xl sm:max-w-[520px]">
          <div className="flex items-start justify-between gap-3 border-b border-gold/10 px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-gold">
                Manage Restaurant
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-white">
                {name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-6">
            {loading || !details ? (
              <p className="text-sm text-white/45">Loading restaurant details…</p>
            ) : (
              <>
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold/90">
                    Restaurant Information
                  </h3>
                  <div className="grid gap-3">
                    <InfoRow label="Restaurant Name" value={name} />
                    <InfoRow
                      label="Logo"
                      value={
                        details.restaurant.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={details.restaurant.logo_url}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          "—"
                        )
                      }
                    />
                    <InfoRow label="Restaurant ID" value={details.restaurant.id} />
                    <InfoRow
                      label="Created Date"
                      value={formatDemoDate(details.restaurant.created_at)}
                    />
                    <InfoRow
                      label="Status"
                      value={
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[details.status]}`}
                        >
                          {STATUS_LABELS[details.status]}
                        </span>
                      }
                    />
                    <InfoRow
                      label="Current Plan"
                      value={details.subscription?.plan ?? restaurant.plan}
                    />
                    <InfoRow
                      label="Trial Ends"
                      value={
                        <div>
                          <p>{trial.dateLabel}</p>
                          {trial.remainingLabel ? (
                            <p className="mt-0.5 text-xs text-white/45">
                              {trial.remainingLabel}
                            </p>
                          ) : null}
                        </div>
                      }
                    />
                    <InfoRow
                      label="Subscription Renewal"
                      value={
                        details.subscription?.renewalDate
                          ? formatDemoDate(details.subscription.renewalDate)
                          : "—"
                      }
                    />
                    <InfoRow
                      label="Grace Period"
                      value={
                        details.subscription
                          ? `${details.subscription.gracePeriodDays} days`
                          : "—"
                      }
                    />
                    <InfoRow
                      label="Owner Name"
                      value={details.restaurant.owner_name || "—"}
                    />
                    <InfoRow
                      label="Owner Email"
                      value={details.restaurant.email || "—"}
                    />
                    <InfoRow
                      label="Owner Phone"
                      value={details.restaurant.phone || "—"}
                    />
                    <InfoRow
                      label="Public Menu URL"
                      value={
                        details.publicMenuUrl ? (
                          <Link
                            href={details.publicMenuUrl}
                            target="_blank"
                            className="break-all text-gold hover:underline"
                          >
                            {details.publicMenuUrl}
                          </Link>
                        ) : (
                          "—"
                        )
                      }
                    />
                    <InfoRow
                      label="QR Code Count"
                      value={String(details.counts.qrCodes)}
                    />
                    <InfoRow
                      label="Menu Item Count"
                      value={String(details.counts.menuItems)}
                    />
                    <InfoRow
                      label="Categories Count"
                      value={String(details.counts.categories)}
                    />
                    <InfoRow
                      label="Orders Count"
                      value={String(details.counts.orders)}
                    />
                    <InfoRow
                      label="Reservations Count"
                      value={String(details.counts.reservations)}
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold/90">
                    Subscription
                  </h3>
                  <div className="grid gap-3">
                    <InfoRow
                      label="Current Plan"
                      value={details.subscription?.plan ?? restaurant.plan}
                    />
                    <InfoRow label="Trial Remaining" value={trialRemaining} />
                    <div className="rounded-xl border border-white/5 bg-black/30 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wider text-white/40">
                        Upgrade Plan
                      </p>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <select
                          value={upgradePlan}
                          onChange={(event) =>
                            setUpgradePlan(event.target.value as SubscriptionPlan)
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-gold/35 focus:outline-none"
                        >
                          {SUBSCRIPTION_PLANS.map((plan) => (
                            <option key={plan} value={plan}>
                              {plan}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="menu-btn-secondary shrink-0"
                          disabled={busy}
                          onClick={() => setPendingSubAction("upgrade")}
                        >
                          Upgrade
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        className="menu-btn-secondary"
                        disabled={busy}
                        onClick={() => setPendingSubAction("extend")}
                      >
                        Extend Trial
                      </button>
                      <button
                        type="button"
                        className="menu-btn-secondary"
                        disabled={busy}
                        onClick={() => setPendingSubAction("reset")}
                      >
                        Reset Trial
                      </button>
                      <button
                        type="button"
                        className="menu-btn-secondary"
                        disabled={busy}
                        onClick={() => setPendingSubAction("cancel")}
                      >
                        Cancel Subscription
                      </button>
                      <button
                        type="button"
                        className="menu-btn-secondary"
                        disabled={busy}
                        onClick={() => setPendingSubAction("reactivate")}
                      >
                        Reactivate Subscription
                      </button>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold/90">
                    Quick Admin Actions
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      className="menu-btn-secondary"
                      onClick={() => onRequestAction("suspend", restaurant)}
                    >
                      Suspend Restaurant
                    </button>
                    <button
                      type="button"
                      className="menu-btn-secondary"
                      onClick={() => onRequestAction("activate", restaurant)}
                    >
                      Activate Restaurant
                    </button>
                    <button
                      type="button"
                      className="menu-btn-secondary"
                      onClick={() => onRequestAction("archive", restaurant)}
                    >
                      Archive Restaurant
                    </button>
                    <button
                      type="button"
                      className="menu-btn-danger"
                      disabled={isOwn}
                      onClick={() => onRequestAction("delete", restaurant)}
                    >
                      Delete Restaurant
                    </button>
                    <button
                      type="button"
                      className="menu-btn-secondary"
                      disabled={busy}
                      onClick={() => void handleGenerateLoginLink()}
                    >
                      Generate Login Link
                    </button>
                    <button
                      type="button"
                      className="menu-btn-primary"
                      disabled={busy}
                      onClick={() => setImpersonateOpen(true)}
                    >
                      Login as Restaurant
                    </button>
                  </div>
                  {loginLink ? (
                    <p className="mt-3 break-all rounded-xl border border-gold/20 bg-gold/5 px-3 py-2 text-xs text-gold/90">
                      {loginLink}
                    </p>
                  ) : null}
                </section>
              </>
            )}
          </div>
        </aside>
      </div>

      <ConfirmModal
        open={Boolean(pendingSubAction)}
        title={
          pendingSubAction === "upgrade"
            ? "Upgrade Plan"
            : pendingSubAction === "extend"
              ? "Extend Trial"
              : pendingSubAction === "reset"
                ? "Reset Trial"
                : pendingSubAction === "cancel"
                  ? "Cancel Subscription"
                  : "Reactivate Subscription"
        }
        description={
          pendingSubAction === "upgrade"
            ? `Upgrade ${name} to ${upgradePlan}?`
            : pendingSubAction === "extend"
              ? `Extend the trial for ${name} by 7 days?`
              : pendingSubAction === "reset"
                ? `Reset the trial window for ${name}?`
                : pendingSubAction === "cancel"
                  ? `Cancel the subscription for ${name}?`
                  : `Reactivate the subscription for ${name}?`
        }
        confirmLabel="Confirm"
        variant={
          pendingSubAction === "cancel" || pendingSubAction === "reset"
            ? "danger"
            : "default"
        }
        loading={busy}
        onConfirm={() => void runSubscriptionAction()}
        onCancel={() => setPendingSubAction(null)}
      />

      <ConfirmModal
        open={impersonateOpen}
        title={`Login as ${name}?`}
        description="You will temporarily access this restaurant's dashboard. All actions are logged."
        confirmLabel="Continue"
        cancelLabel="Cancel"
        loading={busy}
        onConfirm={() => void handleConfirmImpersonate()}
        onCancel={() => setImpersonateOpen(false)}
      />
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { ManageRestaurantDrawer } from "@/components/admin/restaurants/ManageRestaurantDrawer";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { startImpersonation } from "@/lib/admin/impersonation-client";
import {
  fetchOwnerCrmProfile,
  type OwnerCrmProfile,
  type OwnerCrmRestaurant,
} from "@/lib/admin/owner-crm";
import { formatPaymentAmount } from "@/lib/admin/payments";
import {
  setRestaurantActive,
  setRestaurantArchived,
  type AdminRestaurantManagementRow,
} from "@/lib/admin/restaurants";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from "@/lib/admin/restaurant-status";
import {
  getTicketStatusBadgeClass,
  type SupportTicket,
} from "@/lib/admin/support";
import { restaurantCountLabel } from "@/lib/admin/group-by-owner";
import {
  formatDemoDate,
  formatDemoDateTime,
  getPriorityBadgeClass,
} from "@/lib/demo-requests/utils";
import { supabase } from "@/lib/supabase";

type PendingAction =
  | { type: "suspend_account" }
  | { type: "archive_primary" }
  | { type: "archive"; restaurant: OwnerCrmRestaurant }
  | { type: "suspend"; restaurant: OwnerCrmRestaurant }
  | { type: "activate"; restaurant: OwnerCrmRestaurant }
  | null;

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/30 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-white/40">
        {label}
      </p>
      <div className="mt-1 text-sm text-white/85">{value}</div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/25 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-white/40">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: OwnerCrmRestaurant["status"];
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function FlagBadge({
  enabled,
  label,
}: {
  enabled: boolean;
  label: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${
        enabled
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-white/15 bg-white/5 text-white/40"
      }`}
    >
      {label}: {enabled ? "On" : "Off"}
    </span>
  );
}

type AdminOwnerDetailsPageProps = {
  ownerId: string;
};

export function AdminOwnerDetailsPage({ ownerId }: AdminOwnerDetailsPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<OwnerCrmProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [restaurantsOpen, setRestaurantsOpen] = useState(true);
  const [manageTarget, setManageTarget] =
    useState<AdminRestaurantManagementRow | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchOwnerCrmProfile(ownerId);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      setProfile(null);
      return;
    }
    setProfile(result.data);
  }, [ownerId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const planByRestaurantId = useMemo(() => {
    const map = new Map<string, string>();
    for (const restaurant of profile?.restaurants ?? []) {
      map.set(restaurant.id, restaurant.plan);
    }
    return map;
  }, [profile]);

  const runImpersonation = async (restaurant: OwnerCrmRestaurant) => {
    setActionLoading(true);
    const result = await startImpersonation(
      restaurant.id,
      "Login as Restaurant",
    );
    setActionLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    router.push("/dashboard");
  };

  const handleConfirmPending = async () => {
    if (!pendingAction || !profile) return;
    setActionLoading(true);

    try {
      if (pendingAction.type === "suspend_account") {
        const targets = profile.restaurants.filter(
          (r) => !r.isArchived && r.isActive,
        );
        for (const restaurant of targets) {
          const result = await setRestaurantActive(restaurant.id, false);
          if (!result.ok) {
            showToast(result.message, "error");
            setActionLoading(false);
            return;
          }
        }
        showToast(
          targets.length
            ? `Suspended ${targets.length} restaurant${targets.length === 1 ? "" : "s"}`
            : "No active restaurants to suspend",
        );
      } else if (pendingAction.type === "archive_primary") {
        const primary = profile.primaryRestaurant;
        if (!primary) {
          showToast("No primary restaurant found.", "error");
          setActionLoading(false);
          return;
        }
        const result = await setRestaurantArchived(primary.id, true);
        if (!result.ok) {
          showToast(result.message, "error");
          setActionLoading(false);
          return;
        }
        showToast("Primary restaurant archived");
      } else if (pendingAction.type === "archive") {
        const result = await setRestaurantArchived(
          pendingAction.restaurant.id,
          true,
        );
        if (!result.ok) {
          showToast(result.message, "error");
          setActionLoading(false);
          return;
        }
        showToast("Restaurant archived");
      } else if (
        pendingAction.type === "suspend" ||
        pendingAction.type === "activate"
      ) {
        const activate = pendingAction.type === "activate";
        const result = await setRestaurantActive(
          pendingAction.restaurant.id,
          activate,
        );
        if (!result.ok) {
          showToast(result.message, "error");
          setActionLoading(false);
          return;
        }
        showToast(activate ? "Restaurant activated" : "Restaurant suspended");
      }
    } finally {
      setActionLoading(false);
      setPendingAction(null);
      await load();
    }
  };

  const confirmCopy = useMemo(() => {
    if (!pendingAction) return { title: "", description: "" };
    if (pendingAction.type === "suspend_account") {
      return {
        title: "Suspend account?",
        description:
          "This will suspend every active restaurant under this owner. Billing and plan limits are unchanged.",
      };
    }
    if (pendingAction.type === "archive_primary") {
      return {
        title: "Archive primary restaurant?",
        description: profile?.primaryRestaurant
          ? `Archive “${profile.primaryRestaurant.restaurantName?.trim() || "Unnamed restaurant"}”?`
          : "Archive the primary restaurant?",
      };
    }
    if (pendingAction.type === "archive") {
      return {
        title: "Archive restaurant?",
        description: `Archive “${pendingAction.restaurant.restaurantName?.trim() || "Unnamed restaurant"}”?`,
      };
    }
    if (pendingAction.type === "suspend") {
      return {
        title: "Suspend restaurant?",
        description: `Suspend “${pendingAction.restaurant.restaurantName?.trim() || "Unnamed restaurant"}”?`,
      };
    }
    return {
      title: "Activate restaurant?",
      description: `Activate “${pendingAction.restaurant.restaurantName?.trim() || "Unnamed restaurant"}”?`,
    };
  }, [pendingAction, profile]);

  if (loading) {
    return (
      <AdminPlaceholder
        title="Owner Details"
        description="CRM profile for this restaurant owner account."
      >
        <TableSkeleton rows={6} />
      </AdminPlaceholder>
    );
  }

  if (error || !profile) {
    return (
      <AdminPlaceholder
        title="Owner Details"
        description="CRM profile for this restaurant owner account."
      >
        <div className="py-12 text-center">
          <p className="text-sm text-white/50">{error ?? "Owner not found."}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/admin/owners" className="menu-btn-secondary">
              Back to Owners
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              className="menu-btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminPlaceholder>
    );
  }

  const ownerLabel = profile.ownerName?.trim() || "Unnamed owner";
  const groupLabel =
    profile.ownerName?.trim() ||
    profile.email?.trim() ||
    "Owner restaurants";

  return (
    <AdminPlaceholder
      title={ownerLabel}
      description="Complete CRM profile for this owner account across all restaurants."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/owners"
          className="text-sm text-gold/80 transition hover:text-gold"
        >
          ← Back to Restaurant Owners
        </Link>
        <p className="text-xs text-white/40">
          Owner ID:{" "}
          <span className="font-mono text-white/55">{profile.ownerId}</span>
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/45">
              Account Information
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="Owner Name" value={ownerLabel} />
              <InfoRow label="Email" value={profile.email ?? "—"} />
              <InfoRow label="Phone" value={profile.phone ?? "—"} />
              <InfoRow
                label="Joined Date"
                value={formatDemoDate(profile.joinedAt)}
              />
              <InfoRow label="Current Plan" value={profile.currentPlan} />
              <InfoRow
                label="Subscription Status"
                value={profile.subscriptionStatus ?? "—"}
              />
              <InfoRow
                label="Total Restaurants"
                value={restaurantCountLabel(profile.totalRestaurants)}
              />
              <InfoRow
                label="Primary Restaurant"
                value={
                  profile.primaryRestaurant?.restaurantName?.trim() || "—"
                }
              />
              <InfoRow
                label="Owner ID"
                value={
                  <span className="break-all font-mono text-xs">
                    {profile.ownerId}
                  </span>
                }
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/45">
              Account Summary
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                label="Restaurants"
                value={String(profile.summary.restaurants)}
              />
              <SummaryCard
                label="QR Codes"
                value={String(profile.summary.qrCodes)}
              />
              <SummaryCard
                label="Menu Items"
                value={String(profile.summary.menuItems)}
              />
              <SummaryCard
                label="Orders"
                value={String(profile.summary.orders)}
              />
              <SummaryCard
                label="Reservations"
                value={String(profile.summary.reservations)}
              />
              <SummaryCard
                label="Support Tickets"
                value={String(profile.summary.supportTickets)}
              />
              <SummaryCard
                label="Current Monthly Revenue"
                value={`${profile.summary.monthlyRevenue.toFixed(
                  profile.summary.monthlyRevenue % 1 === 0 ? 0 : 2,
                )} KWD`}
              />
              <SummaryCard
                label="Current Plan"
                value={profile.summary.currentPlan}
              />
            </div>
          </section>

          <section>
            <button
              type="button"
              onClick={() => setRestaurantsOpen((open) => !open)}
              className="mb-3 flex w-full items-center gap-2 text-start"
            >
              <span className="text-gold/80" aria-hidden="true">
                {restaurantsOpen ? "▼" : "▶"}
              </span>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
                {groupLabel}
              </h2>
              <span className="text-xs text-white/35">
                ({restaurantCountLabel(profile.restaurants.length)})
              </span>
            </button>

            {restaurantsOpen ? (
              <div className="space-y-3">
                {profile.restaurants.map((restaurant) => {
                  const name =
                    restaurant.restaurantName?.trim() || "Unnamed restaurant";
                  const isPrimary =
                    profile.primaryRestaurant?.id === restaurant.id;

                  return (
                    <DashboardCard
                      key={restaurant.id}
                      className="border border-white/5 bg-black/20 p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-gold/70" aria-hidden="true">
                              •
                            </span>
                            <h3 className="text-base font-medium text-white">
                              {name}
                            </h3>
                            <StatusBadge status={restaurant.status} />
                            <span className="rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-xs text-gold">
                              {restaurant.plan}
                            </span>
                            {restaurant.isActive && !restaurant.isArchived ? (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                                Active Restaurant
                              </span>
                            ) : null}
                            {isPrimary ? (
                              <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/50">
                                Primary
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-white/40">
                            {restaurant.slug
                              ? `/${restaurant.slug}`
                              : "No slug"}{" "}
                            · Created {formatDemoDate(restaurant.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        <p className="text-sm text-white/65">
                          QR Codes:{" "}
                          <span className="text-white">
                            {restaurant.qrCodeCount}
                          </span>
                        </p>
                        <p className="text-sm text-white/65">
                          Menu Items:{" "}
                          <span className="text-white">
                            {restaurant.menuItemCount}
                          </span>
                        </p>
                        <p className="text-sm text-white/65">
                          Categories:{" "}
                          <span className="text-white">
                            {restaurant.categoryCount}
                          </span>
                        </p>
                        <p className="text-sm text-white/65">
                          Reservations:{" "}
                          <span className="text-white">
                            {restaurant.reservationCount}
                          </span>
                        </p>
                        <p className="text-sm text-white/65">
                          Orders:{" "}
                          <span className="text-white">
                            {restaurant.orderCount}
                          </span>
                        </p>
                        <p className="text-sm text-white/65">
                          Subscription:{" "}
                          <span className="text-white">
                            {restaurant.subscriptionStatus ?? "—"}
                          </span>
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <FlagBadge
                          enabled={restaurant.kitchenEnabled}
                          label="Kitchen"
                        />
                        <FlagBadge
                          enabled={restaurant.onlineOrderingEnabled}
                          label="Online Ordering"
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={actionLoading}
                          className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                          onClick={() => setManageTarget(restaurant)}
                        >
                          View Restaurant
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                          onClick={() => void runImpersonation(restaurant)}
                        >
                          Impersonate
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading || restaurant.isArchived}
                          className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                          onClick={() =>
                            setPendingAction({ type: "archive", restaurant })
                          }
                        >
                          Archive
                        </button>
                      </div>
                    </DashboardCard>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
                Support
              </h2>
              <Link
                href="/admin/support"
                className="text-xs text-gold/70 hover:text-gold"
              >
                Open Support Hub
              </Link>
            </div>
            {profile.supportTickets.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-8 text-center text-sm text-white/45">
                No support tickets for this owner yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-gold/10 bg-black/30">
                      {[
                        "Subject",
                        "Restaurant",
                        "Status",
                        "Priority",
                        "Created",
                        "Last Reply",
                        "Actions",
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
                    {profile.supportTickets.slice(0, 20).map((ticket) => (
                      <SupportTicketRow key={ticket.id} ticket={ticket} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
                Payment History
              </h2>
              <Link
                href="/admin/payments"
                className="text-xs text-gold/70 hover:text-gold"
              >
                View Billing
              </Link>
            </div>
            {profile.payments.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-8 text-center text-sm text-white/45">
                No payment history available for this owner yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-gold/10 bg-black/30">
                      {[
                        "Date",
                        "Plan",
                        "Amount",
                        "Gateway",
                        "Status",
                        "Invoice ID",
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
                    {profile.payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-white/5"
                      >
                        <td className="px-3 py-3 text-sm text-white/70">
                          {formatDemoDate(payment.paidAt ?? payment.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-sm text-white/70">
                          {planByRestaurantId.get(payment.restaurantId) ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-sm text-white/85">
                          {formatPaymentAmount(
                            payment.amount,
                            payment.currency,
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm text-white/70">
                          {payment.paymentMethod ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-sm capitalize text-white/70">
                          {payment.status}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-white/55">
                          {payment.invoiceNumber ?? payment.id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-3 xl:sticky xl:top-6 xl:self-start">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
            Quick Actions
          </h2>
          <DashboardCard className="space-y-2 border border-white/5 bg-black/25 p-4">
            <ActionButton
              disabled={actionLoading || !profile.primaryRestaurant}
              onClick={() => {
                if (profile.primaryRestaurant) {
                  void runImpersonation(profile.primaryRestaurant);
                }
              }}
            >
              Impersonate Owner
            </ActionButton>
            <ActionButton
              disabled={actionLoading || !profile.primaryRestaurant}
              onClick={() => {
                if (profile.primaryRestaurant) {
                  setManageTarget(profile.primaryRestaurant);
                }
              }}
            >
              Edit Subscription
            </ActionButton>
            <ActionButton onClick={() => router.push("/admin/payments")}>
              View Billing
            </ActionButton>
            <ActionButton onClick={() => router.push("/admin/restaurants")}>
              Open Restaurants
            </ActionButton>
            <ActionButton
              onClick={() =>
                showToast(
                  "Restaurant creation is performed by the owner from their dashboard when their plan allows it.",
                )
              }
            >
              Create Restaurant
            </ActionButton>
            <ActionButton
              disabled={actionLoading}
              onClick={() => setPendingAction({ type: "suspend_account" })}
            >
              Suspend Account
            </ActionButton>
            <ActionButton
              disabled={actionLoading || !profile.primaryRestaurant}
              onClick={() => setPendingAction({ type: "archive_primary" })}
            >
              Archive Restaurant
            </ActionButton>
          </DashboardCard>
        </aside>
      </div>

      {manageTarget ? (
        <ManageRestaurantDrawer
          restaurant={manageTarget}
          currentUserId={currentUserId}
          onClose={() => setManageTarget(null)}
          onChanged={async () => {
            await load();
          }}
          onRequestAction={(action, restaurant) => {
            if (action === "delete") {
              showToast(
                "Use Restaurant Management to permanently delete a restaurant.",
                "error",
              );
              return;
            }
            const row = profile.restaurants.find((r) => r.id === restaurant.id);
            if (!row) return;
            if (action === "archive") {
              setPendingAction({ type: "archive", restaurant: row });
            } else if (action === "suspend") {
              setPendingAction({ type: "suspend", restaurant: row });
            } else if (action === "activate") {
              setPendingAction({ type: "activate", restaurant: row });
            }
          }}
          onImpersonateContinue={() => {
            setManageTarget(null);
            router.push("/dashboard");
          }}
        />
      ) : null}

      <ConfirmModal
        open={pendingAction != null}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel="Confirm"
        loading={actionLoading}
        onConfirm={() => void handleConfirmPending()}
        onCancel={() => setPendingAction(null)}
      />
    </AdminPlaceholder>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="menu-btn-secondary w-full !justify-start !px-3 !py-2 text-sm disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SupportTicketRow({ ticket }: { ticket: SupportTicket & { lastReplyAt: string | null } }) {
  return (
    <tr className="border-b border-white/5">
      <td className="px-3 py-3 text-sm text-white/85">
        <p className="font-medium">{ticket.subject}</p>
        <p className="mt-0.5 text-xs text-white/35">{ticket.ticketNumber}</p>
      </td>
      <td className="px-3 py-3 text-sm text-white/65">
        {ticket.restaurantName?.trim() || "—"}
      </td>
      <td className="px-3 py-3">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getTicketStatusBadgeClass(ticket.status)}`}
        >
          {ticket.status}
        </span>
      </td>
      <td className="px-3 py-3">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getPriorityBadgeClass(ticket.priority)}`}
        >
          {ticket.priority}
        </span>
      </td>
      <td className="px-3 py-3 text-sm text-white/50">
        {formatDemoDate(ticket.createdAt)}
      </td>
      <td className="px-3 py-3 text-sm text-white/50">
        {ticket.lastReplyAt
          ? formatDemoDateTime(ticket.lastReplyAt)
          : "—"}
      </td>
      <td className="px-3 py-3">
        <Link
          href={`/admin/support?ticket=${ticket.id}`}
          className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
        >
          Open Ticket
        </Link>
      </td>
    </tr>
  );
}

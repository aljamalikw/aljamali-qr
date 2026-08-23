"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSubscriptionAccess } from "@/components/dashboard/SubscriptionAccessProvider";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { isAdminRole } from "@/lib/auth/roles";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import {
  CUSTOMER_TAG_PRESETS,
  fetchCustomerById,
  fetchCustomerOrders,
  fetchCustomerReservations,
  fetchCustomerTimeline,
  formatCustomerMoney,
  updateCustomerNotes,
  updateCustomerProfile,
  updateCustomerTags,
  type Customer,
  type CustomerTimelineItem,
} from "@/lib/customers/queries";
import {
  customerHasMarketingOptIn,
} from "@/lib/customers/whatsapp-chat";
import { WhatsAppChatModal } from "@/components/dashboard/customers/WhatsAppChatModal";
import { formatDemoDate, formatDemoDateTime } from "@/lib/demo-requests/utils";
import { buildTelHref } from "@/lib/marketing/whatsapp/phone";
import { getSafeRestaurantName } from "@/lib/restaurants/display";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import {
  fetchCustomerMarketingHistory,
  getCustomerCampaignEligibility,
} from "@/lib/marketing/campaigns";
import { supabase } from "@/lib/supabase";
import {
  planAllowsLoyalty,
  planAllowsMarketing,
} from "@/lib/subscriptions/plans";

type ProfileTab =
  | "overview"
  | "orders"
  | "reservations"
  | "notes"
  | "timeline"
  | "loyalty"
  | "marketing";

const BASE_TABS: { id: ProfileTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "orders", label: "Recent Orders" },
  { id: "reservations", label: "Reservations" },
  { id: "notes", label: "Notes" },
  { id: "timeline", label: "Timeline" },
];

type MarketingHistoryRow = {
  campaignId: string;
  campaignName: string;
  campaignType: string;
  status: string;
  channel: string;
  deliveryStatus: string;
  sentAt: string | null;
  createdAt: string;
};

type CustomerProfilePageProps = {
  customerId: string;
};

export function CustomerProfilePage({ customerId }: CustomerProfilePageProps) {
  const { showToast } = useToast();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const restaurantName = getSafeRestaurantName(restaurant);
  const { access, loading: accessLoading } = useSubscriptionAccess();
  const { role, loading: authLoading } = useAuthUser();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ProfileTab>("overview");
  const [notes, setNotes] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [birthday, setBirthday] = useState("");
  const [saving, setSaving] = useState(false);
  const [timeline, setTimeline] = useState<CustomerTimelineItem[]>([]);
  const [orders, setOrders] = useState<
    Array<{
      id: string;
      orderNumber: string;
      status: string;
      grandTotal: number;
      currency: string;
      createdAt: string;
    }>
  >([]);
  const [reservations, setReservations] = useState<
    Array<{
      id: string;
      status: string;
      reservationDate: string;
      reservationTime: string;
      guests: number;
      createdAt: string;
    }>
  >([]);
  const [marketingHistory, setMarketingHistory] = useState<
    MarketingHistoryRow[]
  >([]);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);

  const loyaltyAllowed =
    isAdminRole(role) || planAllowsLoyalty(access.locationPlan);
  const marketingAllowed =
    isAdminRole(role) || planAllowsMarketing(access.locationPlan);

  const tabs = useMemo(() => {
    const next = [...BASE_TABS];
    if (loyaltyAllowed) {
      next.push({ id: "loyalty", label: "Loyalty" });
    }
    if (marketingAllowed) {
      next.push({ id: "marketing", label: "Marketing" });
    }
    return next;
  }, [loyaltyAllowed, marketingAllowed]);

  useEffect(() => {
    if (
      (!loyaltyAllowed && tab === "loyalty") ||
      (!marketingAllowed && tab === "marketing")
    ) {
      setTab("overview");
    }
  }, [loyaltyAllowed, marketingAllowed, tab]);

  const load = useCallback(async (options?: { quiet?: boolean }) => {
    if (!restaurant?.id) {
      setLoading(false);
      return;
    }
    if (!options?.quiet) {
      setLoading(true);
    }
    setError(null);
    const result = await fetchCustomerById(restaurant.id, customerId);
    if (!result.ok) {
      if (!options?.quiet) {
        setLoading(false);
      }
      setError(result.message);
      setCustomer(null);
      return;
    }

    setCustomer(result.data);
    setNotes(result.data.notes ?? "");
    setBirthday(result.data.birthday ?? "");

    const [timelineResult, ordersResult, reservationsResult, marketingResult] =
      await Promise.all([
        fetchCustomerTimeline(restaurant.id, result.data),
        fetchCustomerOrders(restaurant.id, result.data),
        fetchCustomerReservations(restaurant.id, result.data),
        fetchCustomerMarketingHistory(restaurant.id, result.data.id),
      ]);

    if (timelineResult.ok) setTimeline(timelineResult.data);
    if (ordersResult.ok) setOrders(ordersResult.data);
    if (reservationsResult.ok) setReservations(reservationsResult.data);
    if (marketingResult.ok) setMarketingHistory(marketingResult.data);
    else setMarketingHistory([]);

    if (!options?.quiet) {
      setLoading(false);
    }
  }, [customerId, restaurant?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!restaurant?.id || !customerId) return;

    const channel = supabase
      .channel(`customer-profile-${restaurant.id}-${customerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customers",
          filter: `id=eq.${customerId}`,
        },
        () => {
          void load({ quiet: true });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        () => {
          void load({ quiet: true });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [restaurant?.id, customerId, load]);

  const tagSet = useMemo(
    () => new Set(customer?.tags ?? []),
    [customer?.tags],
  );

  const toggleTag = async (tag: string) => {
    if (!customer) return;
    const next = tagSet.has(tag)
      ? customer.tags.filter((value) => value !== tag)
      : [...customer.tags, tag];
    setSaving(true);
    const result = await updateCustomerTags(customer.id, next);
    setSaving(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setCustomer(result.data);
    showToast("Tags updated");
  };

  const addCustomTag = async () => {
    const tag = customTag.trim();
    if (!customer || !tag) return;
    if (tagSet.has(tag)) {
      setCustomTag("");
      return;
    }
    setSaving(true);
    const result = await updateCustomerTags(customer.id, [
      ...customer.tags,
      tag,
    ]);
    setSaving(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setCustomer(result.data);
    setCustomTag("");
    showToast("Tag added");
  };

  const saveNotes = async () => {
    if (!customer) return;
    setSaving(true);
    const result = await updateCustomerNotes(customer.id, notes);
    setSaving(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setCustomer(result.data);
    showToast("Notes saved");
  };

  const saveBirthday = async () => {
    if (!customer) return;
    setSaving(true);
    const result = await updateCustomerProfile(customer.id, {
      birthday: birthday || null,
    });
    setSaving(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setCustomer(result.data);
    const tags = new Set(result.data.tags);
    if (birthday && !tags.has("Birthday")) {
      const tagged = await updateCustomerTags(result.data.id, [
        ...result.data.tags,
        "Birthday",
      ]);
      if (tagged.ok) setCustomer(tagged.data);
    }
    showToast("Profile updated");
  };

  if (restaurantLoading || accessLoading || authLoading || loading) {
    return (
      <div className="space-y-6">
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-white/50">{error ?? "Customer not found."}</p>
        <Link href="/dashboard/customers" className="menu-btn-secondary">
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/customers"
            className="text-sm text-gold/80 hover:text-gold"
          >
            ← Back to Customers
          </Link>
          <h1 className="mt-2 font-serif text-2xl font-bold text-white sm:text-3xl">
            {customer.fullName?.trim() || "Guest"}
          </h1>
          <p className="mt-1 text-sm text-white/45">
            {customer.phone || "No phone"} · {customer.email || "No email"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {customer.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-xs text-gold"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <DashboardCard className="p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
          Quick Actions
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(() => {
            const optedIn = customerHasMarketingOptIn(customer);
            const tel = buildTelHref(customer.phone);
            return (
              <>
                <button
                  type="button"
                  disabled={!optedIn || !customer.phone}
                  title={
                    !optedIn
                      ? "Customer has not opted in to promotional messaging."
                      : "Chat on WhatsApp"
                  }
                  onClick={() => setWhatsAppOpen(true)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium ${
                    optedIn && customer.phone
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/50"
                      : "cursor-not-allowed border-white/10 bg-white/5 text-white/30"
                  }`}
                >
                  <span aria-hidden="true">🟢</span>
                  Chat on WhatsApp
                </button>
                <button
                  type="button"
                  disabled
                  title="Coming soon"
                  className="cursor-not-allowed rounded-xl border border-white/10 px-3 py-2 text-sm text-white/30"
                >
                  ✉ Email (Coming Soon)
                </button>
                {tel ? (
                  <a
                    href={tel}
                    className="menu-btn-secondary inline-flex items-center gap-1.5 !px-3 !py-2 text-sm"
                  >
                    📞 Call Customer
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Call is unavailable without a phone number"
                    className="cursor-not-allowed rounded-xl border border-white/10 px-3 py-2 text-sm text-white/30"
                  >
                    📞 Call Customer
                  </button>
                )}
              </>
            );
          })()}
        </div>
      </DashboardCard>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              tab === item.id
                ? "border-gold/40 bg-gold text-black"
                : "border-white/10 bg-black/20 text-white/65 hover:border-gold/25 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!loyaltyAllowed ? (
        <DashboardCard className="p-5">
          <p className="text-sm text-white/60">
            Upgrade to Professional to unlock Loyalty & Rewards.
          </p>
          <Link
            href="/dashboard/subscription"
            className="menu-btn-secondary mt-4 inline-flex"
          >
            Upgrade Plan
          </Link>
        </DashboardCard>
      ) : null}

      {tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardCard className="space-y-3 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
              Account
            </h2>
            <Info label="Full name" value={customer.fullName || "—"} />
            <Info label="Phone" value={customer.phone || "—"} />
            <Info label="Email" value={customer.email || "—"} />
            <Info
              label="First visit"
              value={
                customer.firstVisit ? formatDemoDate(customer.firstVisit) : "—"
              }
            />
            <Info
              label="Last visit"
              value={
                customer.lastVisit ? formatDemoDate(customer.lastVisit) : "—"
              }
            />
          </DashboardCard>

          <DashboardCard className="space-y-3 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
              Spending
            </h2>
            <Info label="Orders" value={String(customer.totalOrders)} />
            <Info
              label="Reservations"
              value={String(customer.totalReservations)}
            />
            <Info
              label="Total spent"
              value={formatCustomerMoney(customer.totalSpent)}
            />
            <Info
              label="Average order"
              value={formatCustomerMoney(customer.averageOrder)}
            />
            <Info label="Favorite item" value={customer.favoriteItem || "—"} />
            <Info
              label="Favorite category"
              value={customer.favoriteCategory || "—"}
            />
          </DashboardCard>

          <DashboardCard className="space-y-3 p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {CUSTOMER_TAG_PRESETS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  disabled={saving}
                  onClick={() => void toggleTag(tag)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    tagSet.has(tag)
                      ? "border-gold/40 bg-gold/15 text-gold"
                      : "border-white/10 bg-black/20 text-white/55"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Custom tag"
                className="w-full max-w-xs rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-gold/30 focus:outline-none"
              />
              <button
                type="button"
                disabled={saving || !customTag.trim()}
                onClick={() => void addCustomTag()}
                className="menu-btn-secondary"
              >
                Add Tag
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="block text-sm text-white/60">
                Birthday
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="mt-1 block rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-gold/30 focus:outline-none"
                />
              </label>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveBirthday()}
                className="menu-btn-secondary"
              >
                Save Birthday
              </button>
            </div>
          </DashboardCard>
        </div>
      ) : null}

      {tab === "orders" ? (
        <DashboardCard className="p-5">
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/45">
              No orders linked to this customer yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-gold/10">
                    {["Order", "Status", "Total", "Date"].map((heading) => (
                      <th
                        key={heading}
                        className="px-3 py-3 text-xs uppercase tracking-wider text-white/40"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-white/5">
                      <td className="px-3 py-3 text-sm text-white/85">
                        {order.orderNumber}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/65">
                        {order.status}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/85">
                        {formatCustomerMoney(order.grandTotal, order.currency)}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/50">
                        {formatDemoDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>
      ) : null}

      {tab === "reservations" ? (
        <DashboardCard className="p-5">
          {reservations.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/45">
              No reservations linked to this customer yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-gold/10">
                    {["Date", "Time", "Guests", "Status", "Created"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-3 py-3 text-xs uppercase tracking-wider text-white/40"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.id} className="border-b border-white/5">
                      <td className="px-3 py-3 text-sm text-white/85">
                        {reservation.reservationDate}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/65">
                        {reservation.reservationTime}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/65">
                        {reservation.guests}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/65">
                        {reservation.status}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/50">
                        {formatDemoDate(reservation.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>
      ) : null}

      {tab === "notes" ? (
        <DashboardCard className="space-y-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
            Private notes
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            placeholder="Internal notes about this customer…"
            className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveNotes()}
            className="menu-btn-primary"
          >
            Save Notes
          </button>
          {(customer.metadata.noteHistory?.length ?? 0) > 0 ? (
            <div className="space-y-2 border-t border-white/5 pt-4">
              <p className="text-xs uppercase tracking-wider text-white/40">
                Recent note history
              </p>
              {customer.metadata.noteHistory?.slice(0, 5).map((entry) => (
                <div
                  key={`${entry.at}-${entry.note.slice(0, 12)}`}
                  className="rounded-xl border border-white/5 bg-black/25 px-3 py-2 text-sm text-white/65"
                >
                  <p className="text-xs text-white/35">
                    {formatDemoDateTime(entry.at)}
                  </p>
                  <p className="mt-1">{entry.note}</p>
                </div>
              ))}
            </div>
          ) : null}
        </DashboardCard>
      ) : null}

      {tab === "timeline" ? (
        <DashboardCard className="space-y-3 p-5">
          {timeline.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/45">
              No timeline activity yet.
            </p>
          ) : (
            timeline.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/5 bg-black/25 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">
                    {item.type === "whatsapp" ? (
                      <span className="me-1.5" aria-hidden="true">
                        🟢
                      </span>
                    ) : null}
                    {item.title}
                  </p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wider ${
                      item.type === "whatsapp"
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                        : "border-white/10 text-white/45"
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
                <p className="mt-1 text-sm text-white/60">{item.description}</p>
                <p className="mt-1 text-xs text-white/35">
                  {formatDemoDateTime(item.at)}
                </p>
              </div>
            ))
          )}
        </DashboardCard>
      ) : null}

      {tab === "loyalty" && loyaltyAllowed ? (
        <DashboardCard className="space-y-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
            Loyalty & Rewards
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Info
              label="Loyalty points"
              value={String(customer.loyaltyPoints)}
            />
            <Info
              label="Membership tier"
              value={customer.metadata.loyalty?.tier || "Not assigned"}
            />
            <Info
              label="Lifetime points"
              value={String(customer.metadata.loyalty?.lifetimePoints ?? 0)}
            />
          </div>
          <p className="text-sm text-white/45">
            Architecture is ready for points, rewards, and membership tiers via
            `loyalty_points` and `metadata.loyalty` without a schema redesign.
          </p>
          <ul className="list-disc space-y-1 ps-5 text-sm text-white/55">
            <li>Award points on completed orders</li>
            <li>Unlock rewards into `metadata.loyalty.rewardsUnlocked`</li>
            <li>Assign tiers (Bronze / Silver / Gold) in metadata</li>
          </ul>
        </DashboardCard>
      ) : null}

      {restaurant?.id && customer ? (
        <WhatsAppChatModal
          open={whatsAppOpen}
          restaurantId={restaurant.id}
          restaurantName={restaurantName}
          customer={customer}
          onClose={() => setWhatsAppOpen(false)}
          onOpened={() => {
            void fetchCustomerTimeline(restaurant.id, customer).then((result) => {
              if (result.ok) setTimeline(result.data);
            });
          }}
        />
      ) : null}

      {tab === "marketing" && marketingAllowed ? (
        <div className="grid gap-4">
          <DashboardCard className="space-y-3 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
              Consent & eligibility
            </h2>
            <p className="text-sm text-white/70">
              Promotions opt-in:{" "}
              <span className="text-gold">
                {customer.metadata.marketing_opt_in ? "Yes" : "No"}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {getCustomerCampaignEligibility(customer).map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-xs text-gold"
                >
                  {label}
                </span>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard className="space-y-3 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
              Marketing history
            </h2>
            <p className="text-sm text-white/45">
              Campaigns received ({marketingHistory.length})
            </p>
            {marketingHistory.length === 0 ? (
              <p className="py-6 text-center text-sm text-white/45">
                No campaigns sent to this customer yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b border-gold/10">
                      {[
                        "Campaign",
                        "Type",
                        "Channel",
                        "Status",
                        "Sent",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-3 py-3 text-xs uppercase tracking-wider text-white/40"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {marketingHistory.map((row) => (
                      <tr
                        key={`${row.campaignId}-${row.channel}`}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="px-3 py-3 text-sm text-white/85">
                          {row.campaignName}
                        </td>
                        <td className="px-3 py-3 text-sm text-white/65">
                          {row.campaignType}
                        </td>
                        <td className="px-3 py-3 text-sm capitalize text-white/65">
                          {row.channel}
                        </td>
                        <td className="px-3 py-3 text-sm capitalize text-white/65">
                          {row.deliveryStatus}
                        </td>
                        <td className="px-3 py-3 text-sm text-white/50">
                          {row.sentAt
                            ? formatDemoDateTime(row.sentAt)
                            : formatDemoDate(row.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardCard>
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/30 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-white/40">
        {label}
      </p>
      <p className="mt-1 text-sm text-white/85">{value}</p>
    </div>
  );
}

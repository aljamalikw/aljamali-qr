"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { FormSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { useSubscriptionAccess } from "@/components/dashboard/SubscriptionAccessProvider";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { isAdminRole } from "@/lib/auth/roles";
import { fetchCustomers, type Customer } from "@/lib/customers/queries";
import { RewardTemplatePicker } from "@/components/dashboard/loyalty/RewardTemplatePicker";
import {
  createLoyaltyReward,
  fetchLoyaltyRedemptions,
  fetchLoyaltyRewards,
  getRewardAnalytics,
  redeemLoyaltyReward,
  type LoyaltyRedemption,
  type LoyaltyReward,
  type RewardStatus,
  type RewardType,
} from "@/lib/loyalty/rewards";
import type { RewardTemplate } from "@/lib/loyalty/reward-templates";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { planAllowsRewardAnalytics } from "@/lib/subscriptions/plans";

const REWARD_TYPES: Array<{ id: RewardType; label: string }> = [
  { id: "free_item", label: "Free item" },
  { id: "discount", label: "Discount" },
  { id: "coupon", label: "Coupon" },
  { id: "gift", label: "Gift" },
  { id: "manual", label: "Manual" },
];

function blankFormState() {
  return {
    title: "",
    description: "",
    points: "100",
    rewardType: "free_item" as RewardType,
    status: "active" as RewardStatus,
    selectedIcon: "➕",
    formSource: "custom" as "custom" | "template",
  };
}

export function RewardsCatalog() {
  const { showToast } = useToast();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const { access } = useSubscriptionAccess();
  const { role } = useAuthUser();

  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [redemptions, setRedemptions] = useState<LoyaltyRedemption[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("100");
  const [rewardType, setRewardType] = useState<RewardType>("free_item");
  const [status, setStatus] = useState<RewardStatus>("active");
  const [selectedIcon, setSelectedIcon] = useState("➕");
  const [formSource, setFormSource] = useState<"custom" | "template">("custom");

  const [redeemRewardId, setRedeemRewardId] = useState("");
  const [redeemCustomerId, setRedeemCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  const showAnalytics =
    isAdminRole(role) || planAllowsRewardAnalytics(access.plan);

  const load = useCallback(async () => {
    if (!restaurant?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [rewardsResult, redemptionsResult, customersResult] =
      await Promise.all([
        fetchLoyaltyRewards(restaurant.id),
        fetchLoyaltyRedemptions(restaurant.id),
        fetchCustomers(restaurant.id),
      ]);
    setLoading(false);

    setRewards(rewardsResult.ok ? rewardsResult.data : []);
    setRedemptions(redemptionsResult.ok ? redemptionsResult.data : []);
    setCustomers(customersResult.ok ? customersResult.data : []);

    if (rewardsResult.ok) {
      const firstActive = rewardsResult.data.find((r) => r.status === "active");
      if (firstActive) {
        setRedeemRewardId((current) => {
          const stillValid = rewardsResult.data.some(
            (r) => r.id === current && r.status === "active",
          );
          return stillValid ? current : firstActive.id;
        });
      } else {
        setRedeemRewardId("");
      }
    }
  }, [restaurant?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers.slice(0, 40);
    return customers
      .filter((c) => {
        const hay = `${c.fullName ?? ""} ${c.phone ?? ""} ${c.email ?? ""} ${c.id}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 40);
  }, [customers, customerSearch]);

  const analytics = useMemo(
    () => getRewardAnalytics(redemptions),
    [redemptions],
  );

  const resetForm = () => {
    const blank = blankFormState();
    setTitle(blank.title);
    setDescription(blank.description);
    setPoints(blank.points);
    setRewardType(blank.rewardType);
    setStatus(blank.status);
    setSelectedIcon(blank.selectedIcon);
    setFormSource(blank.formSource);
    setFormOpen(false);
  };

  const applyTemplate = (template: RewardTemplate) => {
    setTitle(template.name);
    setDescription(template.description);
    setPoints(String(template.pointsRequired));
    setRewardType(template.rewardType);
    setStatus(template.status);
    setSelectedIcon(template.icon);
    setFormSource("template");
    setFormOpen(true);
  };

  const openCustomForm = () => {
    const blank = blankFormState();
    setTitle(blank.title);
    setDescription(blank.description);
    setPoints(blank.points);
    setRewardType(blank.rewardType);
    setStatus(blank.status);
    setSelectedIcon(blank.selectedIcon);
    setFormSource(blank.formSource);
    setFormOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id) return;
    setSaving(true);
    const result = await createLoyaltyReward({
      restaurantId: restaurant.id,
      title,
      description,
      pointsRequired: Number(points) || 1,
      rewardType,
      status,
      plan: access.plan,
    });
    setSaving(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    showToast("Reward created");
    resetForm();
    void load();
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id || !redeemRewardId || !redeemCustomerId) {
      showToast("Select a reward and customer", "error");
      return;
    }
    setSaving(true);
    const result = await redeemLoyaltyReward({
      restaurantId: restaurant.id,
      rewardId: redeemRewardId,
      customerId: redeemCustomerId,
    });
    setSaving(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    showToast("Reward redeemed");
    void load();
  };

  if (restaurantLoading || loading) {
    return (
      <DashboardCard className="p-6" hover={false}>
        <FormSkeleton />
      </DashboardCard>
    );
  }

  if (!restaurant) {
    return (
      <DashboardCard className="p-6 text-center" hover={false}>
        <p className="text-sm text-white/50">
          Complete restaurant setup to manage rewards.
        </p>
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-6">
      {showAnalytics ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total redemptions", value: analytics.total },
            { label: "Redeemed", value: analytics.byStatus.redeemed },
            { label: "Available", value: analytics.byStatus.available },
            { label: "Points spent", value: analytics.pointsSpent },
          ].map((kpi, index) => (
            <DashboardCard key={kpi.label} delay={index * 0.04} className="p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/45">
                {kpi.label}
              </p>
              <p className="mt-3 font-serif text-3xl font-bold text-white">
                {kpi.value}
              </p>
            </DashboardCard>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard className="p-5 sm:p-6" hover={false}>
          <h2 className="font-serif text-xl font-bold text-white">
            Create reward
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Pick a template or create a custom reward. Nothing is saved until
            you confirm.
          </p>

          <div className="mt-5">
            <RewardTemplatePicker
              onSelectTemplate={applyTemplate}
              onSelectCustom={openCustomForm}
            />
          </div>

          {formOpen ? (
            <form
              onSubmit={(e) => void handleCreate(e)}
              className="mt-5 space-y-3 rounded-2xl border border-gold/15 bg-black/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold/80">
                    {formSource === "template"
                      ? "Template reward"
                      : "Custom reward"}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    Edit any field before saving. Nothing is saved automatically.
                  </p>
                </div>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-xl"
                  aria-hidden="true"
                >
                  {selectedIcon}
                </span>
              </div>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Reward title"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  required
                  type="number"
                  min={1}
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="Points"
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
                />
                <select
                  value={rewardType}
                  onChange={(e) => setRewardType(e.target.value as RewardType)}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
                >
                  {REWARD_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RewardStatus)}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="menu-btn-primary disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Create reward"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="menu-btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-4 text-sm text-white/40">
              Choose a template above, or create a custom reward from scratch.
            </p>
          )}
        </DashboardCard>

        <DashboardCard className="p-5 sm:p-6" hover={false}>
          <h2 className="font-serif text-xl font-bold text-white">
            Redeem reward
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Deduct points and record a redemption for a customer.
          </p>
          <form onSubmit={(e) => void handleRedeem(e)} className="mt-5 space-y-3">
            <select
              value={redeemRewardId}
              onChange={(e) => setRedeemRewardId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
            >
              <option value="">Select reward</option>
              {rewards
                .filter((r) => r.status === "active")
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.pointsRequired} pts)
                  </option>
                ))}
            </select>
            <input
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search customers by name, phone, or id"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
            />
            <select
              value={redeemCustomerId}
              onChange={(e) => setRedeemCustomerId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
            >
              <option value="">Select customer</option>
              {filteredCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {(c.fullName || c.phone || c.email || "Customer").trim()} ·{" "}
                  {c.loyaltyPoints} pts
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={saving}
              className="menu-btn-primary disabled:opacity-50"
            >
              {saving ? "Redeeming…" : "Redeem"}
            </button>
          </form>
        </DashboardCard>
      </div>

      <DashboardCard className="p-5 sm:p-6" hover={false}>
        <h2 className="font-serif text-xl font-bold text-white">
          Rewards catalog
        </h2>
        {rewards.length === 0 ? (
          <p className="mt-4 text-sm text-white/45">
            No rewards yet. Create your first reward above.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Points</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map((reward) => (
                  <tr
                    key={reward.id}
                    className="border-t border-white/5 text-white/75"
                  >
                    <td className="px-3 py-2.5">
                      <p className="text-white">{reward.title}</p>
                      {reward.description ? (
                        <p className="mt-0.5 text-xs text-white/40">
                          {reward.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">{reward.pointsRequired}</td>
                    <td className="px-3 py-2.5 capitalize">
                      {reward.rewardType.replaceAll("_", " ")}
                    </td>
                    <td className="px-3 py-2.5 capitalize">{reward.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>

      <DashboardCard className="overflow-hidden p-0" hover={false}>
        <div className="border-b border-white/5 px-5 py-4 sm:px-6">
          <h2 className="font-serif text-xl font-bold text-white">
            Redemption history
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Redeemed, available, and expired records
          </p>
        </div>
        {redemptions.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-white/45 sm:px-6">
            No redemptions yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-4 py-3 font-medium sm:px-6">Customer</th>
                  <th className="px-4 py-3 font-medium">Reward</th>
                  <th className="px-4 py-3 font-medium">Points</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-white/5 text-white/75"
                  >
                    <td className="px-4 py-3 sm:px-6">
                      {row.customerName || row.customerId}
                    </td>
                    <td className="px-4 py-3">{row.rewardTitle || row.rewardId}</td>
                    <td className="px-4 py-3">{row.pointsSpent}</td>
                    <td className="px-4 py-3 capitalize">{row.status}</td>
                    <td className="px-4 py-3 text-white/45">
                      {(row.redeemedAt || row.createdAt).slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {loading ? <TableSkeleton rows={3} /> : null}
      </DashboardCard>
    </div>
  );
}

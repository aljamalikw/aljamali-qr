"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { FormSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import {
  DEFAULT_LOYALTY_EARNING_RULES,
  formatCalculationBasisLabel,
  formatEarningRateLabel,
  LOYALTY_CALCULATION_BASIS_OPTIONS,
  previewEarningPoints,
  validateLoyaltyEarningRulesInput,
  type LoyaltyCalculationBasis,
  type LoyaltyEarningSettings,
} from "@/lib/loyalty/earning-rules";
import {
  fetchLoyaltyEarningSettings,
  resetLoyaltyEarningSettings,
  updateLoyaltyEarningSettings,
} from "@/lib/loyalty/earning-settings";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";

const INPUT_CLASS =
  "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none";

const PREVIEW_SAMPLE_AMOUNT = 15;

type FieldErrors = Partial<
  Record<
    | "pointsPerCurrencyUnit"
    | "minimumSpend"
    | "calculationBasis"
    | "maxPointsPerOrder",
    string
  >
>;

function formatMoney(amount: number, currency: string): string {
  return `${amount.toFixed(3)} ${currency}`;
}

export function LoyaltyEarningSettings() {
  const { showToast } = useToast();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const { user } = useAuthUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<LoyaltyEarningSettings>({
    ...DEFAULT_LOYALTY_EARNING_RULES,
    isCustom: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const [pointsPerUnit, setPointsPerUnit] = useState("1");
  const [minimumSpend, setMinimumSpend] = useState("0");
  const [calculationBasis, setCalculationBasis] =
    useState<LoyaltyCalculationBasis>("grand_total");
  const [maxPointsPerOrder, setMaxPointsPerOrder] = useState("");

  const currency = restaurant?.currency?.trim() || "KWD";

  const applySettingsToForm = useCallback((settings: LoyaltyEarningSettings) => {
    setSaved(settings);
    setPointsPerUnit(String(settings.pointsPerCurrencyUnit));
    setMinimumSpend(String(settings.minimumSpend));
    setCalculationBasis(settings.calculationBasis);
    setMaxPointsPerOrder(
      settings.maxPointsPerOrder == null
        ? ""
        : String(settings.maxPointsPerOrder),
    );
    setErrors({});
  }, []);

  const load = useCallback(async () => {
    if (!restaurant?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await fetchLoyaltyEarningSettings(restaurant.id);
    setLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    applySettingsToForm(result.data);
  }, [applySettingsToForm, restaurant?.id, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const draftPreview = useMemo(() => {
    const validation = validateLoyaltyEarningRulesInput({
      pointsPerCurrencyUnit: pointsPerUnit,
      minimumSpend: minimumSpend,
      calculationBasis,
      maxPointsPerOrder: maxPointsPerOrder,
    });
    if (!validation.ok) return null;
    return validation.data;
  }, [calculationBasis, maxPointsPerOrder, minimumSpend, pointsPerUnit]);

  const previewPoints = draftPreview
    ? previewEarningPoints(PREVIEW_SAMPLE_AMOUNT, draftPreview)
    : 0;

  const isDirty = useMemo(() => {
    if (!draftPreview) return false;
    return (
      draftPreview.pointsPerCurrencyUnit !== saved.pointsPerCurrencyUnit ||
      draftPreview.minimumSpend !== saved.minimumSpend ||
      draftPreview.calculationBasis !== saved.calculationBasis ||
      draftPreview.maxPointsPerOrder !== saved.maxPointsPerOrder
    );
  }, [draftPreview, saved]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant?.id) return;

    setSaving(true);
    const result = await updateLoyaltyEarningSettings({
      restaurantId: restaurant.id,
      pointsPerCurrencyUnit: pointsPerUnit,
      minimumSpend: minimumSpend,
      calculationBasis,
      maxPointsPerOrder: maxPointsPerOrder,
      actorUserId: user?.id ?? null,
    });
    setSaving(false);

    if (!result.ok) {
      if (result.errors) setErrors(result.errors);
      showToast(result.message, "error");
      return;
    }

    applySettingsToForm(result.data);
    showToast("Loyalty earning rules saved");
  };

  const handleReset = async () => {
    if (!restaurant?.id) return;
    setSaving(true);
    const result = await resetLoyaltyEarningSettings({
      restaurantId: restaurant.id,
      actorUserId: user?.id ?? null,
    });
    setSaving(false);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    applySettingsToForm(result.data);
    showToast("Loyalty earning rules reset to default");
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
          Complete restaurant setup to configure loyalty earning rules.
        </p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard className="p-5 sm:p-6" hover={false}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
            Loyalty Settings
          </p>
          <h2 className="mt-1 font-serif text-xl font-bold text-white">
            Points Earning Rules
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-white/45">
            Control how customers earn points from spending. Rewards catalog
            settings stay separate — this only affects point earning.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Current earning rate",
            value: formatEarningRateLabel(saved, currency),
          },
          {
            label: "Minimum spend",
            value: formatMoney(saved.minimumSpend, currency),
          },
          {
            label: "Calculation basis",
            value: formatCalculationBasisLabel(saved.calculationBasis),
          },
          {
            label: "Maximum per order",
            value:
              saved.maxPointsPerOrder == null
                ? "No cap"
                : `${saved.maxPointsPerOrder} points`,
          },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
              {item.label}
            </p>
            <p className="mt-2 text-sm font-medium text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <form onSubmit={(e) => void handleSave(e)} className="mt-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm text-white/70">Points per {currency} 1</span>
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={pointsPerUnit}
              onChange={(e) => setPointsPerUnit(e.target.value)}
              className={INPUT_CLASS}
            />
            {errors.pointsPerCurrencyUnit ? (
              <span className="text-xs text-red-400">
                {errors.pointsPerCurrencyUnit}
              </span>
            ) : null}
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm text-white/70">
              Minimum spend to earn points
            </span>
            <input
              type="number"
              min="0"
              step="0.001"
              value={minimumSpend}
              onChange={(e) => setMinimumSpend(e.target.value)}
              className={INPUT_CLASS}
            />
            {errors.minimumSpend ? (
              <span className="text-xs text-red-400">{errors.minimumSpend}</span>
            ) : null}
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm text-white/70">Calculate points based on</span>
            <select
              value={calculationBasis}
              onChange={(e) =>
                setCalculationBasis(e.target.value as LoyaltyCalculationBasis)
              }
              className={INPUT_CLASS}
            >
              {LOYALTY_CALCULATION_BASIS_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.calculationBasis ? (
              <span className="text-xs text-red-400">
                {errors.calculationBasis}
              </span>
            ) : null}
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm text-white/70">
              Maximum points per order (optional)
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={maxPointsPerOrder}
              onChange={(e) => setMaxPointsPerOrder(e.target.value)}
              placeholder="No cap"
              className={INPUT_CLASS}
            />
            {errors.maxPointsPerOrder ? (
              <span className="text-xs text-red-400">
                {errors.maxPointsPerOrder}
              </span>
            ) : null}
          </label>
        </div>

        <div className="rounded-2xl border border-gold/15 bg-gold/5 px-4 py-3 text-sm text-white/75">
          {draftPreview ? (
            <>
              A {formatMoney(PREVIEW_SAMPLE_AMOUNT, currency)} eligible order earns{" "}
              <span className="font-semibold text-gold">{previewPoints} points</span>.
            </>
          ) : (
            <span className="text-red-300">
              Fix the highlighted fields to preview earning.
            </span>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={saving}
            className="menu-btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset to Default
          </button>
          <button
            type="submit"
            disabled={saving || !draftPreview || !isDirty}
            className="menu-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </DashboardCard>
  );
}

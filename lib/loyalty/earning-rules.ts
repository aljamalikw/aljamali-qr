/** How eligible spend is derived from an order before points are calculated. */
export type LoyaltyCalculationBasis =
  | "subtotal"
  | "subtotal_after_discount"
  | "grand_total";

export type LoyaltyEarningRules = {
  pointsPerCurrencyUnit: number;
  minimumSpend: number;
  calculationBasis: LoyaltyCalculationBasis;
  maxPointsPerOrder: number | null;
};

export type LoyaltyEarningSettings = LoyaltyEarningRules & {
  /** False when the restaurant uses platform defaults (NULL in DB). */
  isCustom: boolean;
};

export type LoyaltyOrderAmounts = {
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
};

export const LOYALTY_CALCULATION_BASIS_OPTIONS: Array<{
  id: LoyaltyCalculationBasis;
  label: string;
}> = [
  { id: "subtotal", label: "Subtotal" },
  { id: "subtotal_after_discount", label: "Subtotal after discount" },
  { id: "grand_total", label: "Grand total" },
];

/**
 * Matches pre-RC2 earning behavior:
 * 1 point per whole currency unit on grand total (floor).
 */
export const DEFAULT_LOYALTY_EARNING_RULES: LoyaltyEarningRules = {
  pointsPerCurrencyUnit: 1,
  minimumSpend: 0,
  calculationBasis: "grand_total",
  maxPointsPerOrder: null,
};

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

function asFiniteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function resolveEligibleOrderAmount(
  amounts: LoyaltyOrderAmounts,
  basis: LoyaltyCalculationBasis,
): number {
  const subtotal = Math.max(0, roundMoney(amounts.subtotal));
  const discount = Math.max(0, roundMoney(amounts.discountAmount));
  const grandTotal = Math.max(0, roundMoney(amounts.grandTotal));

  switch (basis) {
    case "subtotal":
      return subtotal;
    case "subtotal_after_discount":
      return Math.max(0, roundMoney(subtotal - discount));
    case "grand_total":
    default:
      return grandTotal;
  }
}

/**
 * Central loyalty points calculator — server-side source of truth.
 * Never trust client-provided point values.
 */
export function calculateLoyaltyPoints(input: {
  amounts: LoyaltyOrderAmounts;
  rules?: Partial<LoyaltyEarningRules> | null;
}): number {
  const rules = normalizeLoyaltyEarningRules(input.rules);
  const eligible = resolveEligibleOrderAmount(
    input.amounts,
    rules.calculationBasis,
  );

  if (eligible < rules.minimumSpend) return 0;

  let points = Math.floor(eligible * rules.pointsPerCurrencyUnit);
  if (points < 0) points = 0;

  if (
    rules.maxPointsPerOrder != null &&
    Number.isFinite(rules.maxPointsPerOrder) &&
    rules.maxPointsPerOrder >= 0
  ) {
    points = Math.min(points, Math.floor(rules.maxPointsPerOrder));
  }

  return points;
}

export function normalizeLoyaltyEarningRules(
  raw: Partial<LoyaltyEarningRules> | null | undefined,
): LoyaltyEarningRules {
  const base = { ...DEFAULT_LOYALTY_EARNING_RULES };

  if (!raw || typeof raw !== "object") return base;

  const points = asFiniteNumber(raw.pointsPerCurrencyUnit);
  if (points != null && points > 0) {
    base.pointsPerCurrencyUnit = roundMoney(points);
  }

  const minimum = asFiniteNumber(raw.minimumSpend);
  if (minimum != null && minimum >= 0) {
    base.minimumSpend = roundMoney(minimum);
  }

  if (
    raw.calculationBasis === "subtotal" ||
    raw.calculationBasis === "subtotal_after_discount" ||
    raw.calculationBasis === "grand_total"
  ) {
    base.calculationBasis = raw.calculationBasis;
  }

  if (raw.maxPointsPerOrder === null || raw.maxPointsPerOrder === undefined) {
    base.maxPointsPerOrder = null;
  } else {
    const max = asFiniteNumber(raw.maxPointsPerOrder);
    base.maxPointsPerOrder =
      max != null && max >= 0 ? Math.floor(max) : null;
  }

  return base;
}

export function parseLoyaltyEarningSettings(
  stored: unknown,
): LoyaltyEarningSettings {
  if (stored == null) {
    return { ...DEFAULT_LOYALTY_EARNING_RULES, isCustom: false };
  }

  const raw =
    stored && typeof stored === "object" && !Array.isArray(stored)
      ? (stored as Record<string, unknown>)
      : {};

  const basis = raw.calculation_basis ?? raw.calculationBasis;
  const maxRaw = raw.max_points_per_order ?? raw.maxPointsPerOrder;

  return {
    ...normalizeLoyaltyEarningRules({
      pointsPerCurrencyUnit:
        asFiniteNumber(raw.points_per_currency_unit ?? raw.pointsPerCurrencyUnit) ??
        undefined,
      minimumSpend:
        asFiniteNumber(raw.minimum_spend ?? raw.minimumSpend) ?? undefined,
      calculationBasis:
        basis === "subtotal" ||
        basis === "subtotal_after_discount" ||
        basis === "grand_total"
          ? basis
          : undefined,
      maxPointsPerOrder:
        maxRaw === null || maxRaw === undefined
          ? null
          : asFiniteNumber(maxRaw),
    }),
    isCustom: true,
  };
}

export function serializeLoyaltyEarningRules(
  rules: LoyaltyEarningRules,
): Record<string, unknown> {
  return {
    points_per_currency_unit: rules.pointsPerCurrencyUnit,
    minimum_spend: rules.minimumSpend,
    calculation_basis: rules.calculationBasis,
    max_points_per_order: rules.maxPointsPerOrder,
  };
}

export type LoyaltyEarningValidationErrors = Partial<
  Record<
    | "pointsPerCurrencyUnit"
    | "minimumSpend"
    | "calculationBasis"
    | "maxPointsPerOrder",
    string
  >
>;

export function validateLoyaltyEarningRulesInput(input: {
  pointsPerCurrencyUnit: unknown;
  minimumSpend: unknown;
  calculationBasis: unknown;
  maxPointsPerOrder: unknown;
}):
  | { ok: true; data: LoyaltyEarningRules }
  | { ok: false; errors: LoyaltyEarningValidationErrors } {
  const errors: LoyaltyEarningValidationErrors = {};

  const points = asFiniteNumber(input.pointsPerCurrencyUnit);
  if (points == null || points <= 0) {
    errors.pointsPerCurrencyUnit = "Points per currency unit must be greater than 0.";
  }

  const minimum = asFiniteNumber(input.minimumSpend);
  if (minimum == null || minimum < 0) {
    errors.minimumSpend = "Minimum spend cannot be negative.";
  }

  const basis = input.calculationBasis;
  if (
    basis !== "subtotal" &&
    basis !== "subtotal_after_discount" &&
    basis !== "grand_total"
  ) {
    errors.calculationBasis = "Choose a valid calculation basis.";
  }

  let maxPoints: number | null = null;
  const maxRaw = input.maxPointsPerOrder;
  if (
    maxRaw !== null &&
    maxRaw !== undefined &&
    !(typeof maxRaw === "string" && maxRaw.trim() === "")
  ) {
    const parsed = asFiniteNumber(maxRaw);
    if (parsed == null || parsed < 0) {
      errors.maxPointsPerOrder = "Maximum points cannot be negative.";
    } else {
      maxPoints = Math.floor(parsed);
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: normalizeLoyaltyEarningRules({
      pointsPerCurrencyUnit: points!,
      minimumSpend: minimum!,
      calculationBasis: basis as LoyaltyCalculationBasis,
      maxPointsPerOrder: maxPoints,
    }),
  };
}

export function formatCalculationBasisLabel(
  basis: LoyaltyCalculationBasis,
): string {
  return (
    LOYALTY_CALCULATION_BASIS_OPTIONS.find((option) => option.id === basis)
      ?.label ?? "Grand total"
  );
}

export function formatEarningRateLabel(
  rules: LoyaltyEarningRules,
  currency = "KWD",
): string {
  const rate =
    Number.isInteger(rules.pointsPerCurrencyUnit) &&
    rules.pointsPerCurrencyUnit >= 1
      ? String(rules.pointsPerCurrencyUnit)
      : rules.pointsPerCurrencyUnit.toFixed(3).replace(/\.?0+$/, "");
  return `${rate} points / ${currency} 1`;
}

export function formatCustomerEarningMessage(
  rules: LoyaltyEarningRules,
  currency = "KWD",
): string {
  const rate =
    Number.isInteger(rules.pointsPerCurrencyUnit) &&
    rules.pointsPerCurrencyUnit >= 1
      ? String(rules.pointsPerCurrencyUnit)
      : rules.pointsPerCurrencyUnit.toFixed(3).replace(/\.?0+$/, "");
  return `Earn ${rate} points for every ${currency} 1 spent.`;
}

export function previewEarningPoints(
  sampleAmount: number,
  rules: LoyaltyEarningRules,
): number {
  const amount = Math.max(0, roundMoney(sampleAmount));
  return calculateLoyaltyPoints({
    amounts: {
      subtotal: amount,
      discountAmount: 0,
      grandTotal: amount,
    },
    rules,
  });
}

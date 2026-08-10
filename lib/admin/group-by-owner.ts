/**
 * Shared owner-account grouping helpers for Admin multi-restaurant views.
 * Used by Subscriptions, Owners, and Restaurant Management.
 */

export const ADMIN_PLAN_RANK: Record<string, number> = {
  Starter: 1,
  Professional: 2,
  Enterprise: 3,
};

export function groupItemsByOwnerId<T extends { ownerId: string }>(
  items: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    if (!item.ownerId) continue;
    const list = map.get(item.ownerId) ?? [];
    list.push(item);
    map.set(item.ownerId, list);
  }
  return map;
}

/** Pick the highest-plan item (ties broken by optional descending key). */
export function pickPrimaryByPlan<T extends { plan: string }>(
  items: T[],
  getTieBreaker?: (item: T) => string,
): T {
  if (items.length === 0) {
    throw new Error("pickPrimaryByPlan requires at least one item");
  }
  return [...items].sort((a, b) => {
    const rankA = ADMIN_PLAN_RANK[a.plan] ?? 0;
    const rankB = ADMIN_PLAN_RANK[b.plan] ?? 0;
    if (rankB !== rankA) return rankB - rankA;
    if (getTieBreaker) {
      return getTieBreaker(b).localeCompare(getTieBreaker(a));
    }
    return 0;
  })[0]!;
}

export function sortOwnerRowsByName<
  T extends {
    ownerId: string;
    ownerName?: string | null;
    ownerEmail?: string | null;
    email?: string | null;
  },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const nameA = (
      a.ownerName ??
      a.ownerEmail ??
      a.email ??
      a.ownerId
    ).toLowerCase();
    const nameB = (
      b.ownerName ??
      b.ownerEmail ??
      b.email ??
      b.ownerId
    ).toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

export function restaurantCountLabel(count: number): string {
  return `${count} Restaurant${count === 1 ? "" : "s"}`;
}

export function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

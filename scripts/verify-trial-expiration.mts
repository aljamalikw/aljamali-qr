import {
  getSubscriptionAccess,
  isNavAllowed,
  resolveEffectiveStatus,
  resolveFeaturePlan,
} from "../lib/subscriptions/engine";
import {
  buildEffectiveOwnerSubscription,
  entitledLocationPlan,
  type OwnerRestaurantRef,
  type OwnerSubscriptionDbRow,
} from "../lib/subscriptions/owner-subscription";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const now = new Date("2026-08-24T12:00:00.000Z");

const activeTrial = {
  plan: "Professional",
  status: "trial",
  trialEndsAt: "2026-08-30T12:00:00.000Z",
  gracePeriodDays: 3,
};

const expiredTrial = {
  plan: "Professional",
  status: "trial",
  trialEndsAt: "2026-08-10T12:00:00.000Z",
  gracePeriodDays: 3,
};

const paidProfessional = {
  plan: "Professional",
  status: "active",
  renewalDate: "2026-09-24",
  gracePeriodDays: 3,
};

const paidStarter = {
  plan: "Starter",
  status: "active",
  renewalDate: "2026-09-24",
  gracePeriodDays: 3,
};

assert(
  resolveEffectiveStatus(activeTrial, now) === "trial",
  "active trial should stay trial",
);
assert(
  resolveFeaturePlan("Professional", "trial") === "Professional",
  "active trial keeps Professional features",
);

const expiredStatus = resolveEffectiveStatus(expiredTrial, now);
assert(
  expiredStatus === "suspended",
  `expired trial should be suspended, got ${expiredStatus}`,
);
assert(
  resolveFeaturePlan("Professional", expiredStatus) === "Starter",
  "expired trial must not keep Professional features",
);

const expiredAccess = getSubscriptionAccess(expiredTrial, now);
assert(
  expiredAccess.dashboardLocked === false,
  "expired trial keeps Starter-level dashboard open",
);
assert(
  expiredAccess.publicMenuOnline === true,
  "expired trial keeps Starter public menu online",
);
assert(
  expiredAccess.locationPlan === "Starter",
  "expired trial feature plan is Starter",
);
assert(
  expiredAccess.plan === "Professional",
  "billing plan remains Professional",
);
assert(
  isNavAllowed(expiredAccess, "settings") &&
    isNavAllowed(expiredAccess, "support") &&
    isNavAllowed(expiredAccess, "subscription") &&
    isNavAllowed(expiredAccess, "orders"),
  "expired trial can open essential pages and Pro routes (upgrade state)",
);

const paidLapsed = getSubscriptionAccess(
  { plan: "Professional", status: "expired" },
  now,
);
assert(paidLapsed.dashboardLocked === true, "paid lapse still locks management");
assert(isNavAllowed(paidLapsed, "subscription"), "billing stays reachable");
assert(isNavAllowed(paidLapsed, "settings"), "settings stay reachable");
assert(isNavAllowed(paidLapsed, "support"), "support stays reachable");
assert(
  !isNavAllowed(paidLapsed, "orders"),
  "paid lapse does not open Professional pages",
);

const paidPro = getSubscriptionAccess(paidProfessional, now);
assert(paidPro.dashboardLocked === false, "paid Professional stays unlocked");
assert(paidPro.locationPlan === "Professional", "paid Professional keeps features");

const paidStart = getSubscriptionAccess(paidStarter, now);
assert(paidStart.locationPlan === "Starter", "paid Starter stays Starter");
assert(
  resolveFeaturePlan("Professional", "active") === "Professional",
  "paid Professional entitlement stays Professional",
);

const ownerId = "owner-isolation";
const restaurants: OwnerRestaurantRef[] = [
  {
    id: "rest-a",
    owner_id: ownerId,
    created_at: "2026-01-01T00:00:00.000Z",
    restaurant_name: "Trial Restaurant",
  },
  {
    id: "rest-b",
    owner_id: ownerId,
    created_at: "2026-01-02T00:00:00.000Z",
    restaurant_name: "Starter Restaurant",
  },
];

function subRow(
  id: string,
  restaurantId: string,
  plan: string,
  status: string,
  extras: Partial<OwnerSubscriptionDbRow> = {},
): OwnerSubscriptionDbRow {
  return {
    id,
    restaurant_id: restaurantId,
    plan,
    status,
    renewal_date: extras.renewal_date ?? null,
    cancelled_at: extras.cancelled_at ?? null,
    trial_started_at: extras.trial_started_at ?? null,
    trial_ends_at: extras.trial_ends_at ?? null,
    grace_period_days: extras.grace_period_days ?? 3,
  };
}

const mixedTrialAndStarter = [
  subRow("s-a", "rest-a", "Professional", "trial", {
    trial_started_at: "2026-08-20T00:00:00.000Z",
    trial_ends_at: "2026-08-30T00:00:00.000Z",
    renewal_date: "2026-08-30",
  }),
  subRow("s-b", "rest-b", "Starter", "active", {
    renewal_date: "2026-09-24",
  }),
];

const effectiveA = buildEffectiveOwnerSubscription(
  ownerId,
  restaurants,
  mixedTrialAndStarter,
  "rest-a",
);
const effectiveB = buildEffectiveOwnerSubscription(
  ownerId,
  restaurants,
  mixedTrialAndStarter,
  "rest-b",
);

assert(effectiveA !== null && effectiveB !== null, "mixed owner rows resolve");
assert(
  entitledLocationPlan(effectiveA!, now) === "Professional",
  "restaurant A keeps its Professional trial",
);
assert(
  entitledLocationPlan(effectiveB!, now) === "Starter",
  "restaurant B must not inherit a sibling Professional trial",
);

const mixedPaidAndExpired = [
  subRow("s-a2", "rest-a", "Professional", "active", {
    renewal_date: "2026-09-24",
  }),
  subRow("s-b2", "rest-b", "Professional", "trial", {
    trial_started_at: "2026-08-01T00:00:00.000Z",
    trial_ends_at: "2026-08-10T00:00:00.000Z",
    renewal_date: "2026-08-10",
  }),
];

const paidA = buildEffectiveOwnerSubscription(
  ownerId,
  restaurants,
  mixedPaidAndExpired,
  "rest-a",
);
const expiredB = buildEffectiveOwnerSubscription(
  ownerId,
  restaurants,
  mixedPaidAndExpired,
  "rest-b",
);

assert(paidA !== null && expiredB !== null, "paid/expired owner rows resolve");
assert(
  entitledLocationPlan(paidA!, now) === "Professional",
  "paid Professional restaurant keeps Professional features",
);
assert(
  entitledLocationPlan(expiredB!, now) === "Starter",
  "expired trial restaurant must not inherit a sibling paid Professional status",
);

console.log("trial-expiration.check: ok");

import {
  getSubscriptionAccess,
  resolveEffectiveStatus,
  resolveFeaturePlan,
} from "../lib/subscriptions/engine";

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
assert(expiredAccess.dashboardLocked === true, "expired trial locks dashboard");
assert(
  expiredAccess.publicMenuOnline === false,
  "expired trial takes public Pro access offline",
);
assert(
  expiredAccess.locationPlan === "Starter",
  "expired trial feature plan is Starter",
);
assert(
  expiredAccess.plan === "Professional",
  "billing plan remains Professional",
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

console.log("trial-expiration.check: ok");

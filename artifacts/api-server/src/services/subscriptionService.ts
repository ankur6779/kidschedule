import {
  db,
  subscriptionsTable,
  usageDailyTable,
  type Subscription,
} from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";

export type Plan = "free" | "monthly" | "six_month" | "yearly";
export type Status = "free" | "trialing" | "active" | "past_due" | "canceled";

export const PLAN_PRICES: Record<Exclude<Plan, "free">, { amount: number; period: string }> = {
  monthly: { amount: 199, period: "month" },
  six_month: { amount: 999, period: "6 months" },
  yearly: { amount: 1599, period: "year" },
};

export const FREE_LIMITS = {
  aiQueriesPerDay: 5,
  childrenMax: 1,
  routinesMax: 2,
  hubArticlesMax: 3,
  trialDays: 3,
};

export type EntitlementSummary = {
  plan: Plan;
  status: Status;
  isPremium: boolean;
  isTrialing: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  limits: typeof FREE_LIMITS;
  usage: {
    aiQueriesToday: number;
    aiQueriesRemaining: number | null; // null = unlimited
  };
};

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getOrCreateSubscription(userId: string): Promise<Subscription> {
  const existing = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0];
  const [created] = await db
    .insert(subscriptionsTable)
    .values({ userId, plan: "free", status: "free", provider: "none" })
    .returning();
  return created;
}

export function isPremiumNow(s: Subscription): boolean {
  if (s.status === "active") return true;
  if (s.status === "trialing" && s.trialEndsAt && s.trialEndsAt.getTime() > Date.now()) return true;
  // Cancelled / past_due subscriptions retain premium until the paid period ends.
  if (
    (s.status === "canceled" || s.status === "past_due") &&
    s.currentPeriodEnd &&
    s.currentPeriodEnd.getTime() > Date.now()
  ) {
    return true;
  }
  return false;
}

export async function getAiUsageToday(userId: string): Promise<number> {
  const day = todayUtc();
  const rows = await db
    .select({ count: usageDailyTable.count })
    .from(usageDailyTable)
    .where(
      and(
        eq(usageDailyTable.userId, userId),
        eq(usageDailyTable.day, day),
        eq(usageDailyTable.feature, "ai_query"),
      ),
    )
    .limit(1);
  return rows[0]?.count ?? 0;
}

/** Atomic increment using ON CONFLICT — safe under concurrent calls. */
export async function incrementAiUsage(userId: string, by = 1): Promise<number> {
  const day = todayUtc();
  const result = await db
    .insert(usageDailyTable)
    .values({ userId, feature: "ai_query", day, count: by })
    .onConflictDoUpdate({
      target: [usageDailyTable.userId, usageDailyTable.day, usageDailyTable.feature],
      set: { count: sql`${usageDailyTable.count} + ${by}`, updatedAt: new Date() },
    })
    .returning({ count: usageDailyTable.count });
  return result[0]?.count ?? by;
}

export async function getEntitlements(userId: string): Promise<EntitlementSummary> {
  const [sub, usedToday] = await Promise.all([
    getOrCreateSubscription(userId),
    getAiUsageToday(userId),
  ]);
  const isPremium = isPremiumNow(sub);
  const isTrialing = sub.status === "trialing" && !!sub.trialEndsAt && sub.trialEndsAt.getTime() > Date.now();
  return {
    plan: sub.plan as Plan,
    status: sub.status as Status,
    isPremium,
    isTrialing,
    trialEndsAt: sub.trialEndsAt ? sub.trialEndsAt.toISOString() : null,
    currentPeriodEnd: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd === 1,
    limits: FREE_LIMITS,
    usage: {
      aiQueriesToday: usedToday,
      aiQueriesRemaining: isPremium ? null : Math.max(0, FREE_LIMITS.aiQueriesPerDay - usedToday),
    },
  };
}

export async function startTrial(userId: string): Promise<Subscription> {
  const sub = await getOrCreateSubscription(userId);
  // Only allow starting trial once, from the free state
  if (sub.status !== "free") return sub;
  const trialEnd = new Date(Date.now() + FREE_LIMITS.trialDays * 24 * 60 * 60 * 1000);
  const [updated] = await db
    .update(subscriptionsTable)
    .set({
      status: "trialing",
      plan: "monthly",
      trialEndsAt: trialEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.userId, userId))
    .returning();
  return updated;
}

/**
 * Stub for direct activation (e.g. from a payment-provider webhook).
 * Until Stripe/RevenueCat is wired up, this is unused. Kept here so the
 * route layer has a clean call site.
 */
export async function activateSubscription(
  userId: string,
  plan: Exclude<Plan, "free">,
  opts: { provider?: "stripe" | "revenuecat" | "razorpay"; periodEnd?: Date; providerCustomerId?: string; providerSubscriptionId?: string } = {},
): Promise<Subscription> {
  await getOrCreateSubscription(userId);
  const [updated] = await db
    .update(subscriptionsTable)
    .set({
      plan,
      status: "active",
      provider: opts.provider ?? "none",
      providerCustomerId: opts.providerCustomerId ?? null,
      providerSubscriptionId: opts.providerSubscriptionId ?? null,
      currentPeriodEnd: opts.periodEnd ?? null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionsTable.userId, userId))
    .returning();
  return updated;
}

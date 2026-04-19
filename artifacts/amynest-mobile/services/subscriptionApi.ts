import { API_BASE_URL } from "@/constants/api";

let authTokenGetter: (() => Promise<string | null>) | null = null;
export function setSubscriptionAuthGetter(fn: () => Promise<string | null>): void {
  authTokenGetter = fn;
}
async function authHeader(): Promise<Record<string, string>> {
  if (!authTokenGetter) return {};
  try {
    const t = await authTokenGetter();
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch {
    return {};
  }
}

export type Plan = "free" | "monthly" | "six_month" | "yearly";
export type Status = "free" | "trialing" | "active" | "past_due" | "canceled";

export type Entitlements = {
  plan: Plan;
  status: Status;
  isPremium: boolean;
  isTrialing: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  limits: {
    aiQueriesPerDay: number;
    childrenMax: number;
    routinesMax: number;
    hubArticlesMax: number;
    trialDays: number;
  };
  usage: {
    aiQueriesToday: number;
    aiQueriesRemaining: number | null;
  };
};

export type PlanCard = {
  id: Exclude<Plan, "free">;
  title: string;
  price: number;
  currency: string;
  period: string;
  badge: string | null;
  savingsPercent?: number;
  features: string[];
};

export type SubscriptionResponse = {
  entitlements: Entitlements;
  plans: PlanCard[];
};

export async function fetchSubscription(): Promise<SubscriptionResponse> {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE_URL}/api/subscription`, { headers });
  if (!res.ok) throw new Error(`fetchSubscription ${res.status}`);
  return (await res.json()) as SubscriptionResponse;
}

export async function startTrial(): Promise<{ entitlements: Entitlements }> {
  const headers = { "Content-Type": "application/json", ...(await authHeader()) };
  const res = await fetch(`${API_BASE_URL}/api/subscription/start-trial`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error(`startTrial ${res.status}`);
  return await res.json();
}

export async function checkout(
  planId: Exclude<Plan, "free">,
): Promise<{ ok: boolean; reason?: string; userCancelled?: boolean }> {
  // Drive the in-app purchase via RevenueCat. The RC webhook will sync
  // server-side entitlement state once the purchase completes.
  const { purchasePlan } = await import("@/lib/revenuecat");
  const result = await purchasePlan(planId);
  if (result.ok) return { ok: true };
  return { ok: false, reason: result.reason, userCancelled: result.userCancelled };
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { getApiUrl } from "@/lib/api";

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

const QKEY = ["subscription"] as const;

export function useSubscription() {
  const authFetch = useAuthFetch();
  const qc = useQueryClient();

  const query = useQuery<SubscriptionResponse>({
    queryKey: QKEY,
    queryFn: async () => {
      const res = await authFetch(getApiUrl("/api/subscription"));
      if (!res.ok) throw new Error(`subscription ${res.status}`);
      return (await res.json()) as SubscriptionResponse;
    },
    staleTime: 60_000,
  });

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: QKEY });
  }, [qc]);

  const startTrial = useCallback(async () => {
    const res = await authFetch(getApiUrl("/api/subscription/start-trial"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) refresh();
    return res.ok;
  }, [authFetch, refresh]);

  const checkout = useCallback(
    async (plan: Exclude<Plan, "free">): Promise<{ ok: boolean; reason?: string }> => {
      const res = await authFetch(getApiUrl("/api/subscription/checkout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (res.status === 501) {
        const body = await res.json().catch(() => ({}));
        return { ok: false, reason: body?.message ?? "Checkout is not yet available." };
      }
      if (!res.ok) return { ok: false, reason: `Server error (${res.status})` };
      refresh();
      return { ok: true };
    },
    [authFetch, refresh],
  );

  return {
    data: query.data,
    entitlements: query.data?.entitlements ?? null,
    plans: query.data?.plans ?? [],
    isPremium: !!query.data?.entitlements?.isPremium,
    aiRemaining: query.data?.entitlements?.usage.aiQueriesRemaining ?? null,
    loading: query.isLoading,
    refresh,
    startTrial,
    checkout,
  };
}

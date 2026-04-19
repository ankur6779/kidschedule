import { create } from "zustand";
import {
  fetchSubscription,
  startTrial,
  checkout,
  type Entitlements,
  type PlanCard,
  type Plan,
} from "@/services/subscriptionApi";

type State = {
  entitlements: Entitlements | null;
  plans: PlanCard[];
  loading: boolean;
  error: string | null;
};

type Actions = {
  load: () => Promise<void>;
  refresh: () => Promise<void>;
  beginTrial: () => Promise<void>;
  upgrade: (planId: Exclude<Plan, "free">) => Promise<{ ok: boolean; reason?: string }>;
  setEntitlements: (e: Entitlements) => void;
  reset: () => void;
};

const initial: State = {
  entitlements: null,
  plans: [],
  loading: false,
  error: null,
};

export const useSubscriptionStore = create<State & Actions>((set, get) => ({
  ...initial,
  load: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const data = await fetchSubscription();
      set({ entitlements: data.entitlements, plans: data.plans, loading: false });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : "load failed" });
    }
  },
  refresh: async () => {
    try {
      const data = await fetchSubscription();
      set({ entitlements: data.entitlements, plans: data.plans });
    } catch {
      // best-effort
    }
  },
  beginTrial: async () => {
    try {
      const { entitlements } = await startTrial();
      set({ entitlements });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "trial failed" });
    }
  },
  upgrade: async (planId) => {
    const res = await checkout(planId);
    if (res.ok) await get().refresh();
    return res;
  },
  setEntitlements: (e) => set({ entitlements: e }),
  reset: () => set({ ...initial }),
}));

export const selectIsPremium = (s: State): boolean => !!s.entitlements?.isPremium;
export const selectAiRemaining = (s: State): number | null =>
  s.entitlements?.usage.aiQueriesRemaining ?? null;

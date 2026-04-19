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
  upgrade: (planId: Exclude<Plan, "free">) => Promise<{ ok: boolean; reason?: string; userCancelled?: boolean }>;
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
    if (res.ok) {
      // Optimistically reflect premium right away; the RC webhook will sync
      // the canonical entitlement on the server. We poll a few times in case
      // the webhook is slightly delayed.
      const current = get().entitlements;
      if (current) {
        set({
          entitlements: {
            ...current,
            plan: planId,
            status: "active",
            isPremium: true,
            usage: { ...current.usage, aiQueriesRemaining: null },
          },
        });
      }
      const poll = async () => {
        for (const delay of [1500, 3000, 5000]) {
          await new Promise((r) => setTimeout(r, delay));
          await get().refresh();
          if (get().entitlements?.isPremium) return;
        }
      };
      void poll();
    }
    return res;
  },
  setEntitlements: (e) => set({ entitlements: e }),
  reset: () => set({ ...initial }),
}));

export const selectIsPremium = (s: State): boolean => !!s.entitlements?.isPremium;
export const selectAiRemaining = (s: State): number | null =>
  s.entitlements?.usage.aiQueriesRemaining ?? null;

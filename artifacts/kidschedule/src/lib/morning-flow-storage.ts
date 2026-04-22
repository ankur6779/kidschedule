import {
  emptyDayState, todayKey,
  type MorningFlowDayState,
} from "@workspace/morning-flow";

const KEY = "amynest:morning-flow:v1";

/**
 * Load today's state. The morning steps reset every day, BUT any night-prep
 * checklist saved the previous evening is carried forward into the new day —
 * because that's exactly what it was prepared for.
 */
export function loadMorningFlow(): MorningFlowDayState {
  if (typeof window === "undefined") return emptyDayState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyDayState();
    const parsed = JSON.parse(raw) as MorningFlowDayState;
    if (parsed.date !== todayKey()) {
      // New day → fresh morning state, but keep the prior-night checklist.
      return { ...emptyDayState(), nightPrep: parsed.nightPrep ?? {} };
    }
    return { ...emptyDayState(), ...parsed };
  } catch {
    return emptyDayState();
  }
}

export function saveMorningFlow(state: MorningFlowDayState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode — ignore */
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MorningStep {
  id: string;
  emoji: string;
  title: string;
  /** Suggested duration in minutes — used to drive the optional timer + delay detection. */
  defaultMinutes: number;
  /**
   * Essential = required for school. Non-essential steps are the ones Amy
   * suggests skipping when the family is running late.
   */
  essential: boolean;
}

export interface NightPrepItem {
  id: string;
  emoji: string;
  label: string;
}

export type StepStatus = "pending" | "done" | "skipped";

export interface StepState {
  status: StepStatus;
  /** Epoch ms — the moment the user marked this step done/skipped. */
  doneAt?: number;
}

/** Persisted shape stored per-day in localStorage / AsyncStorage. */
export interface MorningFlowDayState {
  /** ISO date "YYYY-MM-DD" — used as a freshness key. */
  date: string;
  /** Epoch ms — when the user tapped "Start morning". */
  startedAt?: number;
  /** Per-step state, keyed by step id. */
  steps: Record<string, StepState>;
  /** Per-night-item completion, keyed by item id. */
  nightPrep: Record<string, boolean>;
  /** Whether the user accepted Amy's "simplify" suggestion. */
  simplified: boolean;
}

// ─── Default content ─────────────────────────────────────────────────────────

export const NIGHT_PREP_ITEMS: NightPrepItem[] = [
  { id: "uniform",  emoji: "👕", label: "Uniform ready" },
  { id: "bag",      emoji: "🎒", label: "School bag packed" },
  { id: "shoes",    emoji: "👟", label: "Shoes ready" },
  { id: "tiffin",   emoji: "🍱", label: "Tiffin plan ready" },
];

/**
 * Default 5-step school morning. Tuned for an Indian school morning where
 * the family typically has 45–60 minutes from wake-up to leaving the house.
 */
export const DEFAULT_MORNING_STEPS: MorningStep[] = [
  { id: "wake",      emoji: "⏰", title: "Wake up",     defaultMinutes:  5, essential: true  },
  { id: "brush",     emoji: "🪥", title: "Brush",       defaultMinutes:  5, essential: true  },
  { id: "hair",      emoji: "💇", title: "Comb hair",   defaultMinutes:  5, essential: false },
  { id: "dress",     emoji: "👔", title: "Get dressed", defaultMinutes: 10, essential: true  },
  { id: "breakfast", emoji: "🥛", title: "Breakfast",   defaultMinutes: 15, essential: true  },
  { id: "tv",        emoji: "📺", title: "Cartoon time",defaultMinutes: 10, essential: false },
  { id: "leave",     emoji: "🚪", title: "Leave",       defaultMinutes:  5, essential: true  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function emptyDayState(date: Date = new Date()): MorningFlowDayState {
  return {
    date: todayKey(date),
    steps: {},
    nightPrep: {},
    simplified: false,
  };
}

/** Total planned minutes from a list of steps (skipped or not). */
export function totalPlannedMinutes(steps: MorningStep[]): number {
  return steps.reduce((s, st) => s + st.defaultMinutes, 0);
}

/**
 * Plan offset: how many minutes into the morning we *should* be by the
 * time the user has marked `doneCount` steps done.
 */
export function plannedElapsedFor(steps: MorningStep[], doneCount: number): number {
  let total = 0;
  for (let i = 0; i < doneCount && i < steps.length; i++) total += steps[i].defaultMinutes;
  return total;
}

export interface DelayInfo {
  /** Real minutes elapsed since startedAt. 0 if not started. */
  actualMinutes: number;
  /** Minutes the plan said we should have used by now. */
  plannedMinutes: number;
  /** actual − planned. Positive = behind schedule. */
  delayMinutes: number;
  /** True when we should surface Amy's "let's simplify" nudge. */
  showAmyNudge: boolean;
}

/** Default delay threshold (minutes) before Amy nudges. */
export const DELAY_THRESHOLD_MIN = 10;

/**
 * Compute delay info given the current state. Pure — caller passes
 * `now` so this stays unit-testable and predictable.
 */
export function computeDelay(
  state: MorningFlowDayState,
  steps: MorningStep[],
  now: number = Date.now(),
): DelayInfo {
  if (!state.startedAt) {
    return { actualMinutes: 0, plannedMinutes: 0, delayMinutes: 0, showAmyNudge: false };
  }
  // Count BOTH done and skipped as "progress made" — otherwise skipping a
  // step (which shouldn't put you further behind) would inflate the delay.
  const handledCount = steps.filter((s) => {
    const st = state.steps[s.id]?.status;
    return st === "done" || st === "skipped";
  }).length;
  const planned = plannedElapsedFor(steps, handledCount);
  const actual = Math.max(0, Math.round((now - state.startedAt) / 60000));
  const delay = actual - planned;
  // Only nudge once we're meaningfully into the morning AND meaningfully behind.
  const showAmyNudge =
    actual >= 5 &&
    delay >= DELAY_THRESHOLD_MIN &&
    handledCount < steps.length &&
    !state.simplified;
  return { actualMinutes: actual, plannedMinutes: planned, delayMinutes: delay, showAmyNudge };
}

/**
 * Apply the auto-adjustment rule: when 2+ steps have been skipped, mark
 * any remaining non-essential pending step as skipped so the parent's
 * remaining flow only contains the must-do items.
 *
 * Returns a NEW state object (immutable, safe for setState).
 */
export function applyAutoAdjust(
  state: MorningFlowDayState,
  steps: MorningStep[],
): MorningFlowDayState {
  const skippedCount = steps.filter((s) => state.steps[s.id]?.status === "skipped").length;
  if (skippedCount < 2) return state;
  const nextSteps: Record<string, StepState> = { ...state.steps };
  for (const s of steps) {
    if (!s.essential && (state.steps[s.id]?.status ?? "pending") === "pending") {
      nextSteps[s.id] = { status: "skipped", doneAt: Date.now() };
    }
  }
  return { ...state, steps: nextSteps, simplified: true };
}

/**
 * Apply the "Amy: simplify to save time" action — drops every remaining
 * non-essential step and flips the simplified flag.
 */
export function simplifyRemaining(
  state: MorningFlowDayState,
  steps: MorningStep[],
): MorningFlowDayState {
  const nextSteps: Record<string, StepState> = { ...state.steps };
  for (const s of steps) {
    if (!s.essential && (state.steps[s.id]?.status ?? "pending") === "pending") {
      nextSteps[s.id] = { status: "skipped", doneAt: Date.now() };
    }
  }
  return { ...state, steps: nextSteps, simplified: true };
}

/** Friendly Amy line shown in the hero. */
export const AMY_ENCOURAGEMENT = "Let's stay on track 💪";
export const AMY_NUDGE_TITLE = "Amy AI: Let's simplify to save time";
export const AMY_NUDGE_BODY  =
  "We're a few minutes behind. Skip the non-essential steps and focus on getting out the door — you've got this!";

export interface MorningSummary {
  doneCount: number;
  skippedCount: number;
  pendingCount: number;
  totalCount: number;
  /** 0–100 — based on done / total. */
  percent: number;
}

export function summarize(state: MorningFlowDayState, steps: MorningStep[]): MorningSummary {
  let done = 0, skipped = 0, pending = 0;
  for (const s of steps) {
    const st = state.steps[s.id]?.status ?? "pending";
    if (st === "done") done++;
    else if (st === "skipped") skipped++;
    else pending++;
  }
  const total = steps.length;
  return {
    doneCount: done,
    skippedCount: skipped,
    pendingCount: pending,
    totalCount: total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

export function nightPrepSummary(state: MorningFlowDayState): { done: number; total: number } {
  const total = NIGHT_PREP_ITEMS.length;
  const done = NIGHT_PREP_ITEMS.filter((i) => state.nightPrep[i.id]).length;
  return { done, total };
}

// ─────────────────────────────────────────────────────────────────────────
// Adaptive Routine Engine — pure rule-based, runs on web + mobile + node.
// Watches a routine's items + the current real-world context (now / mood
// / sleep) and returns:
//   • items: possibly-mutated items (auto-delayed, auto-simplified)
//   • suggestion: a contextual Amy AI message
//   • summary: completion / adjustment counters + a tip for tomorrow
// No platform / network deps. Cheap to run every minute.
// ─────────────────────────────────────────────────────────────────────────

export type AdaptiveItemStatus =
  | "pending"
  | "completed"
  | "skipped"
  | "delayed";

export type AdaptiveItem = {
  time: string;
  activity: string;
  duration: number;
  category: string;
  notes?: string;
  status?: AdaptiveItemStatus;
  skipReason?: string;
  /** Set by the engine when it auto-modifies an item. */
  adjusted?: boolean;
};

export type AdaptiveMood = "low" | "neutral" | "active";
export type AdaptiveSleepQuality = "poor" | "ok" | "good";

export type AdaptiveCtx = {
  /** Minutes since midnight in the user's local timezone. */
  nowMins: number;
  mood: AdaptiveMood;
  sleepQuality: AdaptiveSleepQuality;
  /** Treat a pending task as "delayed" once now is this many minutes past its end. Default 15. */
  delayThresholdMins?: number;
  /** Apply real-time mutations only when the routine is for today. Default true. */
  liveAdjust?: boolean;
};

export type AdaptiveSummary = {
  completed: number;
  skipped: number;
  delayed: number;
  /** Count of items the engine auto-skipped or auto-delayed in this run. */
  adjusted: number;
  total: number;
  completionPct: number;
  tomorrowTip: string;
};

export type AdaptiveResult = {
  items: AdaptiveItem[];
  suggestion: string;
  summary: AdaptiveSummary;
  /** True if engine auto-skipped low-priority tasks because 2+ were delayed. */
  simplified: boolean;
  /** True if items array was modified vs input (caller should persist). */
  changed: boolean;
};

const PRIORITY: Record<string, "high" | "medium" | "low"> = {
  sleep: "high",
  "wind-down": "high",
  hygiene: "high",
  meal: "high",
  tiffin: "high",
  school: "high",
  morning: "medium",
  homework: "medium",
  exercise: "medium",
  bonding: "medium",
  travel: "medium",
  reading: "medium",
  snack: "medium",
  play: "low",
  screen: "low",
};

export function getAdaptivePriority(
  category: string,
  activity = "",
): "high" | "medium" | "low" {
  const cat = (category ?? "").toLowerCase();
  const key = Object.keys(PRIORITY).find((k) => cat.includes(k));
  if (key) return PRIORITY[key];
  if (/sleep|bedtime|bath|brush|toilet|shower/i.test(activity)) return "high";
  if (/breakfast|lunch|dinner|meal|eat|tiffin/i.test(activity)) return "high";
  return "medium";
}

function parse12h(t: string): number {
  const m = t?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return -1;
  let h = parseInt(m[1]);
  const mn = parseInt(m[2]);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + mn;
}

/** Pure: runs the adaptive engine and returns the next state. */
export function runAdaptiveEngine(
  inItems: AdaptiveItem[],
  ctx: AdaptiveCtx,
): AdaptiveResult {
  const items: AdaptiveItem[] = inItems.map((i) => ({ ...i }));
  const liveAdjust = ctx.liveAdjust !== false;
  const delayThreshold = ctx.delayThresholdMins ?? 15;
  const { nowMins, mood, sleepQuality } = ctx;

  let changed = false;
  let newlyDelayed = 0;
  let autoSkippedNow = 0;

  // 1) Auto-mark pending tasks as DELAYED if `now` has passed their end + threshold.
  if (liveAdjust) {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if ((it.status ?? "pending") !== "pending") continue;
      const start = parse12h(it.time);
      if (start < 0) continue;
      const end = start + (it.duration ?? 30);
      if (nowMins >= end + delayThreshold) {
        items[i] = { ...it, status: "delayed", adjusted: true };
        newlyDelayed++;
        changed = true;
      }
    }
  }

  // 2) Count total delayed across the day (manual + auto).
  const delayedCount = items.filter((i) => i.status === "delayed").length;

  // 3) Smart simplification — if 2+ delayed, auto-skip LOW-priority pending future tasks.
  //    Essentials (meals / hygiene / sleep / school) are NEVER auto-skipped.
  let simplified = false;
  if (liveAdjust && delayedCount >= 2) {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if ((it.status ?? "pending") !== "pending") continue;
      const start = parse12h(it.time);
      if (start < nowMins) continue; // only future
      const prio = getAdaptivePriority(it.category, it.activity);
      if (prio !== "low") continue;
      items[i] = {
        ...it,
        status: "skipped",
        skipReason: "Auto-simplified — running behind",
        adjusted: true,
      };
      autoSkippedNow++;
      changed = true;
    }
    simplified = autoSkippedNow > 0;
  }

  // 4) Counters
  const completed = items.filter((i) => i.status === "completed").length;
  const skipped = items.filter((i) => i.status === "skipped").length;
  const total = items.length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 5) Suggestion (contextual, single short line)
  let suggestion: string;
  if (total === 0) {
    suggestion =
      "Tap a task as you complete it — earn points and build streaks!";
  } else if (completionPct === 100) {
    suggestion = "Perfect day! Every task complete — celebrate the win.";
  } else if (simplified) {
    suggestion = `Let's simplify today — ${autoSkippedNow} low-priority task${
      autoSkippedNow > 1 ? "s" : ""
    } cleared so you can focus on what matters most.`;
  } else if (delayedCount >= 2) {
    suggestion =
      "Running behind on a few tasks. Take a breath — focus on the next essential one.";
  } else if (delayedCount === 1) {
    suggestion =
      "One task slipped — no problem. Pick up with the next essential activity.";
  } else if (mood === "low") {
    suggestion =
      "Low energy day? Keep it gentle — meals, hygiene and rest are enough today.";
  } else if (sleepQuality === "poor") {
    suggestion =
      "Poor sleep last night — keep heavy tasks light and add a rest block this afternoon.";
  } else if (mood === "active") {
    suggestion =
      "Great energy! Add a play or learning burst between tasks today.";
  } else if (completionPct >= 70) {
    suggestion = "Great pace! Just a few more tasks to a perfect day.";
  } else {
    const next = items.find((i) => (i.status ?? "pending") === "pending");
    suggestion = next
      ? `Next up: ${next.activity} at ${next.time}. Stay close — your presence matters.`
      : "Keep going — small consistent steps build lifelong habits.";
  }

  // 6) Tip for tomorrow
  let tomorrowTip = "Keep doing what's working — consistency builds habits.";
  if (skipped >= 3) {
    tomorrowTip =
      "Try shifting harder tasks earlier — when energy is highest.";
  } else if (delayedCount >= 2) {
    tomorrowTip = "Start the day 15 minutes earlier to build a buffer.";
  } else if (completionPct >= 90) {
    tomorrowTip =
      "You're on a roll — try adding one new learning task tomorrow.";
  } else if (mood === "low") {
    tomorrowTip =
      "Plan a lighter routine tomorrow and add a calming activity in the evening.";
  } else if (sleepQuality === "poor") {
    tomorrowTip = "Aim for an earlier bedtime tonight to reset sleep tomorrow.";
  }

  return {
    items,
    suggestion,
    summary: {
      completed,
      skipped,
      delayed: delayedCount,
      adjusted: newlyDelayed + autoSkippedNow,
      total,
      completionPct,
      tomorrowTip,
    },
    simplified,
    changed,
  };
}

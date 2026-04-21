// ─────────────────────────────────────────────────────────────────────────
// Parent Command Center — pure aggregation engine.
// Takes today's routine + behavior counts + mood/sleep + week totals and
// returns the full state for the dashboard:
//   • overview metrics (routine %, behavior score, mood, sleep, screen)
//   • 1–2 actionable AI insights (what + why + what-to-do)
//   • quick-action buttons (id + which route to send the user to)
//   • week snapshot (focus trend, routine consistency, behavior trend)
//   • parent status (quality time + stress label + effort summary)
// Pure / platform-free — runs on web + mobile + node.
// ─────────────────────────────────────────────────────────────────────────

import type { AdaptiveItem, AdaptiveMood, AdaptiveSleepQuality } from "./adaptive";

export type CommandActionId =
  | "simplify-today"
  | "fix-routine"
  | "calm-child"
  | "add-activity"
  | "improve-sleep";

export type CommandAction = {
  id: CommandActionId;
  label: string;
  emoji: string;
  /** "primary" actions get highlighted treatment in the UI. */
  severity: "primary" | "default";
};

export type CommandInsight = {
  /** What is happening — short headline. */
  what: string;
  /** Why — a single sentence. */
  why: string;
  /** What the parent should do — single concrete step. */
  action: string;
  tone: "good" | "warn" | "info";
};

export type CommandOverview = {
  routineCompletionPct: number;
  routineCompletedTasks: number;
  routineTotalTasks: number;
  behaviorScore: number; // 0..100
  behaviorLabel: string; // e.g. "Calm", "Mixed", "Tough day"
  mood: AdaptiveMood;
  sleepQuality: AdaptiveSleepQuality;
  screenMinutes: number;
  qualityMinutes: number;
  /** A single emoji representing the overall day. */
  statusEmoji: string;
  /** A short label like "Balanced", "On track", "Needs care". */
  statusLabel: string;
};

export type CommandWeek = {
  routineConsistencyPct: number;
  behaviorTrend: "up" | "flat" | "down";
  behaviorTrendLabel: string;
  focusImprovementPct: number; // can be negative
};

export type CommandParentStatus = {
  qualityMinutesToday: number;
  stressLabel: string;
  effortSummary: string;
};

export type CommandCenterInput = {
  childName?: string;
  /** Today's routine items (or [] if no routine yet). */
  items: AdaptiveItem[];
  /** Today's behavior log counts. */
  positiveBehaviorsToday: number;
  negativeBehaviorsToday: number;
  /** Mood + sleep that the parent has set (or detected) for today. */
  mood: AdaptiveMood;
  sleepQuality: AdaptiveSleepQuality;
  /** Week-to-date counts (last 7 days). */
  weeklyPositive?: number;
  weeklyNegative?: number;
  weeklyRoutinesGenerated?: number;
  /** Previous 7 days, used for trend deltas. Optional. */
  previousWeeklyPositive?: number;
};

export type CommandCenterResult = {
  overview: CommandOverview;
  insights: CommandInsight[];
  actions: CommandAction[];
  week: CommandWeek;
  parentStatus: CommandParentStatus;
};

const ESSENTIAL = /(meal|tiffin|hygiene|bath|brush|toilet|shower|sleep|bedtime|school|wind-down)/i;
const SCREEN = /(screen|tv|tablet|phone|video|youtube)/i;
const QUALITY = /(bond|play|read|story|cuddle|hug|talk)/i;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function durationOf(items: AdaptiveItem[], match: RegExp, completedOnly = true): number {
  return items.reduce((sum, it) => {
    const isCompleted = (it.status ?? "pending") === "completed";
    if (completedOnly && !isCompleted) return sum;
    const cat = (it.category ?? "").toLowerCase();
    const act = (it.activity ?? "").toLowerCase();
    if (match.test(cat) || match.test(act)) return sum + (it.duration ?? 0);
    return sum;
  }, 0);
}

function behaviorScore(pos: number, neg: number): number {
  const total = pos + neg;
  if (total === 0) return 70; // assume neutral when no data
  const raw = (pos / total) * 100;
  return Math.round(clamp(raw, 0, 100));
}

function behaviorLabel(score: number): string {
  if (score >= 80) return "Calm & happy";
  if (score >= 60) return "Mostly good";
  if (score >= 40) return "Mixed";
  return "Tough day";
}

function statusFor(routinePct: number, score: number, mood: AdaptiveMood, sleep: AdaptiveSleepQuality) {
  // Weighted aggregate so a single bad signal doesn't tank the day.
  const moodPts = mood === "active" ? 100 : mood === "neutral" ? 70 : 40;
  const sleepPts = sleep === "good" ? 100 : sleep === "ok" ? 70 : 40;
  const overall = Math.round(routinePct * 0.35 + score * 0.3 + moodPts * 0.2 + sleepPts * 0.15);
  if (overall >= 80) return { label: "Thriving", emoji: "🌟" };
  if (overall >= 65) return { label: "Balanced", emoji: "👍" };
  if (overall >= 45) return { label: "On track", emoji: "🙂" };
  if (overall >= 30) return { label: "Needs care", emoji: "🤍" };
  return { label: "Slow it down", emoji: "🫶" };
}

function stressFor(score: number, qualityMins: number, sleep: AdaptiveSleepQuality): string {
  if (qualityMins >= 60 && score >= 70 && sleep !== "poor") return "Calm & connected";
  if (qualityMins < 15 && score < 50) return "Stretched — take a breath";
  if (sleep === "poor" || score < 40) return "Tense — keep tonight gentle";
  return "Steady";
}

function effortSummary(qualityMins: number, completed: number): string {
  if (qualityMins >= 60) return `${qualityMins} min quality time today ❤️`;
  if (qualityMins >= 20) return `${qualityMins} min connected with your child today`;
  if (completed >= 3) return `You guided ${completed} routine moments today`;
  return `Every small moment counts — you showed up today`;
}

export function computeCommandCenter(
  input: CommandCenterInput,
): CommandCenterResult {
  const {
    childName,
    items,
    positiveBehaviorsToday,
    negativeBehaviorsToday,
    mood,
    sleepQuality,
    weeklyPositive = 0,
    weeklyNegative = 0,
    weeklyRoutinesGenerated = 0,
    previousWeeklyPositive,
  } = input;

  // ── Overview ────────────────────────────────────────────────────
  const total = items.length;
  const completed = items.filter((i) => i.status === "completed").length;
  const routinePct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const score = behaviorScore(positiveBehaviorsToday, negativeBehaviorsToday);
  const screenMinutes = durationOf(items, SCREEN, true);
  const qualityMinutes = durationOf(items, QUALITY, true);
  const status = statusFor(routinePct, score, mood, sleepQuality);

  const overview: CommandOverview = {
    routineCompletionPct: routinePct,
    routineCompletedTasks: completed,
    routineTotalTasks: total,
    behaviorScore: score,
    behaviorLabel: behaviorLabel(score),
    mood,
    sleepQuality,
    screenMinutes,
    qualityMinutes,
    statusEmoji: status.emoji,
    statusLabel: status.label,
  };

  // ── Insights (max 2, ranked by urgency) ─────────────────────────
  const delayed = items.filter((i) => i.status === "delayed").length;
  const insights: CommandInsight[] = [];
  const childRef = childName || "your child";

  if (sleepQuality === "poor") {
    insights.push({
      what: "Low sleep may cause evening irritation.",
      why: "Tired kids regulate emotion 30–40% slower.",
      action: "Keep today light and add a calm wind-down activity tonight.",
      tone: "warn",
    });
  }
  if (delayed >= 2) {
    insights.push({
      what: `${delayed} tasks slipped behind.`,
      why: "Trying to catch up usually adds more stress, not less.",
      action: "Tap Simplify Today and let Amy clear low-priority tasks.",
      tone: "warn",
    });
  }
  if (score < 50 && negativeBehaviorsToday > 0 && insights.length < 2) {
    insights.push({
      what: `${childRef}'s behavior has been challenging today.`,
      why: "Often a sign of unmet need — hunger, sleep, or feeling unseen.",
      action: "Try 10 minutes of focused 1:1 play before the next transition.",
      tone: "warn",
    });
  }
  if (mood === "low" && insights.length < 2) {
    insights.push({
      what: `${childRef} seems low on energy today.`,
      why: "Energy dips are normal — pushing through usually backfires.",
      action: "Swap one heavy task for a calm activity like reading together.",
      tone: "info",
    });
  }
  if (screenMinutes >= 90 && insights.length < 2) {
    insights.push({
      what: `Screen time is at ${screenMinutes} minutes today.`,
      why: "Beyond ~60 min, it usually crowds out movement and sleep quality.",
      action: "Add a 15-minute outdoor or movement break before evening.",
      tone: "warn",
    });
  }
  if (insights.length === 0) {
    if (routinePct >= 80) {
      insights.push({
        what: "Today is going well.",
        why: `${routinePct}% of the routine is done and behavior is steady.`,
        action: "Celebrate one win out loud — kids remember the recognition.",
        tone: "good",
      });
    } else if (qualityMinutes < 15) {
      insights.push({
        what: "Quality time is light today.",
        why: "Even 10 focused minutes builds connection more than an hour of half-attention.",
        action: "Block 15 min of phone-free play before the next routine block.",
        tone: "info",
      });
    } else {
      insights.push({
        what: "Today is steady.",
        why: "No urgent flags — the routine and mood are tracking normally.",
        action: "Stay close, mirror feelings, keep your tone warm and brief.",
        tone: "good",
      });
    }
  }

  // ── Quick actions (always show all 5 — UX consistency) ─────────
  const primary: CommandActionId | null =
    delayed >= 2 ? "simplify-today"
      : sleepQuality === "poor" ? "improve-sleep"
      : score < 50 ? "calm-child"
      : routinePct < 30 && total > 0 ? "fix-routine"
      : null;

  const actions: CommandAction[] = [
    { id: "simplify-today", label: "Simplify Today", emoji: "✨", severity: primary === "simplify-today" ? "primary" : "default" },
    { id: "fix-routine",    label: "Fix Routine",    emoji: "🛠️", severity: primary === "fix-routine"    ? "primary" : "default" },
    { id: "calm-child",     label: "Calm Child",     emoji: "🫂", severity: primary === "calm-child"     ? "primary" : "default" },
    { id: "add-activity",   label: "Add Activity",   emoji: "➕", severity: "default" },
    { id: "improve-sleep",  label: "Improve Sleep",  emoji: "😴", severity: primary === "improve-sleep"  ? "primary" : "default" },
  ];

  // ── Week snapshot ───────────────────────────────────────────────
  const consistency = clamp(Math.round((weeklyRoutinesGenerated / 7) * 100), 0, 100);
  let trend: "up" | "flat" | "down" = "flat";
  let trendLabel = "Holding steady";
  let focusImprovementPct = 0;
  if (typeof previousWeeklyPositive === "number") {
    const delta = weeklyPositive - previousWeeklyPositive;
    if (previousWeeklyPositive > 0) {
      focusImprovementPct = Math.round((delta / previousWeeklyPositive) * 100);
      if (delta > 0) { trend = "up"; trendLabel = `Behavior up ${Math.abs(focusImprovementPct)}% this week`; }
      else if (delta < 0) { trend = "down"; trendLabel = `Behavior down ${Math.abs(focusImprovementPct)}% this week`; }
    } else if (weeklyPositive > 0) {
      // Avoid misleading "100%" jumps when previous week had no data — use raw count.
      trend = "up";
      trendLabel = `${weeklyPositive} positive moment${weeklyPositive === 1 ? "" : "s"} this week`;
    }
  } else if (weeklyPositive + weeklyNegative > 0) {
    const ratio = weeklyPositive / (weeklyPositive + weeklyNegative);
    if (ratio >= 0.7) { trend = "up"; trendLabel = `${weeklyPositive} positive moments this week`; }
    else if (ratio <= 0.3) { trend = "down"; trendLabel = "More tough moments than wins this week"; }
    else { trendLabel = `${weeklyPositive} wins · ${weeklyNegative} tough this week`; }
  }

  const week: CommandWeek = {
    routineConsistencyPct: consistency,
    behaviorTrend: trend,
    behaviorTrendLabel: trendLabel,
    focusImprovementPct,
  };

  // ── Parent status ───────────────────────────────────────────────
  const parentStatus: CommandParentStatus = {
    qualityMinutesToday: qualityMinutes,
    stressLabel: stressFor(score, qualityMinutes, sleepQuality),
    effortSummary: effortSummary(qualityMinutes, completed),
  };

  return { overview, insights, actions, week, parentStatus };
}

// Re-export so consumers can `import { ... } from "@workspace/family-routine"`.
export type { AdaptiveMood, AdaptiveSleepQuality } from "./adaptive";

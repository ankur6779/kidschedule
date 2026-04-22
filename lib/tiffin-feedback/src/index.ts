// ─── Tiffin Feedback — learning loop ──────────────────────────────────────────
// Lightweight, rule-based "did my child eat the tiffin?" tracker that feeds
// the Smart Meal Suggestions ranker. Storage-agnostic — callers persist the
// returned history themselves (localStorage on web, AsyncStorage on mobile).

export type TiffinStatus = "eaten" | "half" | "not_eaten";

export interface TiffinFeedbackEntry {
  /** Stable ID derived from `${date}__${mealId}` so re-rating the same day
   *  for the same meal overwrites instead of duplicates. */
  id: string;
  mealId: string;
  mealTitle: string;
  /** Optional emoji/tag carried from the meal so the "Top Liked" UI is
   *  pretty without needing the full meal record. */
  emoji?: string;
  tag?: string;
  status: TiffinStatus;
  /** ISO date YYYY-MM-DD for grouping by school day. */
  date: string;
  /** Unix ms — used to keep the most recent entry when deduping. */
  createdAt: number;
}

export type TiffinHistory = TiffinFeedbackEntry[];

/** Maximum entries we keep — ~6 weeks worth is plenty for trend signals. */
export const MAX_HISTORY = 60;

export const STATUS_LABEL: Record<TiffinStatus, string> = {
  eaten: "Fully eaten",
  half: "Half eaten",
  not_eaten: "Not eaten",
};

export const STATUS_EMOJI: Record<TiffinStatus, string> = {
  eaten: "✅",
  half: "😐",
  not_eaten: "❌",
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function todayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function makeEntryId(date: string, mealId: string): string {
  return `${date}__${mealId}`;
}

// ─── Mutation helpers ─────────────────────────────────────────────────────────

/**
 * Append (or replace) a feedback entry. Same-day same-meal entries are
 * deduped — the latest rating wins. History is capped at MAX_HISTORY.
 */
export function recordFeedback(
  history: TiffinHistory,
  input: {
    mealId: string;
    mealTitle: string;
    status: TiffinStatus;
    emoji?: string;
    tag?: string;
    date?: string;
    now?: number;
  },
): TiffinHistory {
  const date = input.date ?? todayKey();
  const id = makeEntryId(date, input.mealId);
  const now = input.now ?? Date.now();
  const next: TiffinFeedbackEntry = {
    id,
    mealId: input.mealId,
    mealTitle: input.mealTitle,
    emoji: input.emoji,
    tag: input.tag,
    status: input.status,
    date,
    createdAt: now,
  };
  const filtered = history.filter((e) => e.id !== id);
  filtered.push(next);
  // Newest first, capped.
  filtered.sort((a, b) => b.createdAt - a.createdAt);
  return filtered.slice(0, MAX_HISTORY);
}

export function removeFeedback(history: TiffinHistory, entryId: string): TiffinHistory {
  return history.filter((e) => e.id !== entryId);
}

// ─── Read / summarise ─────────────────────────────────────────────────────────

export interface MealStat {
  mealId: string;
  mealTitle: string;
  emoji?: string;
  tag?: string;
  eaten: number;
  half: number;
  notEaten: number;
  total: number;
  /** eaten + 0.5*half - notEaten — bigger is better. */
  score: number;
}

function statsByMeal(history: TiffinHistory): Map<string, MealStat> {
  const m = new Map<string, MealStat>();
  for (const e of history) {
    const cur = m.get(e.mealId) ?? {
      mealId: e.mealId,
      mealTitle: e.mealTitle,
      emoji: e.emoji,
      tag: e.tag,
      eaten: 0, half: 0, notEaten: 0, total: 0, score: 0,
    };
    if (e.status === "eaten") cur.eaten += 1;
    else if (e.status === "half") cur.half += 1;
    else cur.notEaten += 1;
    cur.total = cur.eaten + cur.half + cur.notEaten;
    cur.score = cur.eaten + 0.5 * cur.half - cur.notEaten;
    // Always carry the freshest title/emoji.
    cur.mealTitle = e.mealTitle;
    cur.emoji = e.emoji ?? cur.emoji;
    cur.tag = e.tag ?? cur.tag;
    m.set(e.mealId, cur);
  }
  return m;
}

export interface FeedbackSummary {
  totalRated: number;
  eatenPct: number;        // 0–100, of total rated
  topLiked: MealStat[];    // up to 5, score > 0
  rejected: MealStat[];    // up to 5, score < 0
}

export function summarizeFeedback(history: TiffinHistory): FeedbackSummary {
  const stats = Array.from(statsByMeal(history).values());
  const totalRated = history.length;
  const totalEaten = history.filter((e) => e.status === "eaten").length;
  const eatenPct = totalRated === 0 ? 0 : Math.round((totalEaten / totalRated) * 100);

  const topLiked = stats
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.eaten - a.eaten)
    .slice(0, 5);

  const rejected = stats
    .filter((s) => s.score < 0)
    .sort((a, b) => a.score - b.score || b.notEaten - a.notEaten)
    .slice(0, 5);

  return { totalRated, eatenPct, topLiked, rejected };
}

// ─── Learning signals → meal-suggestion API ──────────────────────────────────

export interface LearningSignals {
  /** Meal IDs to boost in ranking. */
  liked: string[];
  /** Meal IDs to suppress in ranking. */
  disliked: string[];
}

/**
 * Convert a feedback history into the simple liked/disliked lists the
 * meal-suggestion ranker understands. Rules:
 *  - liked   = meals where score > 0 (more eats than refusals)
 *  - disliked = meals where notEaten >= 2 AND eaten == 0
 *               (one refusal could be a bad day; two with no wins is a pattern)
 */
export function getLearningSignals(history: TiffinHistory): LearningSignals {
  const stats = statsByMeal(history);
  const liked: string[] = [];
  const disliked: string[] = [];
  for (const s of stats.values()) {
    if (s.score > 0) liked.push(s.mealId);
    else if (s.eaten === 0 && s.notEaten >= 2) disliked.push(s.mealId);
  }
  return { liked, disliked };
}

/** Has the parent already rated something for the given (or today's) date? */
export function hasFeedbackForDate(
  history: TiffinHistory,
  date: string = todayKey(),
): boolean {
  return history.some((e) => e.date === date);
}

/**
 * Build a friendly Amy-style hint based on the most loved meal so far.
 * Returns null when there isn't enough signal yet.
 */
export function buildAmyTiffinHint(history: TiffinHistory): string | null {
  const { topLiked, totalRated } = summarizeFeedback(history);
  if (totalRated < 2 || topLiked.length === 0) return null;
  const fav = topLiked[0]!;
  const tagBit = fav.tag ? ` Try another ${fav.tag.toLowerCase()} idea below.` : "";
  return `Amy AI Suggests: Your child loved ${fav.emoji ?? "🍱"} ${fav.mealTitle}.${tagBit}`;
}

export type {
  EventCategoryId,
  Difficulty,
  EventCharacter,
  EventCategory,
  EventFilter,
} from "./types";

import type { EventCategoryId, EventCharacter, EventFilter } from "./types";
import { EVENT_CATEGORIES } from "./content/categories";
import { EVENT_CHARACTERS } from "./content/characters";

export { EVENT_CATEGORIES, EVENT_CHARACTERS };

/** Find a single character by id (or undefined). */
export function findCharacter(id: string): EventCharacter | undefined {
  return EVENT_CHARACTERS.find((c) => c.id === id);
}

/** All characters in a given category. */
export function charactersByCategory(category: EventCategoryId): EventCharacter[] {
  return EVENT_CHARACTERS.filter((c) => c.category === category);
}

/** Apply user-selected filters. */
export function applyFilters(
  list: EventCharacter[],
  f: EventFilter,
): EventCharacter[] {
  let out = list;
  if (f.lastMinute) {
    out = out.filter(
      (c) => c.timeMinutes <= 30 && c.difficulty === "Easy" && c.lowCost,
    );
    return out;
  }
  if (f.easyOnly) out = out.filter((c) => c.difficulty === "Easy");
  if (f.lowCostOnly) out = out.filter((c) => c.lowCost);
  if (f.quickOnly) out = out.filter((c) => c.timeMinutes <= 30);
  return out;
}

/**
 * Amy AI generator — rule-based recommender.
 * Given an event + child age, returns the best-matching character ideas.
 * Younger children get the easiest + shortest options, older get more variety.
 */
export function recommendForChild(
  category: EventCategoryId,
  ageYears: number,
): EventCharacter[] {
  const all = charactersByCategory(category);
  if (all.length === 0) return [];

  // Younger kids → Easy + ≤25 min only.
  const filtered =
    ageYears <= 5
      ? all.filter((c) => c.difficulty === "Easy" && c.timeMinutes <= 25)
      : all;

  const list = filtered.length ? filtered : all;
  // Sort by quickest first so the recommendation list starts with low-effort wins.
  return [...list].sort((a, b) => a.timeMinutes - b.timeMinutes).slice(0, 3);
}

/** Pick the right speech variant based on age. */
export function speechForAge(c: EventCharacter, ageYears: number): string {
  if (ageYears <= 5 && c.speechShort) return c.speechShort;
  return c.speech;
}

// ─── Amy AI Event Generator ─────────────────────────────────────────────────

export type AgeBand = "2-5" | "6-10" | "10+";
export type TimeBudget = 15 | 30 | 60;
export type CostBudget = "low" | "medium";

export interface GeneratorInput {
  /** Use undefined to let Amy pick the most relevant event for "today". */
  event?: EventCategoryId;
  ageBand: AgeBand;
  /** Available prep time in minutes. */
  timeMinutes: TimeBudget;
  budget: CostBudget;
}

export interface GeneratorIdea {
  character: EventCharacter;
  /** Speech adapted to the chosen age band. */
  speech: string;
  /** "Easy clothes + 1 prop" or "Clothes + DIY craft". */
  template: "Easy: clothes + props" | "Medium: clothes + DIY craft";
  /** Why Amy picked this — friendly, parental tone. */
  reason: string;
}

export interface GeneratorResult {
  /** Friendly Amy intro line. */
  intro: string;
  /** Top recommendation. */
  best: GeneratorIdea;
  /** 0–2 alternates. */
  alternates: GeneratorIdea[];
  /** True when no exact matches existed and we fell back to general easy ideas. */
  fellBack: boolean;
}

const AGE_BAND_TO_YEARS: Record<AgeBand, number> = { "2-5": 4, "6-10": 8, "10+": 12 };

function templateFor(c: EventCharacter): GeneratorIdea["template"] {
  // Heuristic — characters with very short step lists are "easy + prop",
  // anything bigger involves a craft step.
  return c.steps.length <= 4 && c.lowCost
    ? "Easy: clothes + props"
    : "Medium: clothes + DIY craft";
}

function reasonFor(c: EventCharacter, input: GeneratorInput, fellBack: boolean): string {
  if (fellBack) return `No perfect match found, but this works for almost any school event in ${c.timeMinutes} minutes.`;
  const bits: string[] = [];
  if (c.timeMinutes <= input.timeMinutes) bits.push(`fits in ${c.timeMinutes} min`);
  if (c.difficulty === "Easy") bits.push("easy to put together");
  if (c.lowCost && input.budget === "low") bits.push("uses things at home");
  if (input.ageBand === "2-5" && c.speechShort) bits.push("has a short kid-friendly speech");
  return bits.length
    ? `Picked because it ${bits.join(", ")}.`
    : `Good all-rounder for this event.`;
}

function pickTimelyCategoryByMonth(): EventCategoryId {
  const m = new Date().getMonth();
  if (m === 0) return "republic-day";
  if (m === 7 || m === 8) return "independence-day";
  if (m === 9) return "gandhi-jayanti";
  if (m === 11 || m === 1) return "annual-day";
  return "fancy-dress";
}

/**
 * Amy AI Event Generator — pure rule-based.
 * Filters the static dataset by event/age/time/budget, ranks by best fit,
 * and returns a friendly result. Always returns at least one idea
 * (falls back to general easy fancy-dress ideas when nothing matches).
 */
export function generateEventIdea(input: GeneratorInput): GeneratorResult {
  const event = input.event ?? pickTimelyCategoryByMonth();
  const ageYears = AGE_BAND_TO_YEARS[input.ageBand];
  const lastMinute = input.timeMinutes <= 15;

  // 1) Try the chosen event first.
  let pool = charactersByCategory(event).filter((c) => c.timeMinutes <= input.timeMinutes);

  // 2) Apply budget rule.
  if (input.budget === "low") pool = pool.filter((c) => c.lowCost);

  // 3) Last-minute mode = also force Easy.
  if (lastMinute) pool = pool.filter((c) => c.difficulty === "Easy");

  // 4) Age rule — younger kids stick to Easy + ≤25 min.
  if (input.ageBand === "2-5") {
    pool = pool.filter((c) => c.difficulty === "Easy" && c.timeMinutes <= Math.min(25, input.timeMinutes));
  }

  let fellBack = false;

  // 5) Fallback — relax filters: any easy + low-cost idea from any category.
  if (pool.length === 0) {
    fellBack = true;
    pool = EVENT_CHARACTERS.filter(
      (c) =>
        c.difficulty === "Easy" &&
        c.lowCost &&
        c.timeMinutes <= Math.max(input.timeMinutes, 30),
    ).slice(0, 6);
  }

  // 6) Rank — quickest first, then easy/low-cost, then fewer materials.
  const ranked = [...pool].sort((a, b) => {
    if (a.timeMinutes !== b.timeMinutes) return a.timeMinutes - b.timeMinutes;
    if ((a.lowCost ? 0 : 1) !== (b.lowCost ? 0 : 1)) return (a.lowCost ? 0 : 1) - (b.lowCost ? 0 : 1);
    return a.materials.length - b.materials.length;
  });

  // 7) Final safety net (dataset can't actually be empty, but be defensive).
  const safe = ranked.length > 0 ? ranked : EVENT_CHARACTERS.slice(0, 3);

  const top = safe[0];
  const intro = lastMinute
    ? "Don't worry ❤️ Here's a super-quick idea you can put together right now!"
    : fellBack
    ? "Hmm, no perfect match — but here are a few easy ideas that work for any school event ✨"
    : "Got it! Here's an idea I picked just for you ❤️";

  const toIdea = (c: EventCharacter): GeneratorIdea => ({
    character: c,
    speech: speechForAge(c, ageYears),
    template: templateFor(c),
    reason: reasonFor(c, input, fellBack),
  });

  return {
    intro,
    best: toIdea(top),
    alternates: safe.slice(1, 3).map(toIdea),
    fellBack,
  };
}

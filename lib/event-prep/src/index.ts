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

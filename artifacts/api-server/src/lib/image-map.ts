// Zero-cost predefined image mapping for AI Parenting Coach.
// Keyed by goal slug. Uses picsum.photos with stable seeds (real photographs, free, fast).
// 12 images per goal so each win in a 10–12 win plan gets a distinct visual.

const SIZE = "800/600";
const u = (seed: string): string =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${SIZE}`;

const range = (prefix: string, n = 12): string[] =>
  Array.from({ length: n }, (_, i) => u(`${prefix}-${i + 1}`));

export const GOAL_IDS = [
  "balance-screen-time",
  "manage-tantrums",
  "change-stubborn-behaviour",
  "improve-sleep-patterns",
  "encourage-independent-eating",
  "boost-concentration",
  "navigate-fussy-eating",
] as const;

export type GoalId = (typeof GOAL_IDS)[number];

export const imageMap: Record<string, string[]> = {
  "balance-screen-time":          range("amy-screen"),
  "manage-tantrums":              range("amy-tantrum"),
  "change-stubborn-behaviour":    range("amy-stubborn"),
  "improve-sleep-patterns":       range("amy-sleep"),
  "encourage-independent-eating": range("amy-indep-eat"),
  "boost-concentration":          range("amy-focus"),
  "navigate-fussy-eating":        range("amy-fussy"),
  default:                        range("amy-default"),
};

export function getImagesForGoal(goalId: string): string[] {
  return imageMap[goalId] ?? imageMap.default;
}

export function attachImagesToWins<T extends { image?: string }>(
  wins: T[],
  goalId: string
): T[] {
  const images = getImagesForGoal(goalId);
  return wins.map((w, i) => ({ ...w, image: images[i % images.length] }));
}

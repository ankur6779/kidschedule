// Zero-cost predefined image mapping for AI Parenting Coach.
// Keyed by goal slug. Uses picsum.photos with stable seeds (real photographs, free, fast).

const SIZE = "800/600";
const u = (seed: string): string =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${SIZE}`;

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
  "balance-screen-time": [
    u("amy-screen-1"), u("amy-screen-2"), u("amy-screen-3"),
    u("amy-screen-4"), u("amy-screen-5"), u("amy-screen-6"), u("amy-screen-7"),
  ],
  "manage-tantrums": [
    u("amy-tantrum-1"), u("amy-tantrum-2"), u("amy-tantrum-3"),
    u("amy-tantrum-4"), u("amy-tantrum-5"), u("amy-tantrum-6"), u("amy-tantrum-7"),
  ],
  "change-stubborn-behaviour": [
    u("amy-stubborn-1"), u("amy-stubborn-2"), u("amy-stubborn-3"),
    u("amy-stubborn-4"), u("amy-stubborn-5"), u("amy-stubborn-6"), u("amy-stubborn-7"),
  ],
  "improve-sleep-patterns": [
    u("amy-sleep-1"), u("amy-sleep-2"), u("amy-sleep-3"),
    u("amy-sleep-4"), u("amy-sleep-5"), u("amy-sleep-6"), u("amy-sleep-7"),
  ],
  "encourage-independent-eating": [
    u("amy-indep-eat-1"), u("amy-indep-eat-2"), u("amy-indep-eat-3"),
    u("amy-indep-eat-4"), u("amy-indep-eat-5"), u("amy-indep-eat-6"), u("amy-indep-eat-7"),
  ],
  "boost-concentration": [
    u("amy-focus-1"), u("amy-focus-2"), u("amy-focus-3"),
    u("amy-focus-4"), u("amy-focus-5"), u("amy-focus-6"), u("amy-focus-7"),
  ],
  "navigate-fussy-eating": [
    u("amy-fussy-1"), u("amy-fussy-2"), u("amy-fussy-3"),
    u("amy-fussy-4"), u("amy-fussy-5"), u("amy-fussy-6"), u("amy-fussy-7"),
  ],
  default: [
    u("amy-default-1"), u("amy-default-2"), u("amy-default-3"),
    u("amy-default-4"), u("amy-default-5"), u("amy-default-6"), u("amy-default-7"),
  ],
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

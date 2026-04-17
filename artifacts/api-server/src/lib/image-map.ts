// Zero-cost predefined image mapping for AI Parenting Coach
// Uses picsum.photos with stable seeded URLs (real photographs, free, fast).
// Each category provides multiple images so cards aren't repetitive.
//
// Add/swap images here without touching the route logic.

const SIZE = "800/600";

const u = (seed: string): string =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/${SIZE}`;

export const imageMap: Record<string, string[]> = {
  // sleep / bedtime
  sleep: [u("kid-sleep-1"), u("kid-sleep-2"), u("kid-sleep-3"), u("kid-sleep-4")],
  bedtime: [u("kid-bedtime-1"), u("kid-bedtime-2"), u("kid-bedtime-3"), u("kid-bedtime-4")],
  bedtime_resistance: [u("kid-bedtime-1"), u("kid-bedtime-2"), u("kid-sleep-1"), u("kid-sleep-2")],

  // tantrums / big emotions
  tantrum: [u("amy-tantrum-1"), u("amy-tantrum-2"), u("amy-tantrum-3"), u("amy-tantrum-4")],
  tantrums: [u("amy-tantrum-1"), u("amy-tantrum-2"), u("amy-tantrum-3"), u("amy-tantrum-4")],
  meltdown: [u("amy-tantrum-1"), u("amy-tantrum-2"), u("amy-tantrum-3"), u("amy-tantrum-4")],
  big_emotions: [u("amy-emotions-1"), u("amy-emotions-2"), u("amy-emotions-3"), u("amy-emotions-4")],

  // hitting / biting
  hitting: [u("amy-aggression-1"), u("amy-aggression-2"), u("amy-aggression-3"), u("amy-aggression-4")],
  biting: [u("amy-aggression-1"), u("amy-aggression-2"), u("amy-aggression-3"), u("amy-aggression-4")],

  // food / eating
  eating: [u("amy-food-1"), u("amy-food-2"), u("amy-food-3"), u("amy-food-4")],
  food: [u("amy-food-1"), u("amy-food-2"), u("amy-food-3"), u("amy-food-4")],
  picky_eating: [u("amy-food-1"), u("amy-food-2"), u("amy-food-3"), u("amy-food-4")],

  // screens
  screen_time: [u("amy-screen-1"), u("amy-screen-2"), u("amy-screen-3"), u("amy-screen-4")],
  screens: [u("amy-screen-1"), u("amy-screen-2"), u("amy-screen-3"), u("amy-screen-4")],

  // siblings
  sibling: [u("amy-sibling-1"), u("amy-sibling-2"), u("amy-sibling-3"), u("amy-sibling-4")],
  sibling_fighting: [u("amy-sibling-1"), u("amy-sibling-2"), u("amy-sibling-3"), u("amy-sibling-4")],
  sibling_conflict: [u("amy-sibling-1"), u("amy-sibling-2"), u("amy-sibling-3"), u("amy-sibling-4")],

  // separation / anxiety
  separation: [u("amy-anxiety-1"), u("amy-anxiety-2"), u("amy-anxiety-3"), u("amy-anxiety-4")],
  separation_anxiety: [u("amy-anxiety-1"), u("amy-anxiety-2"), u("amy-anxiety-3"), u("amy-anxiety-4")],
  anxiety: [u("amy-anxiety-1"), u("amy-anxiety-2"), u("amy-anxiety-3"), u("amy-anxiety-4")],

  // listening / defiance
  listening: [u("amy-listen-1"), u("amy-listen-2"), u("amy-listen-3"), u("amy-listen-4")],
  defiance: [u("amy-listen-1"), u("amy-listen-2"), u("amy-listen-3"), u("amy-listen-4")],
  whining: [u("amy-listen-1"), u("amy-listen-2"), u("amy-listen-3"), u("amy-listen-4")],
  nagging: [u("amy-listen-1"), u("amy-listen-2"), u("amy-listen-3"), u("amy-listen-4")],

  // lying
  lying: [u("amy-honesty-1"), u("amy-honesty-2"), u("amy-honesty-3"), u("amy-honesty-4")],

  // generic warm parenting fallback
  default: [u("amy-default-1"), u("amy-default-2"), u("amy-default-3"), u("amy-default-4"), u("amy-default-5")],
};

// Keyword → category map (longer keys checked first via length sort)
const keywordToCategory: { keywords: string[]; category: string }[] = [
  { keywords: ["bedtime", "won't sleep", "wont sleep", "sleep resist"], category: "bedtime" },
  { keywords: ["sleep", "nap"], category: "sleep" },
  { keywords: ["tantrum", "meltdown", "melt down"], category: "tantrum" },
  { keywords: ["big emotion", "emotional", "crying"], category: "big_emotions" },
  { keywords: ["hit", "biting", "bite", "kick", "aggressive"], category: "hitting" },
  { keywords: ["picky", "won't eat", "wont eat", "food", "meal", "eating"], category: "eating" },
  { keywords: ["screen", "tv", "tablet", "phone", "ipad"], category: "screen_time" },
  { keywords: ["sibling", "brother", "sister", "fighting"], category: "sibling" },
  { keywords: ["separation", "anxiety", "school refuse", "clingy"], category: "separation" },
  { keywords: ["whin", "nag"], category: "whining" },
  { keywords: ["listen", "defiance", "defiant", "saying no", "won't listen", "wont listen"], category: "listening" },
  { keywords: ["lying", "lie", "lies"], category: "lying" },
];

export function getImagesForProblem(problem: string): string[] {
  const p = (problem || "").toLowerCase();
  for (const { keywords, category } of keywordToCategory) {
    if (keywords.some((k) => p.includes(k))) {
      return imageMap[category] ?? imageMap.default;
    }
  }
  // Direct key match (in case caller passes a normalized category key)
  const norm = p.trim().replace(/\s+/g, "_");
  if (imageMap[norm]) return imageMap[norm];
  return imageMap.default;
}

// Cyclically attach images to steps
export function attachImagesToSteps<T extends { image?: string }>(
  steps: T[],
  problem: string
): T[] {
  const images = getImagesForProblem(problem);
  return steps.map((s, i) => ({ ...s, image: images[i % images.length] }));
}

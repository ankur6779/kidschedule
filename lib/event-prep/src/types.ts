// Event Prep (School Ready) — shared types
// Local dataset of fancy-dress / character ideas for school events.
// Designed for both web and mobile (no DOM/RN-specific types).

export type EventCategoryId =
  | "independence-day"
  | "republic-day"
  | "gandhi-jayanti"
  | "annual-day"
  | "fancy-dress";

export type Difficulty = "Easy" | "Medium";

export interface EventCharacter {
  id: string;
  /** Friendly category id this character belongs to. */
  category: EventCategoryId;
  /** e.g. "Mahatma Gandhi", "Lion", "Doctor". */
  character: string;
  /** Single descriptive emoji to use as the visual when no image is provided. */
  emoji: string;
  /** A short tagline shown on the card. */
  tagline: string;
  /** Estimated total prep time in minutes (used for filters + last-minute mode). */
  timeMinutes: number;
  /** Difficulty tag shown on the card. */
  difficulty: Difficulty;
  /** Brand color for the card gradient (Tailwind-friendly hex pair). */
  accent: [string, string];
  /** Items the parent needs to gather (kept short and household-friendly). */
  materials: string[];
  /** Step-by-step DIY instructions. */
  steps: string[];
  /** A 2–3 line speech the child can recite. Plain English (Hinglish-friendly). */
  speech: string;
  /** Optional simpler speech variant for younger kids (Nursery / KG). */
  speechShort?: string;
  /** True when materials are very minimal / common at home. */
  lowCost?: boolean;
}

export interface EventCategory {
  id: EventCategoryId;
  title: string;
  emoji: string;
  /** Small caption shown under the title. */
  blurb: string;
  /** Card gradient. */
  accent: [string, string];
}

export interface EventFilter {
  easyOnly?: boolean;
  lowCostOnly?: boolean;
  /** Show only ideas that take 30 min or less. */
  quickOnly?: boolean;
  /** Last-minute mode: 30 min OR less AND Easy AND lowCost. */
  lastMinute?: boolean;
}

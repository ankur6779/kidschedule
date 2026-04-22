import type { EventCategory } from "../types";

export const EVENT_CATEGORIES: EventCategory[] = [
  {
    id: "independence-day",
    title: "Independence Day",
    emoji: "🇮🇳",
    blurb: "15 August — freedom fighters & patriots",
    accent: ["#f97316", "#22c55e"],
  },
  {
    id: "republic-day",
    title: "Republic Day",
    emoji: "🎖️",
    blurb: "26 January — leaders & soldiers",
    accent: ["#1d4ed8", "#0ea5e9"],
  },
  {
    id: "gandhi-jayanti",
    title: "Gandhi Jayanti",
    emoji: "🕊️",
    blurb: "2 October — peace & non-violence",
    accent: ["#ca8a04", "#a3a3a3"],
  },
  {
    id: "annual-day",
    title: "Annual Day",
    emoji: "🎭",
    blurb: "Performances, themes & costumes",
    accent: ["#7c3aed", "#ec4899"],
  },
  {
    id: "fancy-dress",
    title: "Fancy Dress",
    emoji: "🎉",
    blurb: "Animals, professions & favourite characters",
    accent: ["#db2777", "#f59e0b"],
  },
];

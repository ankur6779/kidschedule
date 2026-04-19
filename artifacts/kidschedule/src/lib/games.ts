// Gaming Reward — unlock + daily-limit logic, layered on top of lib/rewards.ts.
import { getTotalPoints } from "./rewards";

export type GameCategory = "brain" | "memory" | "puzzle" | "focus" | "behavior";

export interface GameDef {
  id: string;
  title: string;
  category: GameCategory;
  emoji: string;
  blurb: string;
  unlockCost: number;        // points needed to unlock the FIRST time
  rewardMin: number;         // points awarded for completion
  rewardMax: number;         // bonus on perfect score
  status: "ready" | "soon";  // 'soon' renders as a coming-soon card
  ageHint?: string;
}

export const GAMES: GameDef[] = [
  // Brain
  { id: "pattern-match", title: "Pattern Match", category: "brain", emoji: "🧩", blurb: "Spot the next shape in the pattern.", unlockCost: 50, rewardMin: 5, rewardMax: 15, status: "ready", ageHint: "5+" },
  { id: "odd-one-out", title: "Odd One Out", category: "brain", emoji: "🔍", blurb: "Find the one that does not belong.", unlockCost: 50, rewardMin: 5, rewardMax: 15, status: "ready", ageHint: "5+" },
  // Memory
  { id: "card-flip", title: "Card Flip Match", category: "memory", emoji: "🃏", blurb: "Flip and match the pairs.", unlockCost: 50, rewardMin: 5, rewardMax: 15, status: "ready", ageHint: "4+" },
  { id: "sequence", title: "Sequence Memory", category: "memory", emoji: "🎵", blurb: "Repeat the colour sequence.", unlockCost: 50, rewardMin: 5, rewardMax: 15, status: "ready", ageHint: "5+" },
  // Behavior (USP)
  { id: "what-should-you-do", title: "What Should You Do?", category: "behavior", emoji: "💛", blurb: "Pick the kind, smart choice in real-life situations.", unlockCost: 50, rewardMin: 8, rewardMax: 15, status: "ready", ageHint: "6+" },
  // Coming soon
  { id: "drag-drop-shapes", title: "Drag & Drop Shapes", category: "puzzle", emoji: "🔷", blurb: "Drag shapes into the right slots.", unlockCost: 60, rewardMin: 5, rewardMax: 12, status: "soon" },
  { id: "jigsaw", title: "Jigsaw", category: "puzzle", emoji: "🧠", blurb: "Solve a small jigsaw puzzle.", unlockCost: 60, rewardMin: 5, rewardMax: 12, status: "soon" },
  { id: "spot-difference", title: "Spot the Difference", category: "focus", emoji: "👀", blurb: "Find what changed between two pictures.", unlockCost: 60, rewardMin: 5, rewardMax: 12, status: "soon" },
  { id: "hidden-objects", title: "Hidden Objects", category: "focus", emoji: "🔭", blurb: "Find hidden items in the scene.", unlockCost: 60, rewardMin: 5, rewardMax: 12, status: "soon" },
];

export const CATEGORY_LABEL: Record<GameCategory, string> = {
  brain: "Brain",
  memory: "Memory",
  puzzle: "Puzzle",
  focus: "Focus",
  behavior: "Behavior",
};

const UNLOCKED_KEY = "amynest_unlocked_games_v1";
const PLAY_LOG_KEY = "amynest_game_play_log_v1";
const DAILY_LIMIT = 3;

export function getUnlocked(): string[] {
  try { return JSON.parse(localStorage.getItem(UNLOCKED_KEY) ?? "[]"); } catch { return []; }
}
export function isUnlocked(id: string): boolean {
  return getUnlocked().includes(id);
}

export function unlockGame(id: string): { ok: boolean; reason?: string } {
  const game = GAMES.find((g) => g.id === id);
  if (!game) return { ok: false, reason: "Game not found." };
  if (isUnlocked(id)) return { ok: true };
  const points = getTotalPoints();
  if (points < game.unlockCost) {
    return { ok: false, reason: `You need ${game.unlockCost} points to unlock this game (you have ${points}).` };
  }
  // Spend the points
  const remaining = points - game.unlockCost;
  localStorage.setItem("amynest_points", String(remaining));
  // Log a "redemption-style" entry to keep the dashboard ledger consistent
  const ledger = JSON.parse(localStorage.getItem("amynest_ledger") ?? "[]");
  ledger.unshift({
    date: new Date().toISOString(),
    childName: "Game Unlock",
    activity: `Unlocked: ${game.title}`,
    points: -game.unlockCost,
  });
  localStorage.setItem("amynest_ledger", JSON.stringify(ledger.slice(0, 50)));

  const list = getUnlocked();
  list.push(id);
  localStorage.setItem(UNLOCKED_KEY, JSON.stringify(list));
  return { ok: true };
}

interface PlayEntry { id: string; date: string; pointsEarned: number; perfect: boolean }

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getPlayLog(): PlayEntry[] {
  try { return JSON.parse(localStorage.getItem(PLAY_LOG_KEY) ?? "[]"); } catch { return []; }
}

export function gamesPlayedToday(): number {
  const today = todayStr();
  return getPlayLog().filter((e) => e.date.startsWith(today)).length;
}
export function dailyLimit(): number { return DAILY_LIMIT; }
export function dailyLimitReached(): boolean { return gamesPlayedToday() >= DAILY_LIMIT; }

export function recordPlay(id: string, pointsEarned: number, perfect: boolean): void {
  const log = getPlayLog();
  log.unshift({ id, date: new Date().toISOString(), pointsEarned, perfect });
  localStorage.setItem(PLAY_LOG_KEY, JSON.stringify(log.slice(0, 200)));

  // Add the points to the wallet via lib/rewards (inline so no circular import).
  const current = parseInt(localStorage.getItem("amynest_points") ?? "0", 10);
  localStorage.setItem("amynest_points", String(current + pointsEarned));
  const ledger = JSON.parse(localStorage.getItem("amynest_ledger") ?? "[]");
  const game = GAMES.find((g) => g.id === id);
  ledger.unshift({
    date: new Date().toISOString(),
    childName: "Game Play",
    activity: `${game?.title ?? id}${perfect ? " — Perfect!" : ""}`,
    points: pointsEarned,
  });
  localStorage.setItem("amynest_ledger", JSON.stringify(ledger.slice(0, 50)));
}

// Suggestions surface — Amy AI rotates between unlocked games + memory hint.
export function amySuggestion(): { gameId: string | null; line: string } {
  const unlocked = getUnlocked();
  const playable = GAMES.filter((g) => g.status === "ready" && unlocked.includes(g.id));
  if (playable.length === 0) {
    return { gameId: null, line: "Earn 50 points from your routines to unlock your first game." };
  }
  // Pick the least-played-today, prefer behavior > memory > brain > others.
  const pri: GameCategory[] = ["behavior", "memory", "brain", "focus", "puzzle"];
  playable.sort((a, b) => pri.indexOf(a.category) - pri.indexOf(b.category));
  const pick = playable[0];
  const lines: Record<GameCategory, string> = {
    behavior: `Try '${pick.title}' today — it builds the kind, calm choice-making muscle.`,
    memory: `A memory game like '${pick.title}' improves focus and working memory.`,
    brain: `Warm up the brain with '${pick.title}' — pattern thinking helps maths and reading.`,
    focus: `Try '${pick.title}' to sharpen focus and visual attention.`,
    puzzle: `Build problem-solving with '${pick.title}'.`,
  };
  return { gameId: pick.id, line: `Amy AI Suggests: ${lines[pick.category]}` };
}

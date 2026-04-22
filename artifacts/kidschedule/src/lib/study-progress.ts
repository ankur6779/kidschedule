// Per-child Smart Study Zone progress, stored in localStorage so we don't
// need a new DB table for v1. Shape is intentionally flat and forward-compatible.

const KEY = (childId: number | string) => `amynest:study-progress:${childId}`;

export interface StudyProgress {
  // play mode: completed item ids per category
  play: Record<string, string[]>;
  // basic / advanced: best score per topic (0..N) plus completion flag
  basic: Record<string, Record<string, { score: number; total: number; completed: boolean }>>;
  advanced: Record<string, Record<string, { score: number; total: number; completed: boolean }>>;
}

function empty(): StudyProgress {
  return { play: {}, basic: {}, advanced: {} };
}

export function loadProgress(childId: number | string): StudyProgress {
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(KEY(childId));
    if (!raw) return empty();
    const parsed = JSON.parse(raw);
    return { ...empty(), ...parsed };
  } catch {
    return empty();
  }
}

export function saveProgress(childId: number | string, p: StudyProgress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY(childId), JSON.stringify(p));
  } catch { /* ignore quota errors */ }
}

export function markPlayItem(childId: number | string, categoryId: string, itemId: string): StudyProgress {
  const p = loadProgress(childId);
  const list = new Set(p.play[categoryId] ?? []);
  list.add(itemId);
  p.play[categoryId] = Array.from(list);
  saveProgress(childId, p);
  return p;
}

export function markTopicResult(
  childId: number | string,
  mode: "basic" | "advanced",
  subjectId: string,
  topicId: string,
  score: number,
  total: number,
): StudyProgress {
  const p = loadProgress(childId);
  const subj = p[mode][subjectId] ?? {};
  const prev = subj[topicId];
  const bestScore = prev ? Math.max(prev.score, score) : score;
  subj[topicId] = { score: bestScore, total, completed: bestScore >= Math.ceil(total * 0.6) };
  p[mode][subjectId] = subj;
  saveProgress(childId, p);
  return p;
}

export function categoryPercent(p: StudyProgress, categoryId: string, total: number): number {
  if (total === 0) return 0;
  const done = p.play[categoryId]?.length ?? 0;
  return Math.min(100, Math.round((done / total) * 100));
}

export function subjectPercent(
  p: StudyProgress,
  mode: "basic" | "advanced",
  subjectId: string,
  totalTopics: number,
): number {
  if (totalTopics === 0) return 0;
  const subj = p[mode][subjectId] ?? {};
  const completed = Object.values(subj).filter((t) => t.completed).length;
  return Math.min(100, Math.round((completed / totalTopics) * 100));
}

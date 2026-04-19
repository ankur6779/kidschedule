import { inArray } from "drizzle-orm";
import { db, behaviorsTable, type Behavior } from "@workspace/db";

export type BehaviorSection = {
  score: number; // 0..100
  metrics: {
    listening: number;
    screen: number;
    sleep: number;
    eating: number;
  };
  trend: "up" | "down" | "flat";
  recentPositive: number;
  recentNegative: number;
};

const KEYWORDS = {
  listening: ["listen", "follow instruction", "obey", "ignored", "ignore"],
  screen: ["screen", "tablet", "tv", "phone", "youtube"],
  sleep: ["sleep", "bedtime", "nap", "tired", "wake"],
  eating: ["eat", "food", "meal", "picky", "snack", "drink"],
};

function bucketOf(text: string): keyof typeof KEYWORDS | null {
  const t = text.toLowerCase();
  for (const [bucket, kws] of Object.entries(KEYWORDS) as [keyof typeof KEYWORDS, string[]][]) {
    if (kws.some((kw) => t.includes(kw))) return bucket;
  }
  return null;
}

function scoreFor(positives: number, negatives: number): number {
  const total = positives + negatives;
  if (total === 0) return 50; // neutral baseline when no data
  return Math.round((positives / total) * 100);
}

export async function getBehaviorSection(childIds: number[]): Promise<BehaviorSection> {
  if (childIds.length === 0) {
    return {
      score: 0,
      metrics: { listening: 0, screen: 0, sleep: 0, eating: 0 },
      trend: "flat",
      recentPositive: 0,
      recentNegative: 0,
    };
  }

  const all: Behavior[] = await db
    .select()
    .from(behaviorsTable)
    .where(inArray(behaviorsTable.childId, childIds));

  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recent = all.filter((b) => new Date(b.date) >= sevenDaysAgo);
  const prior = all.filter((b) => {
    const d = new Date(b.date);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  });

  const recentPositive = recent.filter((b) => b.type === "positive").length;
  const recentNegative = recent.filter((b) => b.type === "negative").length;
  const priorPositive = prior.filter((b) => b.type === "positive").length;
  const priorNegative = prior.filter((b) => b.type === "negative").length;

  // Metrics: bucket recent behaviors into listening/screen/sleep/eating
  const buckets: Record<keyof typeof KEYWORDS, { pos: number; neg: number }> = {
    listening: { pos: 0, neg: 0 },
    screen: { pos: 0, neg: 0 },
    sleep: { pos: 0, neg: 0 },
    eating: { pos: 0, neg: 0 },
  };

  for (const b of recent) {
    const bucket = bucketOf(`${b.behavior} ${b.notes ?? ""}`);
    if (!bucket) continue;
    if (b.type === "positive") buckets[bucket].pos += 1;
    else if (b.type === "negative") buckets[bucket].neg += 1;
  }

  const metrics = {
    listening: scoreFor(buckets.listening.pos, buckets.listening.neg),
    screen: scoreFor(buckets.screen.pos, buckets.screen.neg),
    sleep: scoreFor(buckets.sleep.pos, buckets.sleep.neg),
    eating: scoreFor(buckets.eating.pos, buckets.eating.neg),
  };

  const score = Math.round((metrics.listening + metrics.screen + metrics.sleep + metrics.eating) / 4);

  const recentScore = scoreFor(recentPositive, recentNegative);
  const priorScore = scoreFor(priorPositive, priorNegative);
  let trend: "up" | "down" | "flat" = "flat";
  if (recentScore > priorScore + 5) trend = "up";
  else if (recentScore < priorScore - 5) trend = "down";

  return { score, metrics, trend, recentPositive, recentNegative };
}

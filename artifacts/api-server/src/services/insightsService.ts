import { eq, inArray } from "drizzle-orm";
import { db, childrenTable, routinesTable, behaviorsTable } from "@workspace/db";

export type InsightsRange = "week" | "month";

export type RoutineItem = {
  time: string;
  activity: string;
  duration: number;
  category: string;
  notes?: string;
};

export type InsightsResponse = {
  range: InsightsRange;
  generatedAt: string;
  hasChildren: boolean;
  hasActivity: boolean;
  emptyReason: "no_children" | "no_activity" | null;
  summary: {
    routinesThisPeriod: number;
    routinesPreviousPeriod: number;
    routinesChangePct: number;
    behaviorsThisPeriod: number;
    behaviorsPreviousPeriod: number;
    positiveRateThisPeriod: number;
    positiveRatePreviousPeriod: number;
    positiveRateChangePts: number;
  };
  perChild: Array<{
    childId: number;
    childName: string;
    routinesCount: number;
    behaviorsCount: number;
    positiveCount: number;
    positiveRate: number;
  }>;
  activityMix: Array<{ category: string; count: number }>;
  dayOfWeek: Array<{ day: string; count: number }>;
  timeOfDay: { morning: number; afternoon: number; evening: number };
  behaviorTypes: { positive: number; negative: number; neutral: number; milestone: number };
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isoDay(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().split("T")[0]!;
}

function daysAgoIso(days: number): string {
  return isoDay(new Date(Date.now() - days * DAY_MS));
}

function emptyDayOfWeek(): { day: string; count: number }[] {
  return DAY_LABELS.map((day) => ({ day, count: 0 }));
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

function timeBucketFor(time: string): "morning" | "afternoon" | "evening" {
  const match = time.match(/(\d{1,2})[:.](\d{2})\s*(AM|PM)?/i);
  if (!match) return "afternoon";
  let hour = parseInt(match[1]!, 10);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export async function buildInsights(args: {
  userId: string;
  range: InsightsRange;
}): Promise<InsightsResponse> {
  const { userId, range } = args;
  const periodDays = range === "month" ? 30 : 7;
  const currentEnd = daysAgoIso(-1);
  const currentStart = daysAgoIso(periodDays - 1);
  const previousEnd = currentStart;
  const previousStart = daysAgoIso(periodDays * 2 - 1);

  const children = await db
    .select()
    .from(childrenTable)
    .where(eq(childrenTable.userId, userId));
  const childIds = children.map((c) => c.id);
  const hasChildren = childIds.length > 0;

  if (!hasChildren) {
    return {
      range,
      generatedAt: new Date().toISOString(),
      hasChildren: false,
      hasActivity: false,
      emptyReason: "no_children",
      summary: {
        routinesThisPeriod: 0,
        routinesPreviousPeriod: 0,
        routinesChangePct: 0,
        behaviorsThisPeriod: 0,
        behaviorsPreviousPeriod: 0,
        positiveRateThisPeriod: 0,
        positiveRatePreviousPeriod: 0,
        positiveRateChangePts: 0,
      },
      perChild: [],
      activityMix: [],
      dayOfWeek: emptyDayOfWeek(),
      timeOfDay: { morning: 0, afternoon: 0, evening: 0 },
      behaviorTypes: { positive: 0, negative: 0, neutral: 0, milestone: 0 },
    };
  }

  const [allRoutines, allBehaviors] = await Promise.all([
    db.select().from(routinesTable).where(inArray(routinesTable.childId, childIds)),
    db.select().from(behaviorsTable).where(inArray(behaviorsTable.childId, childIds)),
  ]);

  const routinesThisPeriod = allRoutines.filter((r) => {
    const d = isoDay(r.createdAt);
    return d >= currentStart && d < currentEnd;
  });
  const routinesPreviousPeriod = allRoutines.filter((r) => {
    const d = isoDay(r.createdAt);
    return d >= previousStart && d < previousEnd;
  });

  const behaviorsThisPeriod = allBehaviors.filter(
    (b) => b.date >= currentStart && b.date < currentEnd,
  );
  const behaviorsPreviousPeriod = allBehaviors.filter(
    (b) => b.date >= previousStart && b.date < previousEnd,
  );

  const positiveCountThis = behaviorsThisPeriod.filter((b) => b.type === "positive").length;
  const positiveCountPrev = behaviorsPreviousPeriod.filter((b) => b.type === "positive").length;
  const positiveRateThis = behaviorsThisPeriod.length
    ? Math.round((positiveCountThis / behaviorsThisPeriod.length) * 100)
    : 0;
  const positiveRatePrev = behaviorsPreviousPeriod.length
    ? Math.round((positiveCountPrev / behaviorsPreviousPeriod.length) * 100)
    : 0;

  const perChild = children.map((child) => {
    const childRoutines = routinesThisPeriod.filter((r) => r.childId === child.id);
    const childBehaviors = behaviorsThisPeriod.filter((b) => b.childId === child.id);
    const childPositive = childBehaviors.filter((b) => b.type === "positive").length;
    return {
      childId: child.id,
      childName: child.name,
      routinesCount: childRoutines.length,
      behaviorsCount: childBehaviors.length,
      positiveCount: childPositive,
      positiveRate: childBehaviors.length
        ? Math.round((childPositive / childBehaviors.length) * 100)
        : 0,
    };
  });

  const categoryCounts = new Map<string, number>();
  const timeOfDay = { morning: 0, afternoon: 0, evening: 0 };
  for (const routine of routinesThisPeriod) {
    const items = (routine.items as RoutineItem[] | null) ?? [];
    for (const item of items) {
      const cat = item.category || "Other";
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
      const bucket = timeBucketFor(item.time ?? "");
      timeOfDay[bucket] += 1;
    }
  }
  const activityMix = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const dayCounts = new Array(7).fill(0) as number[];
  for (const r of routinesThisPeriod) {
    dayCounts[new Date(r.createdAt).getDay()] += 1;
  }
  for (const b of behaviorsThisPeriod) {
    dayCounts[new Date(b.date + "T00:00:00").getDay()] += 1;
  }
  const dayOfWeek = DAY_LABELS.map((day, i) => ({ day, count: dayCounts[i] ?? 0 }));

  const behaviorTypes = {
    positive: behaviorsThisPeriod.filter((b) => b.type === "positive").length,
    negative: behaviorsThisPeriod.filter((b) => b.type === "negative").length,
    neutral: behaviorsThisPeriod.filter((b) => b.type === "neutral").length,
    milestone: behaviorsThisPeriod.filter((b) => b.type === "milestone").length,
  };

  const hasActivity = routinesThisPeriod.length > 0 || behaviorsThisPeriod.length > 0;

  return {
    range,
    generatedAt: new Date().toISOString(),
    hasChildren: true,
    hasActivity,
    emptyReason: hasActivity ? null : "no_activity",
    summary: {
      routinesThisPeriod: routinesThisPeriod.length,
      routinesPreviousPeriod: routinesPreviousPeriod.length,
      routinesChangePct: pctChange(routinesThisPeriod.length, routinesPreviousPeriod.length),
      behaviorsThisPeriod: behaviorsThisPeriod.length,
      behaviorsPreviousPeriod: behaviorsPreviousPeriod.length,
      positiveRateThisPeriod: positiveRateThis,
      positiveRatePreviousPeriod: positiveRatePrev,
      positiveRateChangePts: positiveRateThis - positiveRatePrev,
    },
    perChild,
    activityMix,
    dayOfWeek,
    timeOfDay,
    behaviorTypes,
  };
}

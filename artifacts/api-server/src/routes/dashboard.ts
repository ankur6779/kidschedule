import { Router, type IRouter } from "express";
import { eq, desc, inArray } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, childrenTable, routinesTable, behaviorsTable } from "@workspace/db";
import { GetDashboardSummaryResponse, GetRecentRoutinesResponse, GetBehaviorStatsResponse } from "@workspace/api-zod";

type RoutineItem = {
  time: string;
  activity: string;
  duration: number;
  category: string;
  notes?: string;
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
  // time format e.g. "07:30" or "7:30 AM" — parse defensively
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

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const children = await db.select().from(childrenTable).where(eq(childrenTable.userId, userId));
  const childIds = children.map((c) => c.id);

  const routines = childIds.length > 0
    ? await db.select().from(routinesTable).where(inArray(routinesTable.childId, childIds))
    : [];

  const todayBehaviors = childIds.length > 0
    ? await db.select().from(behaviorsTable).where(
        eq(behaviorsTable.date, today!)
      ).then((rows) => rows.filter((b) => childIds.includes(b.childId)))
    : [];

  const weekRoutines = routines.filter((r) => r.createdAt.toISOString().split("T")[0]! >= weekAgo!);

  const positiveBehaviorsToday = todayBehaviors.filter((b) => b.type === "positive").length;
  const negativeBehaviorsToday = todayBehaviors.filter((b) => b.type === "negative").length;

  res.json(
    GetDashboardSummaryResponse.parse({
      totalChildren: children.length,
      totalRoutines: routines.length,
      positiveBehaviorsToday,
      negativeBehaviorsToday,
      routinesGeneratedThisWeek: weekRoutines.length,
    }),
  );
});

router.get("/dashboard/recent-routines", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const children = await db.select().from(childrenTable).where(eq(childrenTable.userId, userId));
  const childMap = new Map(children.map((c) => [c.id, c.name]));
  const childIds = children.map((c) => c.id);

  const routines = childIds.length > 0
    ? await db
        .select()
        .from(routinesTable)
        .where(inArray(routinesTable.childId, childIds))
        .orderBy(desc(routinesTable.createdAt))
        .limit(5)
    : [];

  res.json(
    GetRecentRoutinesResponse.parse(
      routines.map((r) => ({
        ...r,
        childName: childMap.get(r.childId) ?? "Unknown",
        items: r.items as RoutineItem[],
        createdAt: r.createdAt.toISOString(),
      })),
    ),
  );
});

router.get("/dashboard/behavior-stats", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const children = await db.select().from(childrenTable).where(eq(childrenTable.userId, userId));
  const childIds = children.map((c) => c.id);

  const behaviors = childIds.length > 0
    ? await db.select().from(behaviorsTable).where(inArray(behaviorsTable.childId, childIds))
    : [];

  const stats = children.map((child) => {
    const childBehaviors = behaviors.filter((b) => b.childId === child.id);
    return {
      childId: child.id,
      childName: child.name,
      positive: childBehaviors.filter((b) => b.type === "positive").length,
      negative: childBehaviors.filter((b) => b.type === "negative").length,
      neutral: childBehaviors.filter((b) => b.type === "neutral").length,
    };
  });

  res.json(GetBehaviorStatsResponse.parse(stats));
});

// ─── Parent insights (D1) ────────────────────────────────────────────────────
// Aggregates week-over-week deltas, per-child summaries, behavior trend, activity
// mix, and day-of-week / time-of-day patterns. ?range=week|month (default week).
router.get("/dashboard/insights", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const range = req.query.range === "month" ? "month" : "week";
  const periodDays = range === "month" ? 30 : 7;
  // Equal-length [start, end) windows so current and previous totals are
  // comparable. currentEnd is the day AFTER today (exclusive upper bound),
  // currentStart is `periodDays` days before that. previous window is the
  // adjacent prior `periodDays` days.
  const currentEnd = daysAgoIso(-1); // tomorrow
  const currentStart = daysAgoIso(periodDays - 1); // includes today + (periodDays-1) prior
  const previousEnd = currentStart;
  const previousStart = daysAgoIso(periodDays * 2 - 1);

  const children = await db.select().from(childrenTable).where(eq(childrenTable.userId, userId));
  const childIds = children.map((c) => c.id);
  const hasChildren = childIds.length > 0;

  if (!hasChildren) {
    res.json({
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
    });
    return;
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

  // Per-child breakdown for the current period.
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

  // Activity category mix + time-of-day distribution from this-period routines.
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

  // Day-of-week activity (this period) — counts behaviors+routines per weekday.
  const dayCounts = new Array(7).fill(0) as number[];
  for (const r of routinesThisPeriod) {
    dayCounts[new Date(r.createdAt).getDay()] += 1;
  }
  for (const b of behaviorsThisPeriod) {
    dayCounts[new Date(b.date + "T00:00:00").getDay()] += 1;
  }
  // Always 7 entries, even when all zero — keeps the API contract stable.
  const dayOfWeek = DAY_LABELS.map((day, i) => ({ day, count: dayCounts[i] ?? 0 }));

  // Behavior type breakdown for this period.
  const behaviorTypes = {
    positive: behaviorsThisPeriod.filter((b) => b.type === "positive").length,
    negative: behaviorsThisPeriod.filter((b) => b.type === "negative").length,
    neutral: behaviorsThisPeriod.filter((b) => b.type === "neutral").length,
    milestone: behaviorsThisPeriod.filter((b) => b.type === "milestone").length,
  };

  const hasActivity = routinesThisPeriod.length > 0 || behaviorsThisPeriod.length > 0;

  res.json({
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
  });
});

export default router;

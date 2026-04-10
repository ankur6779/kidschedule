import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, childrenTable, routinesTable, behaviorsTable } from "@workspace/db";
import { GetDashboardSummaryResponse, GetRecentRoutinesResponse, GetBehaviorStatsResponse } from "@workspace/api-zod";

type RoutineItem = {
  time: string;
  activity: string;
  duration: number;
  category: string;
  notes?: string;
};

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const children = await db.select().from(childrenTable);
  const routines = await db.select().from(routinesTable);
  const todayBehaviors = await db.select().from(behaviorsTable).where(eq(behaviorsTable.date, today!));
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

router.get("/dashboard/recent-routines", async (_req, res): Promise<void> => {
  const children = await db.select().from(childrenTable);
  const childMap = new Map(children.map((c) => [c.id, c.name]));

  const routines = await db.select().from(routinesTable).orderBy(desc(routinesTable.createdAt)).limit(5);
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

router.get("/dashboard/behavior-stats", async (_req, res): Promise<void> => {
  const children = await db.select().from(childrenTable);
  const behaviors = await db.select().from(behaviorsTable);

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

export default router;

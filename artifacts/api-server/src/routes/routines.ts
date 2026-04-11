import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, routinesTable, childrenTable, parentProfilesTable } from "@workspace/db";
import {
  CreateRoutineBody,
  CheckRoutineQueryParams,
  CheckRoutineResponse,
  GetRoutineParams,
  DeleteRoutineParams,
  UpdateRoutineItemsParams,
  UpdateRoutineItemsBody,
  ListRoutinesQueryParams,
  ListRoutinesResponse,
  GetRoutineResponse,
  GenerateRoutineBody,
  GenerateRoutineResponse,
  GenerateInsightsResponse,
} from "@workspace/api-zod";
import { generateRuleBasedRoutine, generateRuleBasedInsights, generatePartialRoutine, timeToMins, minsToTime, type AgeGroup } from "../lib/routine-templates.js";

type RoutineItem = {
  time: string;
  activity: string;
  duration: number;
  category: string;
  notes?: string;
  status?: "pending" | "completed" | "skipped" | "delayed";
};

const router: IRouter = Router();

router.post("/routines/generate", async (req, res): Promise<void> => {
  const parsed = GenerateRoutineBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId } = getAuth(req);

  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, parsed.data.childId));
  if (!child) {
    res.status(404).json({ error: "Child not found" });
    return;
  }

  // Compute age group
  const totalAgeMonths = (child.age * 12) + ((child as any).ageMonths ?? 0);
  const ageGroup: AgeGroup =
    totalAgeMonths < 12 ? "infant"
    : totalAgeMonths < 36 ? "toddler"
    : totalAgeMonths < 60 ? "preschool"
    : totalAgeMonths < 120 ? "early_school"
    : "pre_teen";

  // Parent availability logic
  const {
    hasSchool, isWorkingDay, specialPlans, mood,
    parent1Role, parent1WorkType, parent1IsWorking,
    parent2Role, parent2WorkType, parent2IsWorking,
  } = parsed.data;

  const p1Free = parent1WorkType === "homemaker" || parent1IsWorking === false || isWorkingDay === false;
  const p2Free = parent2Role
    ? (parent2WorkType === "homemaker" || parent2IsWorking === false)
    : false;
  const bothBusy = (parent1IsWorking === true || isWorkingDay === true) &&
    (!parent2Role || parent2IsWorking === true);

  // Food type — prefer child setting, fallback to parent profile
  let foodType = (child as any).foodType ?? "veg";
  if (userId && foodType === "veg") {
    const [pp] = await db.select().from(parentProfilesTable).where(eq(parentProfilesTable.userId, userId));
    if (pp?.foodType) foodType = pp.foodType;
  }

  const generated = generateRuleBasedRoutine({
    childName: child.name,
    ageGroup,
    totalAgeMonths,
    wakeUpTime: child.wakeUpTime,
    sleepTime: child.sleepTime,
    schoolStartTime: child.schoolStartTime,
    schoolEndTime: child.schoolEndTime,
    travelMode: child.travelMode === "other" && (child as any).travelModeOther
      ? (child as any).travelModeOther
      : child.travelMode,
    hasSchool: hasSchool !== false,
    mood: mood ?? "normal",
    foodType,
    goals: child.goals,
    specialPlans,
    p1Free,
    p2Free,
    bothBusy,
    childClass: (child as any).childClass ?? undefined,
    date: parsed.data.date,
  });

  res.json(GenerateRoutineResponse.parse(generated));
});

router.get("/routines", async (req, res): Promise<void> => {
  const queryParams = ListRoutinesQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const children = await db.select().from(childrenTable);
  const childMap = new Map(children.map((c) => [c.id, c.name]));

  let results;
  if (queryParams.data.childId) {
    results = await db.select().from(routinesTable).where(eq(routinesTable.childId, queryParams.data.childId)).orderBy(desc(routinesTable.createdAt));
  } else {
    results = await db.select().from(routinesTable).orderBy(desc(routinesTable.createdAt));
  }

  res.json(
    ListRoutinesResponse.parse(
      results.map((r) => ({
        ...r,
        childName: childMap.get(r.childId) ?? "Unknown",
        items: r.items as RoutineItem[],
        createdAt: r.createdAt.toISOString(),
      })),
    ),
  );
});

// Check if a routine exists for a given child + date
router.get("/routines/check", async (req, res): Promise<void> => {
  const parsed = CheckRoutineQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const existing = await db
    .select({ id: routinesTable.id })
    .from(routinesTable)
    .where(and(eq(routinesTable.childId, parsed.data.childId), eq(routinesTable.date, parsed.data.date)))
    .limit(1);

  if (existing.length > 0) {
    res.json(CheckRoutineResponse.parse({ exists: true, routineId: existing[0].id }));
  } else {
    res.json(CheckRoutineResponse.parse({ exists: false }));
  }
});

router.post("/routines", async (req, res): Promise<void> => {
  const parsed = CreateRoutineBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, parsed.data.childId));

  // If override flag is set, delete any existing routine for this child+date first
  if (parsed.data.override) {
    await db.delete(routinesTable).where(
      and(eq(routinesTable.childId, parsed.data.childId), eq(routinesTable.date, parsed.data.date))
    );
  }

  const [routine] = await db.insert(routinesTable).values({
    childId: parsed.data.childId,
    date: parsed.data.date,
    title: parsed.data.title,
    items: parsed.data.items,
  }).returning();

  res.status(201).json(
    GetRoutineResponse.parse({
      ...routine,
      childName: child?.name ?? "Unknown",
      items: routine.items as RoutineItem[],
      createdAt: routine.createdAt.toISOString(),
    }),
  );
});

router.get("/routines/:id", async (req, res): Promise<void> => {
  const params = GetRoutineParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [routine] = await db.select().from(routinesTable).where(eq(routinesTable.id, params.data.id));
  if (!routine) {
    res.status(404).json({ error: "Routine not found" });
    return;
  }
  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, routine.childId));
  res.json(
    GetRoutineResponse.parse({
      ...routine,
      childName: child?.name ?? "Unknown",
      items: routine.items as RoutineItem[],
      createdAt: routine.createdAt.toISOString(),
    }),
  );
});

// Update routine items (for marking tasks complete/skipped/delayed)
router.patch("/routines/:id/items", async (req, res): Promise<void> => {
  const params = UpdateRoutineItemsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateRoutineItemsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [routine] = await db
    .update(routinesTable)
    .set({ items: parsed.data.items })
    .where(eq(routinesTable.id, params.data.id))
    .returning();

  if (!routine) {
    res.status(404).json({ error: "Routine not found" });
    return;
  }
  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, routine.childId));
  res.json(
    GetRoutineResponse.parse({
      ...routine,
      childName: child?.name ?? "Unknown",
      items: routine.items as RoutineItem[],
      createdAt: routine.createdAt.toISOString(),
    }),
  );
});

router.delete("/routines/:id", async (req, res): Promise<void> => {
  const params = DeleteRoutineParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [routine] = await db.delete(routinesTable).where(eq(routinesTable.id, params.data.id)).returning();
  if (!routine) {
    res.status(404).json({ error: "Routine not found" });
    return;
  }
  res.sendStatus(204);
});

// Rule-based weekly insights (zero API cost)
router.post("/insights", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const children = await db.select().from(childrenTable);
  const allRoutines = await db
    .select()
    .from(routinesTable)
    .orderBy(desc(routinesTable.createdAt))
    .limit(60);

  const childMap = new Map(children.map((c) => [c.id, c.name]));

  const routineStats = allRoutines.map((r) => {
    const items = r.items as RoutineItem[];
    const total = items.length;
    const completed = items.filter((i) => i.status === "completed").length;
    const skipped = items.filter((i) => i.status === "skipped").length;
    const delayed = items.filter((i) => i.status === "delayed").length;
    const pending = items.filter((i) => !i.status || i.status === "pending").length;
    const categories = [...new Set(items.map((i) => i.category))];
    return {
      childName: childMap.get(r.childId) ?? "Unknown",
      date: r.date,
      total,
      completed,
      skipped,
      delayed,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      categories,
    };
  });

  const result = generateRuleBasedInsights(routineStats);
  res.json(GenerateInsightsResponse.parse(result));
});

// Rule-based partial regeneration — keep completed tasks, fill the rest from template pool
router.post("/routines/:id/partial-regenerate", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const routineId = parseInt(req.params.id);
  if (isNaN(routineId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [routine] = await db.select().from(routinesTable).where(eq(routinesTable.id, routineId));
  if (!routine) { res.status(404).json({ error: "Not found" }); return; }

  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, routine.childId));
  if (!child) { res.status(404).json({ error: "Child not found" }); return; }

  const items = (routine.items ?? []) as Array<RoutineItem & { imageUrl?: string }>;
  const { newActivity } = req.body as { newActivity?: { name: string; time?: string; duration?: number } };

  // Current time in minutes
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Find pivot: first non-completed item at or after current time
  let pivotIndex = items.length;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.status === "completed" || item.status === "skipped") continue;
    const itemMins = timeToMins(item.time);
    if (itemMins >= currentMinutes) { pivotIndex = i; break; }
  }

  const keptItems = items.slice(0, pivotIndex);
  const lastKept = keptItems[keptItems.length - 1];
  const startMins = lastKept
    ? Math.max(timeToMins(lastKept.time) + (lastKept.duration ?? 30), currentMinutes)
    : currentMinutes;
  const sleepMins = timeToMins((child as any).sleepTime ?? "9:00 PM");

  // Compute age group
  const totalAgeMonths = (child.age * 12) + ((child as any).ageMonths ?? 0);
  const ageGroup: AgeGroup =
    totalAgeMonths < 12 ? "infant"
    : totalAgeMonths < 36 ? "toddler"
    : totalAgeMonths < 60 ? "preschool"
    : totalAgeMonths < 120 ? "early_school"
    : "pre_teen";

  const newItems = generatePartialRoutine({
    childName: child.name,
    ageGroup,
    childAge: child.age,
    foodType: (child as any).foodType ?? "veg",
    goals: child.goals,
    keptItems,
    startMins,
    sleepMins,
    newActivity,
    date: routine.date,
  });

  const updatedItems = [...keptItems, ...newItems];
  await db.update(routinesTable).set({ items: updatedItems as any }).where(eq(routinesTable.id, routineId));

  res.json({ items: updatedItems });
});

export default router;

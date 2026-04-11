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

// ─── AI Routine Generation helper ──────────────────────────────────────────
async function generateAiRoutine(params: {
  childName: string;
  age: number;
  ageGroup: AgeGroup;
  wakeUpTime: string;
  sleepTime: string;
  schoolStartTime: string;
  schoolEndTime: string;
  hasSchool: boolean;
  foodType: string;
  mood: string;
  specialPlans?: string;
  fridgeItems?: string;
  goals?: string | null;
  travelMode?: string;
  childClass?: string;
  date: string;
  parentAvailSummary: string;
}): Promise<{ title: string; items: RoutineItem[] }> {
  const { openai } = await import("@workspace/integrations-openai-ai-server");

  const dayOfWeek = new Date(params.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" });
  const ageGroupLabel =
    params.ageGroup === "infant" ? "Infant (0–11 months)"
    : params.ageGroup === "toddler" ? "Toddler (1–3 years)"
    : params.ageGroup === "preschool" ? "Preschool (3–5 years)"
    : params.ageGroup === "early_school" ? "School Age (5–10 years)"
    : "Pre-Teen (10–15 years)";

  const systemPrompt = `You are an expert child development specialist and daily routine planner.
Generate a complete, realistic daily schedule for a child as a JSON object.
The schedule must be age-appropriate, structured, and include family bonding time.
Return ONLY valid JSON, no markdown, no explanation.`;

  const userPrompt = `Create a full daily routine for this child:
- Name: ${params.childName}
- Age group: ${ageGroupLabel} (${params.age} years)
- Date: ${params.date} (${dayOfWeek})
- School today: ${params.hasSchool ? "Yes" : "No"}
${params.hasSchool ? `- School: ${params.schoolStartTime} to ${params.schoolEndTime}` : ""}
- Wake up: ${params.wakeUpTime}
- Bedtime: ${params.sleepTime}
- Diet: ${params.foodType === "non_veg" ? "Non-Vegetarian" : "Vegetarian"}
- Mood today: ${params.mood}
${params.goals ? `- Goals/focus: ${params.goals}` : ""}
${params.specialPlans ? `- Special plans: ${params.specialPlans}` : ""}
${params.fridgeItems ? `- Available fridge items: ${params.fridgeItems}` : ""}
- Parent availability: ${params.parentAvailSummary}

Return JSON exactly like this:
{
  "title": "string — include child name and day",
  "items": [
    {
      "time": "H:MM AM/PM",
      "activity": "Activity name",
      "duration": 30,
      "category": "one of: morning_routine, meal, school, study, play, family, creative, outdoor, self_care, rest, sleep",
      "notes": "optional parent tip"
    }
  ]
}

CRITICAL RULES — follow ALL exactly:
- Time format MUST be "H:MM AM/PM" — examples: "7:00 AM", "9:30 AM", "12:00 PM", "3:45 PM". NEVER use 24-hour format like "07:00" or "19:30".
- The FIRST activity MUST start at exactly ${params.wakeUpTime}. NEVER use 12:00 AM or any time before wake-up.
- Build times sequentially: currentTime = ${params.wakeUpTime}. For each activity: "time" = currentTime, then currentTime += duration minutes.
- Example if wake=7:00 AM with durations 30,25,20: first="7:00 AM", second="7:30 AM", third="7:55 AM", fourth="8:15 AM"
- The final "Sleep" activity must be placed at ${params.sleepTime}.
- 12–16 activities covering wake-up to sleep. Include breakfast, lunch, dinner, and at least one snack.
- Include at least 2 outdoor/play activities and 1–2 family bonding activities.
- Activities must match the child's age group and mood.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);

  if (!parsed.title || !Array.isArray(parsed.items) || parsed.items.length < 5) {
    throw new Error("Invalid AI response structure");
  }

  const rawItems: RoutineItem[] = parsed.items.map((item: Record<string, unknown>) => ({
    time: String(item.time ?? "08:00"),
    activity: String(item.activity ?? "Activity"),
    duration: Number(item.duration ?? 30),
    category: String(item.category ?? "play"),
    notes: item.notes ? String(item.notes) : undefined,
    status: "pending" as const,
  }));

  // Always re-anchor to wake time — prevents AI from starting at midnight
  const anchoredItems = params.ageGroup === "infant"
    ? rawItems  // infants use flexible blocks, skip cascade
    : reAnchorToWakeTime(rawItems, params.wakeUpTime, params.sleepTime, params.ageGroup);

  return {
    title: parsed.title,
    items: anchoredItems,
  };
}

type RoutineItem = {
  time: string;
  activity: string;
  duration: number;
  category: string;
  notes?: string;
  status?: "pending" | "completed" | "skipped" | "delayed";
};

// ─── Re-anchor AI routine to wake time ─────────────────────────────────────
// The AI sometimes ignores the wake time and starts at midnight (00:00).
// This post-processor sorts items by the time the AI gave them, then
// rebuilds a strict cascade: first item starts at wakeUpTime, each next
// item starts exactly when the previous one ends.
function reAnchorToWakeTime(
  items: RoutineItem[],
  wakeUpTime: string,
  sleepTime: string,
  ageGroup: AgeGroup
): RoutineItem[] {
  if (!items.length) return items;
  // Infants: keep flexible ordering — just ensure no item is before wakeUpTime
  const wakeMins = timeToMins(wakeUpTime);
  const sleepMins = timeToMins(sleepTime);
  // Effective sleep mins (may be next day for late bedtimes)
  const effectiveSleepMins = sleepMins < wakeMins ? sleepMins + 1440 : sleepMins;

  // Sort by the AI's original time ordering
  const sorted = [...items].sort((a, b) => {
    const ta = timeToMins(a.time);
    const tb = timeToMins(b.time);
    // Handle next-day wrap (e.g. 11 PM < 1 AM for ordering purposes)
    const ra = ta < wakeMins - 120 ? ta + 1440 : ta;
    const rb = tb < wakeMins - 120 ? tb + 1440 : tb;
    return ra - rb;
  });

  // Separate sleep anchor (last item) from the rest
  let sleepIdx = -1;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].category === "sleep" || /sleep|bedtime|good night/i.test(sorted[i].activity)) {
      sleepIdx = i;
      break;
    }
  }
  const sleepAnchor = sleepIdx !== -1 ? sorted.splice(sleepIdx, 1)[0]! : null;

  // Re-cascade: each item starts exactly where the previous one ended
  let cursor = wakeMins;
  const anchored: RoutineItem[] = sorted.map((item) => {
    const dur = Math.max(1, item.duration ?? 30);
    const result = { ...item, time: minsToTime(cursor) };
    cursor += dur;
    // Never push past sleep time
    if (cursor >= effectiveSleepMins && item.category !== "sleep") {
      cursor = Math.min(cursor, effectiveSleepMins - 10);
    }
    return result;
  });

  // Always put sleep anchor at the configured sleep time
  if (sleepAnchor) {
    anchored.push({ ...sleepAnchor, time: minsToTime(sleepMins) });
  }

  return anchored;
}

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

// AI-powered routine generation — uses OpenAI; rate-limited on frontend
router.post("/routines/generate-ai", async (req, res): Promise<void> => {
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

  const totalAgeMonths = (child.age * 12) + ((child as any).ageMonths ?? 0);
  const ageGroup: AgeGroup =
    totalAgeMonths < 12 ? "infant"
    : totalAgeMonths < 36 ? "toddler"
    : totalAgeMonths < 60 ? "preschool"
    : totalAgeMonths < 120 ? "early_school"
    : "pre_teen";

  const {
    hasSchool, isWorkingDay, specialPlans, mood, fridgeItems,
    parent1Role, parent1WorkType, parent1IsWorking,
    parent2Role, parent2WorkType, parent2IsWorking,
  } = parsed.data;

  let foodType = (child as any).foodType ?? "veg";
  if (userId && foodType === "veg") {
    const [pp] = await db.select().from(parentProfilesTable).where(eq(parentProfilesTable.userId, userId));
    if (pp?.foodType) foodType = pp.foodType;
  }

  const p1Status = parent1WorkType === "homemaker" ? "free all day (homemaker)"
    : parent1IsWorking === false ? "free today"
    : parent1IsWorking === true ? "working today"
    : isWorkingDay === false ? "free today" : "working today";

  const p2Status = parent2Role
    ? (parent2WorkType === "homemaker" ? "free all day (homemaker)"
      : parent2IsWorking === false ? "free today"
      : "working today")
    : null;

  const parentAvailSummary = p2Status
    ? `${parent1Role ?? "Parent 1"}: ${p1Status}; ${parent2Role}: ${p2Status}`
    : `${parent1Role ?? "Parent"}: ${p1Status}`;

  try {
    const generated = await generateAiRoutine({
      childName: child.name,
      age: child.age,
      ageGroup,
      wakeUpTime: child.wakeUpTime,
      sleepTime: child.sleepTime,
      schoolStartTime: child.schoolStartTime,
      schoolEndTime: child.schoolEndTime,
      hasSchool: hasSchool !== false,
      foodType,
      mood: mood ?? "normal",
      specialPlans,
      fridgeItems,
      goals: child.goals,
      travelMode: child.travelMode,
      childClass: (child as any).childClass ?? undefined,
      date: parsed.data.date,
      parentAvailSummary,
    });
    res.json(GenerateRoutineResponse.parse(generated));
  } catch {
    // Fallback to rule-based if AI fails
    const p1Free = parent1WorkType === "homemaker" || parent1IsWorking === false || isWorkingDay === false;
    const p2Free = parent2Role ? (parent2WorkType === "homemaker" || parent2IsWorking === false) : false;
    const bothBusy = (parent1IsWorking === true || isWorkingDay === true) && (!parent2Role || parent2IsWorking === true);
    const generated = generateRuleBasedRoutine({
      childName: child.name,
      ageGroup,
      totalAgeMonths,
      wakeUpTime: child.wakeUpTime,
      sleepTime: child.sleepTime,
      schoolStartTime: child.schoolStartTime,
      schoolEndTime: child.schoolEndTime,
      travelMode: child.travelMode,
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
  }
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

import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, routinesTable, childrenTable, behaviorsTable } from "@workspace/db";
import {
  CreateRoutineBody,
  GetRoutineParams,
  DeleteRoutineParams,
  UpdateRoutineItemsParams,
  UpdateRoutineItemsBody,
  ListRoutinesQueryParams,
  ListRoutinesResponse,
  GetRoutineResponse,
  GenerateRoutineBody,
  GenerateRoutineResponse,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

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

  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, parsed.data.childId));
  if (!child) {
    res.status(404).json({ error: "Child not found" });
    return;
  }

  // Fetch recent behavior logs (last 7 days) for adaptive AI context
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  const recentBehaviors = await db
    .select()
    .from(behaviorsTable)
    .where(eq(behaviorsTable.childId, child.id))
    .orderBy(desc(behaviorsTable.createdAt))
    .limit(20);

  const behaviorContext = recentBehaviors.length > 0
    ? recentBehaviors
        .map((b) => `[${b.date}] ${b.type.toUpperCase()}: ${b.behavior}${b.notes ? ` (${b.notes})` : ""}`)
        .join("\n")
    : "No recent behavior logs.";

  const travelModeLabel =
    child.travelMode === "other" && child.travelModeOther
      ? child.travelModeOther
      : child.travelMode;

  const prompt = `You are a smart parenting schedule assistant. Create a realistic, balanced full-day routine for a ${child.age}-year-old child named ${child.name}.

CHILD DETAILS:
- Wake-up time: ${child.wakeUpTime}
- Bedtime / Sleep time: ${child.sleepTime}
- School starts: ${child.schoolStartTime}
- School ends: ${child.schoolEndTime}
- Travel mode to/from school: ${travelModeLabel}
- Daily goals: ${child.goals}
- Date: ${parsed.data.date}

RECENT BEHAVIOR HISTORY (use to adapt the routine):
${behaviorContext}

INSTRUCTIONS:
- Start the day from the wake-up time (${child.wakeUpTime}) and end at sleep time (${child.sleepTime})
- Include ALL of these blocks: morning hygiene/prep, breakfast, school travel, school time, return travel, snack, homework/study, physical play/exercise, screen time (age-appropriate), dinner, wind-down, bedtime
- Add 5-10 minute buffer gaps between major transitions
- Make durations realistic for a ${child.age}-year-old
- Adjust difficulty/length based on behavior history — if child has been skipping meals, add reminders; if struggling at bedtime, add earlier wind-down
- Each item MUST have a specific start time based on the previous item's end time
- Travel time: account for ${travelModeLabel} travel (typically 10-20 min for van/car/walk)

Return a JSON object with:
- title: a warm, friendly title for this routine (e.g. "Leo's Monday Power Day")
- items: an array of schedule items, each with:
  - time: start time like "7:00 AM"
  - activity: clear activity name
  - duration: duration in minutes (integer)
  - category: one of "morning", "school", "travel", "meal", "homework", "play", "screen", "hygiene", "sleep", "wind-down"
  - notes: a short practical tip or encouragement (1 sentence, can be empty string)
  - status: always "pending"

Return ONLY valid JSON, no markdown, no explanation.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const generated = JSON.parse(content) as { title: string; items: RoutineItem[] };

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

router.post("/routines", async (req, res): Promise<void> => {
  const parsed = CreateRoutineBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, parsed.data.childId));
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

export default router;

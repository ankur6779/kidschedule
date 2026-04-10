import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, routinesTable, childrenTable, behaviorsTable, parentProfilesTable, babysittersTable } from "@workspace/db";
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

  const { userId } = getAuth(req);

  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, parsed.data.childId));
  if (!child) {
    res.status(404).json({ error: "Child not found" });
    return;
  }

  // Fetch recent behavior logs for adaptive AI context
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

  // Fetch parent profile for availability context
  let parentContext = "No parent schedule provided.";
  if (userId) {
    const [parentProfile] = await db
      .select()
      .from(parentProfilesTable)
      .where(eq(parentProfilesTable.userId, userId));

    if (parentProfile) {
      const roleLabel = parentProfile.role === "mother" ? "Mother" : "Father";
      const workTypeLabel =
        parentProfile.workType === "work_from_home" ? "Works from home" :
        parentProfile.workType === "work_from_office" ? "Works from office" :
        "Housewife/Homemaker (at home all day)";

      const workHours =
        parentProfile.workType !== "homemaker" && parentProfile.workStartTime && parentProfile.workEndTime
          ? `Work hours: ${parentProfile.workStartTime} – ${parentProfile.workEndTime}`
          : "";

      const freeSlots = ((parentProfile.freeSlots as any[]) || [])
        .map((s: any) => `${s.start}–${s.end}`)
        .join(", ");

      parentContext = `${roleLabel}: ${workTypeLabel}. ${workHours}${freeSlots ? `. Free/available slots: ${freeSlots}` : ""}`;
    }
  }

  // Fetch babysitter if assigned to this child
  let babysitterContext = "";
  if (child.babysitterId) {
    const [sitter] = await db
      .select()
      .from(babysittersTable)
      .where(eq(babysittersTable.id, child.babysitterId));

    if (sitter) {
      babysitterContext = `A babysitter named ${sitter.name} is assigned to ${child.name} today.${sitter.notes ? ` Notes: ${sitter.notes}` : ""}`;
    }
  }

  const travelModeLabel =
    child.travelMode === "other" && child.travelModeOther
      ? child.travelModeOther
      : child.travelMode;

  // Fetch parent food preferences
  let foodContext = "";
  if (userId) {
    const [parentProfile] = await db
      .select()
      .from(parentProfilesTable)
      .where(eq(parentProfilesTable.userId, userId));
    if (parentProfile) {
      const dietLabel = parentProfile.foodType === "veg" ? "Vegetarian only" : "Non-vegetarian (or vegetarian)";
      foodContext = `Diet: ${dietLabel}.${parentProfile.allergies ? ` Allergies/avoid: ${parentProfile.allergies}.` : ""}`;
    }
  }

  const fridgeItems = parsed.data.fridgeItems?.trim();
  const { hasSchool, isWorkingDay, specialPlans } = parsed.data;

  // Determine school status label for prompt
  const schoolStatus = hasSchool === false
    ? "NO SCHOOL TODAY — do NOT include any school, homework, or school-travel blocks."
    : "SCHOOL DAY — include school preparation, travel to school, school time, and return travel.";

  // Determine parent availability for prompt
  const availabilityStatus = isWorkingDay === false
    ? "PARENT HOLIDAY — the parent is FREE and available all day. Add plenty of joint parent-child activities."
    : isWorkingDay === true
    ? "PARENT WORKING DAY — the parent is busy during their work hours. Assign independent or babysitter-friendly tasks during work hours."
    : "";

  // Special plans context
  const specialPlansContext = specialPlans?.trim()
    ? `SPECIAL PLANS TODAY: "${specialPlans.trim()}" — adjust the ENTIRE routine to revolve around this. Place it at a realistic time and rearrange other blocks accordingly.`
    : "";

  const prompt = `You are a smart parenting schedule assistant. Create a realistic, balanced full-day routine for a ${child.age}-year-old child named ${child.name}.

CHILD DETAILS:
- Wake-up time: ${child.wakeUpTime}
- Bedtime / Sleep time: ${child.sleepTime}
- School starts: ${child.schoolStartTime}
- School ends: ${child.schoolEndTime}
- Travel mode to/from school: ${travelModeLabel}
- Daily goals: ${child.goals}
- Date: ${parsed.data.date}

SCHOOL STATUS: ${schoolStatus}

PARENT AVAILABILITY:
${parentContext}
${availabilityStatus ? availabilityStatus : ""}
${babysitterContext ? `\nBABYSITTER: ${babysitterContext}` : ""}
${specialPlansContext ? `\n${specialPlansContext}` : ""}

FOOD PREFERENCES:
${foodContext || "No food preferences set."}
${fridgeItems ? `Available fridge ingredients today: ${fridgeItems}` : ""}

RECENT BEHAVIOR HISTORY (use to adapt the routine):
${behaviorContext}

INSTRUCTIONS:
- Start the day from the wake-up time (${child.wakeUpTime}) and end at sleep time (${child.sleepTime})
${hasSchool === false
  ? `- NO SCHOOL TODAY: Replace school time with: outdoor play/sports (30–60 min), a creative hobby or learning activity (30 min), and relaxed family time. DO NOT add school, homework, or school-travel blocks.`
  : `- Include ALL school-day blocks: morning hygiene/prep, breakfast, school travel, school time, return travel, snack, homework/study`}
- Always include: physical play/exercise, screen time (age-appropriate), dinner, wind-down, bedtime
- FAMILY BONDING (REQUIRED): Add exactly 2–3 bonding activities between parent and child. Choose from: Story Time, Cooking Together, Outdoor Walk, Board Game / Card Game, Art & Craft Together, Movie/Show Time Together. Use category "bonding". Add them at natural breaks in the day — not at school/work hours if parent is busy.
${isWorkingDay === false ? "- Parent is on holiday: add MORE joint parent-child activities throughout the day." : ""}
${isWorkingDay === true ? "- Parent is working: during work hours, assign independent or babysitter tasks. After work hours, add parent-child activities." : ""}
${specialPlans ? "- SPECIAL PLANS take priority: schedule the special activity first, then arrange the rest of the day around it." : ""}
- For each MEAL item (breakfast, lunch, snack, dinner): suggest 2-3 specific healthy kid-friendly options in the notes field, formatted as "Options: [option 1] | [option 2] | [option 3]"
- If fridge items are provided, ONLY suggest meals that can be made with those ingredients
- Respect food preferences (veg/non-veg) and avoid any allergens
- Add 5-10 minute buffer gaps between major transitions
- Make durations realistic for a ${child.age}-year-old
- If a babysitter is assigned, add "Babysitter:" prefix to notes for tasks during parent's working hours
- Adjust based on behavior history — if child skips meals, add reminder notes; if bedtime is hard, add earlier wind-down
- Each item MUST have a specific start time based on the previous item's end time
- Travel time: account for ${travelModeLabel} travel (typically 10-20 min for van/car/walk)

Return a JSON object with:
- title: a warm, friendly title for this routine (e.g. "Leo's Fun Family Sunday" or "Leo's School Power Day")
- items: an array of schedule items, each with:
  - time: start time like "7:00 AM"
  - activity: clear activity name
  - duration: duration in minutes (integer)
  - category: one of "morning", "school", "travel", "meal", "homework", "play", "screen", "hygiene", "sleep", "wind-down", "babysitter", "bonding"
  - notes: for meals, format as "Options: [meal 1] | [meal 2] | [meal 3]". For bonding activities, add a fun tip for the parent. For other items, a short tip. Can be empty string.
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

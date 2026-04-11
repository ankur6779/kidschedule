import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, routinesTable, childrenTable, behaviorsTable, parentProfilesTable, babysittersTable } from "@workspace/db";
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

  // Per-child food preference
  const childFoodType = (child as any).foodType ?? "veg";
  const childFoodLabel = childFoodType === "veg" ? "VEGETARIAN ONLY (no meat, no eggs, no fish)" : "Non-vegetarian allowed (can include eggs, chicken, fish)";
  const childClassLabel = (child as any).childClass ? `Class/Grade: ${(child as any).childClass}` : "";

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
  const { hasSchool, isWorkingDay, specialPlans, mood } = parsed.data;

  // Build per-date parent availability context from new fields
  const {
    parent1Role, parent1WorkType, parent1IsWorking, parent1WorkHours,
    parent2Role, parent2WorkType, parent2IsWorking, parent2WorkHours,
  } = parsed.data;

  function describeParent(
    role: string | undefined,
    workType: string | undefined,
    isWorking: boolean | undefined,
    workHours: string | undefined
  ): string | null {
    if (!role || !workType) return null;
    const wt = workType === "work_from_home" ? "works from home"
      : workType === "work_from_office" ? "works from office"
      : "homemaker (at home all day)";
    if (workType === "homemaker") {
      return `${role}: Homemaker — free and available all day.`;
    }
    if (isWorking === true) {
      const hrs = workHours?.trim() ? ` Working hours: ${workHours}.` : "";
      return `${role}: ${wt} — TODAY IS A WORKING DAY.${hrs} Busy during work hours; assign independent or babysitter tasks then. Available before/after work for parent-child activities.`;
    }
    if (isWorking === false) {
      return `${role}: ${wt} — TODAY IS A HOLIDAY / DAY OFF. Fully free all day. Add plenty of joint parent-child activities.`;
    }
    return `${role}: ${wt}.`;
  }

  const p1Desc = describeParent(parent1Role, parent1WorkType, parent1IsWorking, parent1WorkHours);
  const p2Desc = describeParent(parent2Role, parent2WorkType, parent2IsWorking, parent2WorkHours);

  // Build multi-parent coordination instructions
  let multiParentInstructions = "";
  if (p1Desc || p2Desc) {
    // Override the old parentContext if we have specific per-date data
    const bothBusy = (parent1IsWorking === true) && (parent2IsWorking === true);
    const p1Free = parent1WorkType === "homemaker" || parent1IsWorking === false;
    const p2Free = parent2Role ? (parent2WorkType === "homemaker" || parent2IsWorking === false) : false;
    const onlyP2Free = !p1Free && p2Free;
    const onlyP1Free = p1Free && !p2Free;

    if (bothBusy) {
      multiParentInstructions = "BOTH PARENTS ARE WORKING TODAY: Assign mostly independent or babysitter tasks during work hours. Add bonding activities only before/after work.";
    } else if (onlyP2Free && parent2Role) {
      multiParentInstructions = `${parent2Role} IS FREE TODAY while ${parent1Role ?? "the other parent"} is working. Assign parent-child activities primarily to ${parent2Role}.`;
    } else if (onlyP1Free && parent1Role) {
      multiParentInstructions = `${parent1Role} IS FREE TODAY${parent2Role ? ` while ${parent2Role} is working` : ""}. Assign parent-child activities primarily to ${parent1Role}.`;
    } else if (p1Free && p2Free) {
      multiParentInstructions = "BOTH PARENTS ARE FREE TODAY: Excellent day for family activities! Add plenty of joint parent-child and family bonding time.";
    }
  }

  // Mood-based context for AI prompt
  const moodContext = mood === "angry"
    ? "CHILD'S MOOD TODAY: ANGRY/UPSET — reduce frustrating tasks, add calming activities (deep breathing, quiet play, gentle walk), avoid homework right after school, add fun and engaging activities to lift mood."
    : mood === "lazy"
    ? "CHILD'S MOOD TODAY: LAZY/LOW ENERGY — shorten individual task durations, add more breaks, start with easy fun activities to build momentum, avoid demanding tasks early in the day."
    : mood === "happy"
    ? "CHILD'S MOOD TODAY: HAPPY/ENERGETIC — great day for productive tasks, new challenges, learning activities, and more physical exercise. Take advantage of the good mood!"
    : "";

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

  // Age group classification for the prompt
  const totalAgeMonths = (child.age * 12) + ((child as any).ageMonths ?? 0);
  const ageGroupLabel =
    totalAgeMonths < 12 ? "Infant (0–12 months)"
    : totalAgeMonths < 36 ? "Toddler (1–3 years)"
    : totalAgeMonths < 60 ? "Preschool (3–5 years)"
    : totalAgeMonths < 120 ? "School Age (5–10 years)"
    : "Pre-Teen (10–15 years)";

  const ageGroupInstructions =
    totalAgeMonths < 12
      ? `AGE GROUP — INFANT: This child is a baby. DO NOT create a structured routine. Instead generate gentle daily care guidance: feeding schedule, tummy time, nap windows, bonding activities, and sensory play. Keep all activities very short (5–15 min). No screen time. Prioritize sleep and feeding.`
      : totalAgeMonths < 36
      ? `AGE GROUP — TODDLER: Keep activities SHORT (10–20 min each). Include LOTS of free play and sensory exploration. No long focused tasks. Prioritize nap time (1–2 hours in afternoon). Add one skill-building activity (colors, shapes, songs). Language development through reading or naming.`
      : totalAgeMonths < 60
      ? `AGE GROUP — PRESCHOOL: Mix of structured play and creative activities (drawing, pretend play, puzzles). Include one pre-literacy activity (story, alphabet). Keep academic blocks to max 20 min. Nap optional. Add outdoor play 30 min.`
      : totalAgeMonths < 120
      ? `AGE GROUP — SCHOOL AGE: Include focused study blocks (30 min), outdoor sport (30 min), creative activity, screen time limit (45 min), reading before bed. Homework right after snack. Family bonding in evenings.`
      : `AGE GROUP — PRE-TEEN: Include independent study (Pomodoro style: 25 min work, 5 min break), physical activity (20 min), limited screen time (60 min), and a self-reflection moment. Give age-appropriate independence.`;

  const prompt = `You are a smart parenting schedule assistant. Create a realistic, balanced full-day routine for a ${child.age}-year-old child named ${child.name}.

CHILD DETAILS:
- Age: ${child.age} years${(child as any).ageMonths ? ` ${(child as any).ageMonths} months` : ""} (${ageGroupLabel})
- Wake-up time: ${child.wakeUpTime}
- Bedtime / Sleep time: ${child.sleepTime}
- School starts: ${child.schoolStartTime}
- School ends: ${child.schoolEndTime}
- Travel mode to/from school: ${travelModeLabel}
${childClassLabel ? `- ${childClassLabel}` : ""}
- Daily goals: ${child.goals}
- Date: ${parsed.data.date}

${ageGroupInstructions}

SCHOOL STATUS: ${schoolStatus}

CHILD'S FOOD PREFERENCE: ${childFoodLabel}

PARENT AVAILABILITY:
${(p1Desc || p2Desc) ? [p1Desc, p2Desc].filter(Boolean).join("\n") : parentContext}
${(p1Desc || p2Desc) ? "" : (availabilityStatus ? availabilityStatus : "")}
${multiParentInstructions ? `\nMULTI-PARENT COORDINATION: ${multiParentInstructions}` : ""}
${babysitterContext ? `\nBABYSITTER: ${babysitterContext}` : ""}
${specialPlansContext ? `\n${specialPlansContext}` : ""}

FAMILY FOOD PREFERENCES:
${foodContext || "No family food preferences set."}
${fridgeItems ? `Available fridge ingredients today: ${fridgeItems}` : ""}
${moodContext ? `\n${moodContext}` : ""}

RECENT BEHAVIOR HISTORY (use to adapt the routine):
${behaviorContext}

INSTRUCTIONS:
- Start the day from the wake-up time (${child.wakeUpTime}) and end at sleep time (${child.sleepTime})
${hasSchool === false
  ? `- NO SCHOOL TODAY: Replace school time with: outdoor play/sports (30–60 min), a creative hobby or learning activity (30 min), and relaxed family time. DO NOT add school, homework, or school-travel blocks. Do NOT add a tiffin block.`
  : `- Include ALL school-day blocks: morning hygiene/prep, breakfast, TIFFIN PREPARATION (see below), school travel, school time, return travel, snack, homework/study`}
${hasSchool !== false ? `- TIFFIN / LUNCHBOX PREPARATION (REQUIRED for school days): Add a dedicated "Tiffin Box Preparation" activity in the morning, around 15-20 minutes before school travel. Use category "tiffin". Notes MUST be formatted as "Options: [option 1] | [option 2] | [option 3]" with 3 specific, healthy, kid-friendly tiffin ideas. Strictly follow the child's food preference: ${childFoodLabel}. Examples if veg: Paneer paratha + curd, Veg sandwich, Upma, Poha, Idli + sambar, Cheese toast, Pulao + raita. Examples if non-veg: Egg roll, Egg sandwich, Chicken frankie, Egg fried rice wrap. Use fridge items if provided.` : ""}
- Always include: physical play/exercise, screen time (age-appropriate), dinner, wind-down, bedtime
- FAMILY BONDING (REQUIRED): Add exactly 2–3 bonding activities between parent and child. Choose from: Story Time, Cooking Together, Outdoor Walk, Board Game / Card Game, Art & Craft Together, Movie/Show Time Together. Use category "bonding". Add them at natural breaks in the day — not at school/work hours if parent is busy.
${isWorkingDay === false ? "- Parent is on holiday: add MORE joint parent-child activities throughout the day." : ""}
${isWorkingDay === true ? "- Parent is working: during work hours, assign independent or babysitter tasks. After work hours, add parent-child activities." : ""}
${specialPlans ? "- SPECIAL PLANS take priority: schedule the special activity first, then arrange the rest of the day around it." : ""}
- For each MEAL item (breakfast, lunch, snack, dinner): suggest 2-3 specific healthy kid-friendly options in the notes field, formatted as "Options: [option 1] | [option 2] | [option 3]"
- If fridge items are provided, ONLY suggest meals that can be made with those ingredients
- Strictly follow the child's food preference: ${childFoodLabel}
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
  - category: one of "morning", "school", "travel", "meal", "homework", "play", "screen", "hygiene", "sleep", "wind-down", "babysitter", "bonding", "tiffin"
  - notes: for meals and tiffin, format as "Options: [meal 1] | [meal 2] | [meal 3]". For bonding activities, add a fun tip for the parent. For other items, a short tip. Can be empty string.
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

// AI weekly insights
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
    const categories = [...new Set(items.map((i) => i.category))].join(", ");
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

  if (routineStats.length === 0) {
    res.json(GenerateInsightsResponse.parse({
      insights: [{ type: "suggestion", message: "Start by generating your first routine to get weekly insights!", icon: "✨" }],
      summary: "No routine data yet. Generate some routines to see insights here.",
    }));
    return;
  }

  const statsText = routineStats
    .map((s) => `[${s.date}] ${s.childName}: ${s.completionRate}% done (${s.completed}/${s.total} tasks, ${s.skipped} skipped, ${s.delayed} delayed). Categories: ${s.categories}`)
    .join("\n");

  const prompt = `You are a smart parenting coach analyzing a family's weekly routine data.

ROUTINE DATA (last ${routineStats.length} routines):
${statsText}

Analyze this data and generate 4-6 concise, actionable insights. Each insight should be:
- Specific and based on the actual data
- Warm, encouraging, and parent-friendly
- Actionable (what to do differently)

Return JSON with:
- summary: A 1-2 sentence overall week summary (warm, encouraging tone)
- insights: Array of objects, each with:
  - type: "positive" (good trend), "warning" (area to improve), or "suggestion" (actionable tip)
  - message: The insight text (1 concise sentence)
  - icon: A relevant emoji

Examples of good insights:
- "Leo completed morning routines 90% of the time this week — great consistency!" (positive)
- "Screen time activities are frequently delayed — try moving them earlier in the day." (suggestion)
- "Bedtime routine has been skipped 3 times — a consistent wind-down sequence can help." (warning)

Return ONLY valid JSON, no markdown, no explanation.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const generated = JSON.parse(content);

  res.json(GenerateInsightsResponse.parse(generated));
});

// Partially regenerate a routine — keep completed tasks, regenerate the rest from now
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

  const parse12hToMins = (t: string) => {
    const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return -1;
    let h = parseInt(m[1]);
    const min = parseInt(m[2]);
    const ampm = m[3].toUpperCase();
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h * 60 + min;
  };

  const minsToTime = (total: number) => {
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const dh = h % 12 === 0 ? 12 : h % 12;
    return `${dh}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  // Find pivot: first non-completed item at or after current time
  let pivotIndex = items.length;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.status === "completed" || item.status === "skipped") continue;
    const itemMins = parse12hToMins(item.time);
    if (itemMins >= currentMinutes) {
      pivotIndex = i;
      break;
    }
  }

  const keptItems = items.slice(0, pivotIndex);
  const lastKept = keptItems[keptItems.length - 1];
  const startMins = lastKept
    ? Math.max(parse12hToMins(lastKept.time) + (lastKept.duration ?? 30), currentMinutes)
    : currentMinutes;
  const startTime = minsToTime(startMins);
  const sleepTime = (child as any).sleepTime ?? "9:00 PM";

  const newActivityContext = newActivity
    ? `MUST include this new activity: "${newActivity.name}" at approximately ${newActivity.time ?? startTime} for about ${newActivity.duration ?? 30} minutes. Fit other tasks around it.`
    : "";

  const childFoodLabel = (child as any).foodType === "veg" ? "Vegetarian only" : "Non-vegetarian allowed";

  const prompt = `You are a parenting schedule assistant. Regenerate ONLY the remaining part of today's routine for ${child.name}, age ${child.age}.

COMPLETED TASKS (DO NOT change these):
${keptItems.length > 0 ? keptItems.map((it) => `- ${it.time}: ${it.activity} (${it.duration}min)`).join("\n") : "None yet"}

Generate new tasks from ${startTime} until ${sleepTime}.
${newActivityContext}

CHILD: ${child.age} years old, ${childFoodLabel}, goals: ${child.goals}

Return valid JSON with a "items" array. Each item needs: time (12h format), activity, duration (number in minutes), category (morning/meal/school/homework/play/exercise/sleep/wind-down/hygiene/bonding/tiffin/travel/snack/screen/reading), and optional notes.
Make it realistic — do not leave large gaps.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content ?? '{"items":[]}';
  const generated = JSON.parse(content);
  const newItems = (generated.items ?? []).map((it: any) => ({ ...it, status: "pending" }));

  const updatedItems = [...keptItems, ...newItems];
  await db.update(routinesTable).set({ items: updatedItems as any }).where(eq(routinesTable.id, routineId));

  res.json({ items: updatedItems });
});

export default router;

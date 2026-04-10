import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, routinesTable, childrenTable } from "@workspace/db";
import {
  CreateRoutineBody,
  GetRoutineParams,
  DeleteRoutineParams,
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

  const prompt = `Create a structured daily routine for a ${child.age}-year-old child named ${child.name}.
School starts at ${child.schoolStartTime} and ends at ${child.schoolEndTime}.
Goals for this child: ${child.goals}.
Date: ${parsed.data.date}.

Return a JSON object with:
- title: a short friendly title for this routine
- items: an array of schedule items, each with:
  - time: time string like "7:00 AM"
  - activity: activity name
  - duration: duration in minutes (integer)
  - category: one of "morning", "school", "afternoon", "evening", "meal", "homework", "exercise", "sleep"
  - notes: optional short tip or note (can be empty string)

Cover the full day from wake-up to bedtime. Include meals, school time, homework, exercise, wind-down, and sleep. Make it age-appropriate and achievable.

Return ONLY valid JSON, no markdown.`;

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

  let query = db.select().from(routinesTable).orderBy(desc(routinesTable.createdAt));
  if (queryParams.data.childId) {
    const results = await db.select().from(routinesTable).where(eq(routinesTable.childId, queryParams.data.childId)).orderBy(desc(routinesTable.createdAt));
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
    return;
  }

  const results = await query;
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

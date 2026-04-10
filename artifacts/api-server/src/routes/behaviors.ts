import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, behaviorsTable, childrenTable } from "@workspace/db";
import {
  CreateBehaviorLogBody,
  DeleteBehaviorLogParams,
  ListBehaviorsQueryParams,
  ListBehaviorsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/behaviors", async (req, res): Promise<void> => {
  const queryParams = ListBehaviorsQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const children = await db.select().from(childrenTable);
  const childMap = new Map(children.map((c) => [c.id, c.name]));

  let results;
  if (queryParams.data.childId && queryParams.data.date) {
    results = await db.select().from(behaviorsTable).where(
      and(
        eq(behaviorsTable.childId, queryParams.data.childId),
        eq(behaviorsTable.date, queryParams.data.date),
      ),
    );
  } else if (queryParams.data.childId) {
    results = await db.select().from(behaviorsTable).where(eq(behaviorsTable.childId, queryParams.data.childId));
  } else if (queryParams.data.date) {
    results = await db.select().from(behaviorsTable).where(eq(behaviorsTable.date, queryParams.data.date));
  } else {
    results = await db.select().from(behaviorsTable);
  }

  res.json(
    ListBehaviorsResponse.parse(
      results.map((b) => ({
        ...b,
        childName: childMap.get(b.childId) ?? "Unknown",
        notes: b.notes ?? null,
        createdAt: b.createdAt.toISOString(),
      })),
    ),
  );
});

router.post("/behaviors", async (req, res): Promise<void> => {
  const parsed = CreateBehaviorLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, parsed.data.childId));
  const [behavior] = await db.insert(behaviorsTable).values({
    childId: parsed.data.childId,
    date: parsed.data.date,
    behavior: parsed.data.behavior,
    type: parsed.data.type,
    notes: parsed.data.notes ?? null,
  }).returning();

  res.status(201).json({
    ...behavior,
    childName: child?.name ?? "Unknown",
    notes: behavior.notes ?? null,
    createdAt: behavior.createdAt.toISOString(),
  });
});

router.delete("/behaviors/:id", async (req, res): Promise<void> => {
  const params = DeleteBehaviorLogParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [behavior] = await db.delete(behaviorsTable).where(eq(behaviorsTable.id, params.data.id)).returning();
  if (!behavior) {
    res.status(404).json({ error: "Behavior log not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;

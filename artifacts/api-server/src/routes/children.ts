import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, childrenTable } from "@workspace/db";
import {
  CreateChildBody,
  UpdateChildBody,
  GetChildParams,
  UpdateChildParams,
  DeleteChildParams,
  ListChildrenResponse,
  GetChildResponse,
  UpdateChildResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/children", async (_req, res): Promise<void> => {
  const children = await db.select().from(childrenTable).orderBy(childrenTable.createdAt);
  res.json(ListChildrenResponse.parse(children.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))));
});

router.post("/children", async (req, res): Promise<void> => {
  const parsed = CreateChildBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [child] = await db.insert(childrenTable).values(parsed.data).returning();
  res.status(201).json(GetChildResponse.parse({ ...child, createdAt: child.createdAt.toISOString() }));
});

router.get("/children/:id", async (req, res): Promise<void> => {
  const params = GetChildParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, params.data.id));
  if (!child) {
    res.status(404).json({ error: "Child not found" });
    return;
  }
  res.json(GetChildResponse.parse({ ...child, createdAt: child.createdAt.toISOString() }));
});

router.patch("/children/:id", async (req, res): Promise<void> => {
  const params = UpdateChildParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateChildBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [child] = await db.update(childrenTable).set(parsed.data).where(eq(childrenTable.id, params.data.id)).returning();
  if (!child) {
    res.status(404).json({ error: "Child not found" });
    return;
  }
  res.json(UpdateChildResponse.parse({ ...child, createdAt: child.createdAt.toISOString() }));
});

router.delete("/children/:id", async (req, res): Promise<void> => {
  const params = DeleteChildParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [child] = await db.delete(childrenTable).where(eq(childrenTable.id, params.data.id)).returning();
  if (!child) {
    res.status(404).json({ error: "Child not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;

import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, onboardingProfilesTable, childrenTable, parentProfilesTable } from "@workspace/db";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

router.get("/onboarding", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [profile] = await db
    .select()
    .from(onboardingProfilesTable)
    .where(eq(onboardingProfilesTable.userId, userId));

  // Verify actual data exists — child profile + parent profile both required
  const [childRow] = await db
    .select({ id: childrenTable.id })
    .from(childrenTable)
    .where(eq(childrenTable.userId, userId))
    .limit(1);

  const [parentRow] = await db
    .select({ id: parentProfilesTable.id })
    .from(parentProfilesTable)
    .where(eq(parentProfilesTable.userId, userId))
    .limit(1);

  const hasChild = !!childRow;
  const hasParent = !!parentRow;
  const onboardingComplete = !!(profile?.onboardingComplete && hasChild && hasParent);

  res.json({
    onboardingComplete,
    children: profile?.children ?? [],
    parent: profile?.parent ?? {},
    priorityGoal: profile?.priorityGoal ?? null,
  });
});

router.post("/onboarding", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { children, parent, priorityGoal, onboardingComplete } = req.body;
  const now = new Date();

  const [existing] = await db
    .select()
    .from(onboardingProfilesTable)
    .where(eq(onboardingProfilesTable.userId, userId));

  let profile;
  if (existing) {
    [profile] = await db
      .update(onboardingProfilesTable)
      .set({ children, parent, priorityGoal, onboardingComplete, updatedAt: now })
      .where(eq(onboardingProfilesTable.userId, userId))
      .returning();
  } else {
    [profile] = await db
      .insert(onboardingProfilesTable)
      .values({ userId, children, parent, priorityGoal, onboardingComplete, updatedAt: now })
      .returning();
  }

  res.json({ success: true, onboardingComplete: profile.onboardingComplete });
});

export default router;

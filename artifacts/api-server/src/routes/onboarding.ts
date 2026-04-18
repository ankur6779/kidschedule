import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, onboardingProfilesTable } from "@workspace/db";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

router.get("/onboarding", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [profile] = await db
    .select()
    .from(onboardingProfilesTable)
    .where(eq(onboardingProfilesTable.userId, userId));

  if (!profile) {
    res.json({ onboardingComplete: false, children: [], parent: {}, priorityGoal: null });
    return;
  }

  res.json({
    onboardingComplete: profile.onboardingComplete,
    children: profile.children,
    parent: profile.parent,
    priorityGoal: profile.priorityGoal,
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

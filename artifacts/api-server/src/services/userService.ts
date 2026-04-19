import { eq } from "drizzle-orm";
import { db, parentProfilesTable, childrenTable, type Child, type ParentProfile } from "@workspace/db";

export type UserSummary = {
  name: string;
  parentType: string;
};

export type ChildSummary = {
  id: number;
  name: string;
  ageGroup: string;
  problems: string[];
};

function ageGroupOf(age: number): string {
  if (age <= 2) return "0-2 yrs";
  if (age <= 4) return "3-4 yrs";
  if (age <= 7) return "5-7 yrs";
  if (age <= 12) return "8-12 yrs";
  return "13+ yrs";
}

function parseGoals(goals: string | null): string[] {
  if (!goals) return [];
  return goals
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export async function getUserSummary(userId: string): Promise<UserSummary> {
  const [profile] = await db
    .select()
    .from(parentProfilesTable)
    .where(eq(parentProfilesTable.userId, userId));

  return {
    name: profile?.name?.trim() || "Parent",
    parentType: profile?.role ?? "mother",
  };
}

export async function getChildren(userId: string): Promise<{
  children: ChildSummary[];
  raw: Child[];
}> {
  const rows = await db
    .select()
    .from(childrenTable)
    .where(eq(childrenTable.userId, userId));

  return {
    raw: rows,
    children: rows.map((c) => ({
      id: c.id,
      name: c.name,
      ageGroup: ageGroupOf(c.age),
      problems: parseGoals(c.goals),
    })),
  };
}

export type FullUserContext = {
  user: UserSummary;
  children: ChildSummary[];
  rawChildren: Child[];
  rawProfile: ParentProfile | undefined;
};

export async function loadUserContext(userId: string): Promise<FullUserContext> {
  const [[profile], kids] = await Promise.all([
    db.select().from(parentProfilesTable).where(eq(parentProfilesTable.userId, userId)),
    getChildren(userId),
  ]);

  return {
    user: {
      name: profile?.name?.trim() || "Parent",
      parentType: profile?.role ?? "mother",
    },
    children: kids.children,
    rawChildren: kids.raw,
    rawProfile: profile,
  };
}

import { eq, desc } from "drizzle-orm";
import { db, userProgressTable } from "@workspace/db";

export type CoachSection = {
  currentGoal: string;
  currentStep: number;
  totalSteps: number;
  progress: number;
  currentWin: {
    title: string;
    objective: string;
    summary: string;
  };
};

const DEFAULT_TOTAL = 12;

export async function getCoachProgress(userId: string): Promise<CoachSection> {
  const rows = await db
    .select()
    .from(userProgressTable)
    .where(eq(userProgressTable.userId, userId))
    .orderBy(desc(userProgressTable.createdAt))
    .limit(50);

  if (rows.length === 0) {
    return {
      currentGoal: "Get started with Amy",
      currentStep: 0,
      totalSteps: DEFAULT_TOTAL,
      progress: 0,
      currentWin: {
        title: "Begin your first guided win",
        objective: "Pick a focus area and let Amy walk you through 12 micro-wins.",
        summary: "Tap Continue Coaching on the dashboard to start.",
      },
    };
  }

  // Latest session = first row
  const latest = rows[0]!;
  const sessionRows = rows.filter((r) => r.sessionId === latest.sessionId);

  // Credit: yes=1, somewhat=0.5, no=0
  const credit = sessionRows.reduce((sum, r) => {
    if (r.feedback === "yes") return sum + 1;
    if (r.feedback === "somewhat") return sum + 0.5;
    return sum;
  }, 0);

  const totalSteps = latest.totalWins || DEFAULT_TOTAL;
  const winNumbers = sessionRows.map((r) => r.winNumber);
  const maxWin = winNumbers.length > 0 ? Math.max(...winNumbers) : 0;
  const currentStep = Math.min(totalSteps, maxWin);
  const progress = totalSteps === 0 ? 0 : Math.min(1, credit / totalSteps);

  return {
    currentGoal: latest.planTitle,
    currentStep,
    totalSteps,
    progress,
    currentWin: {
      title: `Step ${currentStep} of ${totalSteps}`,
      objective: latest.planTitle,
      summary: "Continue your guided wins to keep momentum going.",
    },
  };
}

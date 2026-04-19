import type { RoutineSection } from "./routineService";
import type { CoachSection } from "./coachService";
import type { BehaviorSection } from "./behaviorService";
import type { ChildSummary } from "./userService";

export type Insight = {
  title: string;
  description: string;
};

export type Recommendation = {
  type: "coach" | "routine" | "activity";
  title: string;
  description: string;
};

const EVERGREEN_INSIGHTS: Insight[] = [
  {
    title: "Why kids resist instructions",
    description:
      "Resistance is rarely defiance — it's overwhelm or disconnection. Three tiny shifts make instructions land instantly.",
  },
  {
    title: "Building sleep habits that stick",
    description:
      "Consistent wind-down beats strict bedtime. The 4-step pre-sleep ritual that resets even the most resistant sleeper.",
  },
  {
    title: "The connection cup theory of behaviour",
    description:
      "When a child's connection cup is empty, behaviour falls apart. Refill it in 10 minutes a day.",
  },
];

export function buildInsightsAndRecommendations(opts: {
  routine: RoutineSection;
  coach: CoachSection;
  behavior: BehaviorSection;
  children: ChildSummary[];
}): { insights: Insight[]; recommendations: Recommendation[] } {
  const { routine, coach, behavior, children } = opts;
  const recommendations: Recommendation[] = [];

  if (routine.totalCount > 0 && routine.progress < 0.5) {
    recommendations.push({
      type: "routine",
      title: "Adjust today's routine",
      description: `${routine.totalCount - routine.completedCount} tasks left — try moving the next one earlier.`,
    });
  }

  if (coach.progress < 0.4) {
    recommendations.push({
      type: "coach",
      title: "Continue your guided wins",
      description: `You're on step ${coach.currentStep} of ${coach.totalSteps} — small wins compound fast.`,
    });
  }

  if (behavior.metrics.screen < 50) {
    recommendations.push({
      type: "activity",
      title: "Try a focus activity today",
      description: "10 min of building blocks before screens to anchor attention.",
    });
  }

  if (behavior.metrics.sleep < 50) {
    recommendations.push({
      type: "routine",
      title: "Tighten the bedtime routine",
      description: "Shift dinner 15 min earlier — sleep onset improves within 3 days.",
    });
  }

  if (behavior.metrics.listening < 50) {
    recommendations.push({
      type: "coach",
      title: "Replace 'no' with 'when-then'",
      description: "Gentle compliance language that reduces resistance instantly.",
    });
  }

  // Default fallback so recommendations are never empty
  if (recommendations.length === 0) {
    recommendations.push({
      type: "activity",
      title: children.length > 0 ? `Spend 10 min 1-on-1 with ${children[0]!.name}` : "Spend 10 min of 1-on-1 time today",
      description: "Pure attention without phones builds the connection cup faster than anything else.",
    });
  }

  // Trim to at most 4
  return {
    insights: EVERGREEN_INSIGHTS.slice(0, 3),
    recommendations: recommendations.slice(0, 4),
  };
}

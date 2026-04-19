import { loadUserContext } from "./userService";
import { getRoutineForChildren, type RoutineSection } from "./routineService";
import { getCoachProgress, type CoachSection } from "./coachService";
import { getBehaviorSection, type BehaviorSection } from "./behaviorService";
import { buildInsightsAndRecommendations, type Insight, type Recommendation } from "./hubService";
import type { UserSummary, ChildSummary } from "./userService";
import { getEntitlements, type EntitlementSummary } from "./subscriptionService";

export type AppDataResponse = {
  user: UserSummary;
  children: ChildSummary[];
  dashboard: {
    greeting: string;
    totalProgress: number;
    streak: number;
  };
  routine: RoutineSection;
  coach: CoachSection;
  behavior: BehaviorSection;
  insights: Insight[];
  recommendations: Recommendation[];
  subscription: EntitlementSummary;
  meta: {
    generatedAt: string;
    cached: boolean;
  };
};

function greetingFor(name: string): string {
  const hour = new Date().getHours();
  const tod = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${tod}, ${name}`;
}

// Simple in-memory cache: userId -> { value, expiresAt }
// NOTE: Single-instance only. For multi-instance deployments this should be
// replaced with Redis or a shared cache table — refresh requests will only
// invalidate the receiving instance.
type CacheEntry = { value: AppDataResponse; expiresAt: number };
const CACHE_TTL_MS = 15_000;
const cache = new Map<string, CacheEntry>();

export function invalidateAppDataCache(userId: string): void {
  cache.delete(userId);
}

export async function buildAppData(userId: string): Promise<AppDataResponse> {
  const ctx = await loadUserContext(userId);
  const childIds = ctx.rawChildren.map((c) => c.id);

  const [routine, coach, behavior, subscription] = await Promise.all([
    getRoutineForChildren(childIds),
    getCoachProgress(userId),
    getBehaviorSection(childIds),
    getEntitlements(userId),
  ]);

  const totalProgress =
    (routine.progress + coach.progress + behavior.score / 100) / 3;

  const { insights, recommendations } = buildInsightsAndRecommendations({
    routine,
    coach,
    behavior,
    children: ctx.children,
  });

  return {
    user: ctx.user,
    children: ctx.children,
    dashboard: {
      greeting: greetingFor(ctx.user.name),
      totalProgress: Math.round(totalProgress * 100) / 100,
      streak: 0, // streak tracking not yet persisted; reserved for future
    },
    routine,
    coach,
    behavior,
    insights,
    recommendations,
    subscription,
    meta: {
      generatedAt: new Date().toISOString(),
      cached: false,
    },
  };
}

export async function getAppData(
  userId: string,
  opts: { forceRefresh?: boolean } = {},
): Promise<AppDataResponse> {
  const now = Date.now();
  const hit = cache.get(userId);
  if (!opts.forceRefresh && hit && hit.expiresAt > now) {
    return { ...hit.value, meta: { ...hit.value.meta, cached: true } };
  }

  const fresh = await buildAppData(userId);
  cache.set(userId, { value: fresh, expiresAt: now + CACHE_TTL_MS });
  return fresh;
}

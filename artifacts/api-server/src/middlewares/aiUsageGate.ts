import type { Request, Response, NextFunction } from "express";
import {
  getOrCreateSubscription,
  isPremiumNow,
  incrementAiUsage,
  FREE_LIMITS,
} from "../services/subscriptionService";

/**
 * Middleware: enforces the per-day Amy AI query quota for free users.
 *
 * Strategy: atomic reserve-then-check. We increment first (atomic upsert),
 * which makes concurrent calls race-safe. If the new count exceeds the
 * quota we immediately decrement and return 402. We also decrement on any
 * non-2xx outcome from the downstream handler so failed AI calls do not
 * burn quota.
 *
 * Premium users bypass entirely (no counter touched).
 */
export async function aiUsageGate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = (req as any).auth?.userId as string | undefined;
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const sub = await getOrCreateSubscription(userId);
  if (isPremiumNow(sub)) {
    next();
    return;
  }

  // Reserve a slot atomically.
  const newCount = await incrementAiUsage(userId, 1);
  if (newCount > FREE_LIMITS.aiQueriesPerDay) {
    // Roll back the reservation — we exceeded the quota.
    await incrementAiUsage(userId, -1).catch(() => undefined);
    res.status(402).json({
      error: "ai_quota_exceeded",
      message: "Daily Amy AI limit reached. Upgrade for unlimited queries.",
      limit: FREE_LIMITS.aiQueriesPerDay,
      used: FREE_LIMITS.aiQueriesPerDay,
      resetsAt: nextUtcMidnight(),
    });
    return;
  }

  // Refund the reservation if downstream handler ends up non-2xx.
  const origEnd = res.end.bind(res);
  let settled = false;
  // @ts-expect-error - express.end has multiple overloads
  res.end = function (...args: unknown[]) {
    if (!settled) {
      settled = true;
      if (res.statusCode < 200 || res.statusCode >= 300) {
        void incrementAiUsage(userId, -1).catch(() => undefined);
      }
    }
    // @ts-expect-error - express.end has multiple overloads
    return origEnd(...args);
  };
  next();
}

function nextUtcMidnight(): string {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
}

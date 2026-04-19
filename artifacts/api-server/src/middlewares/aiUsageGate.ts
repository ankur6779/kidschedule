import type { Request, Response, NextFunction } from "express";
import {
  getOrCreateSubscription,
  isPremiumNow,
  getAiUsageToday,
  incrementAiUsage,
  FREE_LIMITS,
} from "../services/subscriptionService";

/**
 * Middleware: enforces the per-day Amy AI query quota for free users.
 * On a successful 2xx response, increments today's usage atomically.
 *
 * Premium users bypass entirely.
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
  const used = await getAiUsageToday(userId);
  if (used >= FREE_LIMITS.aiQueriesPerDay) {
    res.status(402).json({
      error: "ai_quota_exceeded",
      message: "Daily Amy AI limit reached. Upgrade for unlimited queries.",
      limit: FREE_LIMITS.aiQueriesPerDay,
      used,
      resetsAt: nextUtcMidnight(),
    });
    return;
  }

  // Hook res.end so we only count 2xx outcomes
  const origEnd = res.end.bind(res);
  let counted = false;
  // @ts-expect-error - express.end has multiple overloads
  res.end = function (...args: unknown[]) {
    if (!counted && res.statusCode >= 200 && res.statusCode < 300) {
      counted = true;
      void incrementAiUsage(userId).catch(() => undefined);
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

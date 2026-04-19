import { db, razorpayWebhookEventsTable } from "@workspace/db";
import { lt } from "drizzle-orm";
import { logger } from "./logger";

const DEFAULT_RETENTION_DAYS = 30;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getRetentionDays(): number {
  const raw = process.env["RAZORPAY_WEBHOOK_RETENTION_DAYS"];
  if (!raw) return DEFAULT_RETENTION_DAYS;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_RETENTION_DAYS;
  return n;
}

export async function pruneRazorpayWebhookEvents(): Promise<number> {
  const retentionDays = getRetentionDays();
  const cutoff = new Date(Date.now() - retentionDays * ONE_DAY_MS);
  try {
    // Use rowCount from the underlying pg QueryResult instead of
    // .returning() so we don't materialize every deleted row id in
    // memory just to compute the count — important if a long outage
    // leaves a large backlog.
    const result: { rowCount?: number | null } = await db
      .delete(razorpayWebhookEventsTable)
      .where(lt(razorpayWebhookEventsTable.receivedAt, cutoff));
    const count = result.rowCount ?? 0;
    logger.info(
      { count, retentionDays, cutoff: cutoff.toISOString() },
      "razorpay_webhook_events_pruned",
    );
    return count;
  } catch (err) {
    logger.error({ err }, "razorpay_webhook_events_prune_failed");
    return 0;
  }
}

let timer: NodeJS.Timeout | undefined;

export function startRazorpayWebhookCleanup(): void {
  if (timer) return;
  void pruneRazorpayWebhookEvents();
  timer = setInterval(() => {
    void pruneRazorpayWebhookEvents();
  }, ONE_DAY_MS);
  if (typeof timer.unref === "function") timer.unref();
}

export function stopRazorpayWebhookCleanup(): void {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}

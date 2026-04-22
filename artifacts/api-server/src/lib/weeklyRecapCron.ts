import cron from "node-cron";
import { dispatchWeeklyRecaps } from "../services/weeklyRecapService";
import { logger } from "./logger";

let started = false;

export function startWeeklyRecapCron(): void {
  if (started) return;
  if (process.env["DISABLE_WEEKLY_RECAP_CRON"] === "1") {
    logger.info("Weekly recap cron disabled via DISABLE_WEEKLY_RECAP_CRON");
    return;
  }
  // Sundays at 09:00 IST.
  const expr = process.env["WEEKLY_RECAP_CRON"] ?? "0 9 * * 0";
  const tz = process.env["WEEKLY_RECAP_TZ"] ?? "Asia/Kolkata";
  try {
    cron.schedule(
      expr,
      () => {
        logger.info({ expr, tz }, "Weekly recap cron firing");
        dispatchWeeklyRecaps().catch((err) =>
          logger.error({ err }, "dispatchWeeklyRecaps threw"),
        );
      },
      { timezone: tz },
    );
    started = true;
    logger.info({ expr, tz }, "Weekly recap cron scheduled");
  } catch (err) {
    logger.error({ err, expr, tz }, "Could not schedule weekly recap cron");
  }
}

import { pgTable, text, serial, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * One row per referrer→referred pair. A user can only ever appear once as a
 * `referredUserId` (we enforce this via a unique constraint, so an email
 * cannot be referred by two different people).
 *
 * status:
 *   "pending" — referred user signed up but has not used a feature yet
 *   "valid"   — referred user verified + used their first feature
 *   "paid"    — referred user purchased a paid subscription
 */
export const referralsTable = pgTable(
  "referrals",
  {
    id: serial("id").primaryKey(),
    referrerUserId: text("referrer_user_id").notNull(),
    referredUserId: text("referred_user_id").notNull().unique(),
    code: text("code").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => ({
    referrerIdx: index("referrals_referrer_idx").on(t.referrerUserId),
    statusIdx: index("referrals_status_idx").on(t.referrerUserId, t.status),
  }),
);

export const insertReferralSchema = createInsertSchema(referralsTable).omit({
  id: true,
  createdAt: true,
  validatedAt: true,
  paidAt: true,
});
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referralsTable.$inferSelect;

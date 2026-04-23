import { pgTable, varchar, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const featureFeedbackTable = pgTable(
  "feature_feedback",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").notNull(),
    feature: varchar("feature", { length: 64 }).notNull(),
    feedback: varchar("feedback", { length: 32 }).notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userFeatureUq: uniqueIndex("feature_feedback_user_feature_uq").on(t.userId, t.feature),
    featureIdx: index("feature_feedback_feature_idx").on(t.feature),
  })
);

export type FeatureFeedbackRow = typeof featureFeedbackTable.$inferSelect;
export type InsertFeatureFeedback = typeof featureFeedbackTable.$inferInsert;

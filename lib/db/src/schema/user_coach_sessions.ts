import { pgTable, varchar, text, jsonb, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userCoachSessionsTable = pgTable(
  "user_coach_sessions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id", { length: 64 }).notNull().unique(),
    userId: text("user_id").notNull(),
    goalId: varchar("goal_id", { length: 64 }).notNull(),
    planJson: jsonb("plan_json").notNull(),
    inputs: jsonb("inputs").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("user_coach_sessions_user_idx").on(t.userId),
    sessionUq: uniqueIndex("user_coach_sessions_session_uq").on(t.sessionId),
  })
);

export type UserCoachSessionRow = typeof userCoachSessionsTable.$inferSelect;
export type InsertUserCoachSession = typeof userCoachSessionsTable.$inferInsert;

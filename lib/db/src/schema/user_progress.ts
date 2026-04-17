import { pgTable, varchar, text, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userProgressTable = pgTable(
  "user_progress",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").notNull(),
    sessionId: varchar("session_id", { length: 64 }).notNull(),
    goalId: varchar("goal_id", { length: 64 }).notNull(),
    planTitle: text("plan_title").notNull(),
    winNumber: integer("win_number").notNull(),
    totalWins: integer("total_wins").notNull(),
    feedback: varchar("feedback", { length: 16 }).notNull(), // 'yes' | 'somewhat' | 'no'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("user_progress_user_idx").on(t.userId),
    sessionWinUq: uniqueIndex("user_progress_session_win_uq").on(t.sessionId, t.winNumber),
  })
);

export type UserProgressRow = typeof userProgressTable.$inferSelect;
export type InsertUserProgress = typeof userProgressTable.$inferInsert;

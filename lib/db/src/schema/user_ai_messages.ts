import { pgTable, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userAiMessagesTable = pgTable(
  "user_ai_messages",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").notNull(),
    role: varchar("role", { length: 16 }).notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index("user_ai_messages_user_created_idx").on(t.userId, t.createdAt),
  })
);

export type UserAiMessageRow = typeof userAiMessagesTable.$inferSelect;
export type InsertUserAiMessage = typeof userAiMessagesTable.$inferInsert;

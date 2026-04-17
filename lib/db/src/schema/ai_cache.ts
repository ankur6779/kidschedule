import { pgTable, text, jsonb, timestamp, varchar, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const aiCacheTable = pgTable(
  "ai_cache",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    cacheKey: text("cache_key").notNull().unique(),
    namespace: varchar("namespace", { length: 64 }).notNull().default("ai_coach"),
    input: jsonb("input").notNull(),
    response: jsonb("response").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    namespaceIdx: index("ai_cache_namespace_idx").on(table.namespace),
    createdAtIdx: index("ai_cache_created_at_idx").on(table.createdAt),
  })
);

export type AiCacheRow = typeof aiCacheTable.$inferSelect;
export type InsertAiCache = typeof aiCacheTable.$inferInsert;

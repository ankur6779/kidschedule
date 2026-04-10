import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const babysittersTable = pgTable("babysitters", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  mobileNumber: text("mobile_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBabysitterSchema = createInsertSchema(babysittersTable).omit({ id: true, createdAt: true });
export type InsertBabysitter = z.infer<typeof insertBabysitterSchema>;
export type Babysitter = typeof babysittersTable.$inferSelect;

import { pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const childrenTable = pgTable("children", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  schoolStartTime: text("school_start_time").notNull(),
  schoolEndTime: text("school_end_time").notNull(),
  wakeUpTime: text("wake_up_time").notNull().default("07:00"),
  sleepTime: text("sleep_time").notNull().default("21:00"),
  travelMode: text("travel_mode").notNull().default("car"),
  travelModeOther: text("travel_mode_other"),
  goals: text("goals").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChildSchema = createInsertSchema(childrenTable).omit({ id: true, createdAt: true });
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Child = typeof childrenTable.$inferSelect;

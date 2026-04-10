import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const parentProfilesTable = pgTable("parent_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  role: text("role").notNull().default("mother"),
  gender: text("gender"),
  mobileNumber: text("mobile_number"),
  workType: text("work_type").notNull().default("work_from_home"),
  workStartTime: text("work_start_time"),
  workEndTime: text("work_end_time"),
  freeSlots: jsonb("free_slots").default([]),
  foodType: text("food_type").notNull().default("non_veg"),
  allergies: text("allergies"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertParentProfileSchema = createInsertSchema(parentProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertParentProfile = z.infer<typeof insertParentProfileSchema>;
export type ParentProfile = typeof parentProfilesTable.$inferSelect;

import { pgTable, text, serial, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const onboardingProfilesTable = pgTable("onboarding_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  children: jsonb("children").notNull().default([]),
  parent: jsonb("parent").notNull().default({}),
  priorityGoal: text("priority_goal"),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOnboardingSchema = createInsertSchema(onboardingProfilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOnboarding = z.infer<typeof insertOnboardingSchema>;
export type OnboardingProfile = typeof onboardingProfilesTable.$inferSelect;

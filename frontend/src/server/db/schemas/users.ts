import { pgTable, uuid, varchar, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: varchar("clerk_id", { length: 32 }).notNull().unique(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  imageUrl: varchar("image_url", { length: 1000 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  username: varchar("username", { length: 255 }).unique(),
  onboardingCompleted: timestamp("onboarding_completed", { withTimezone: true }),
  learningArea: varchar("learning_area", { length: 50 }),
  learningStyle: varchar("learning_style", { length: 50 }),
  currentLevel: varchar("current_level", { length: 50 }),
  multipleIntelligences: jsonb("multiple_intelligences").$type<string[]>(),
  timeAvailable: varchar("time_available", { length: 255 }),
  preferredSchedule: varchar("preferred_schedule", { length: 255 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert; 
import { pgTable, uuid, varchar, text, timestamp, integer, real, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";
import { contentItems } from "./courses";

export const userProgress = pgTable("user_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
  status: varchar("status", { length: 50 }).default("not_started").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  score: real("score"),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
  spacedRepetitionInterval: integer("spaced_repetition_interval").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userInteractions = pgTable("user_interactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
  interactionType: varchar("interaction_type", { length: 50 }).notNull(),
  interactionData: json("interaction_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  contentItem: one(contentItems, {
    fields: [userProgress.contentItemId],
    references: [contentItems.id],
  }),
}));

export const userInteractionsRelations = relations(userInteractions, ({ one }) => ({
  user: one(users, {
    fields: [userInteractions.userId],
    references: [users.id],
  }),
  contentItem: one(contentItems, {
    fields: [userInteractions.contentItemId],
    references: [contentItems.id],
  }),
}));

export const insertUserProgressSchema = createInsertSchema(userProgress);
export const selectUserProgressSchema = createSelectSchema(userProgress);
export const insertUserInteractionSchema = createInsertSchema(userInteractions);
export const selectUserInteractionSchema = createSelectSchema(userInteractions);

export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;
export type UserInteraction = typeof userInteractions.$inferSelect;
export type NewUserInteraction = typeof userInteractions.$inferInsert; 
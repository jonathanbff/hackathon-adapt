import { pgTable, uuid, varchar, text, timestamp, integer, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { contentItems } from "./courses";

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
  youtubeId: varchar("youtube_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  transcription: text("transcription"),
  durationSeconds: integer("duration_seconds"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const videoTimestamps = pgTable("video_timestamps", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
  timestampSeconds: integer("timestamp_seconds").notNull(),
  contentSnippet: text("content_snippet").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  references: text("references"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quizzes = pgTable("quizzes", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").references(() => quizzes.id, { onDelete: "cascade" }).notNull(),
  question: text("question").notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(),
  options: json("options"),
  correctAnswer: text("correct_answer").notNull(),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const flashcards = pgTable("flashcards", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
  frontContent: text("front_content").notNull(),
  backContent: text("back_content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  configuration: json("configuration"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const videosRelations = relations(videos, ({ one, many }) => ({
  contentItem: one(contentItems, {
    fields: [videos.contentItemId],
    references: [contentItems.id],
  }),
  timestamps: many(videoTimestamps),
}));

export const videoTimestampsRelations = relations(videoTimestamps, ({ one }) => ({
  video: one(videos, {
    fields: [videoTimestamps.videoId],
    references: [videos.id],
  }),
}));

export const articlesRelations = relations(articles, ({ one }) => ({
  contentItem: one(contentItems, {
    fields: [articles.contentItemId],
    references: [contentItems.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  contentItem: one(contentItems, {
    fields: [quizzes.contentItemId],
    references: [contentItems.id],
  }),
  questions: many(quizQuestions),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  contentItem: one(contentItems, {
    fields: [flashcards.contentItemId],
    references: [contentItems.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  contentItem: one(contentItems, {
    fields: [activities.contentItemId],
    references: [contentItems.id],
  }),
}));

export const insertVideoSchema = createInsertSchema(videos);
export const selectVideoSchema = createSelectSchema(videos);
export const insertVideoTimestampSchema = createInsertSchema(videoTimestamps);
export const selectVideoTimestampSchema = createSelectSchema(videoTimestamps);
export const insertArticleSchema = createInsertSchema(articles);
export const selectArticleSchema = createSelectSchema(articles);
export const insertQuizSchema = createInsertSchema(quizzes);
export const selectQuizSchema = createSelectSchema(quizzes);
export const insertQuizQuestionSchema = createInsertSchema(quizQuestions);
export const selectQuizQuestionSchema = createSelectSchema(quizQuestions);
export const insertFlashcardSchema = createInsertSchema(flashcards);
export const selectFlashcardSchema = createSelectSchema(flashcards);
export const insertActivitySchema = createInsertSchema(activities);
export const selectActivitySchema = createSelectSchema(activities);

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
export type VideoTimestamp = typeof videoTimestamps.$inferSelect;
export type NewVideoTimestamp = typeof videoTimestamps.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type NewQuizQuestion = typeof quizQuestions.$inferInsert;
export type Flashcard = typeof flashcards.$inferSelect;
export type NewFlashcard = typeof flashcards.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert; 
import { pgTable, uuid, varchar, text, timestamp, integer, json, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { contentItems, youtubeVideos } from "./courses";
import { users } from "./users";

export const content = pgTable("content", {
  id: uuid("id").primaryKey().defaultRandom(),
  _clerk: varchar("_clerk", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lessonVideos = pgTable("lesson_videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
  youtubeVideoId: uuid("youtube_video_id").references(() => youtubeVideos.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  transcription: text("transcription"),
  durationSeconds: integer("duration_seconds"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const videoTimestamps = pgTable("video_timestamps", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id").references(() => lessonVideos.id, { onDelete: "cascade" }).notNull(),
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

export const examples = pgTable("examples", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  exampleType: varchar("example_type", { length: 50 }).notNull(),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userNotes = pgTable("user_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  noteType: varchar("note_type", { length: 50 }).default("general").notNull(),
  timestampSeconds: integer("timestamp_seconds"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const videoProgress = pgTable("video_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  videoId: uuid("video_id").references(() => lessonVideos.id, { onDelete: "cascade" }).notNull(),
  watchTimeSeconds: integer("watch_time_seconds").default(0).notNull(),
  lastPositionSeconds: integer("last_position_seconds").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const lessonVideosRelations = relations(lessonVideos, ({ one, many }) => ({
  contentItem: one(contentItems, {
    fields: [lessonVideos.contentItemId],
    references: [contentItems.id],
  }),
  youtubeVideo: one(youtubeVideos, {
    fields: [lessonVideos.youtubeVideoId],
    references: [youtubeVideos.id],
  }),
  timestamps: many(videoTimestamps),
}));

export const videoTimestampsRelations = relations(videoTimestamps, ({ one }) => ({
  video: one(lessonVideos, {
    fields: [videoTimestamps.videoId],
    references: [lessonVideos.id],
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

export const examplesRelations = relations(examples, ({ one }) => ({
  contentItem: one(contentItems, {
    fields: [examples.contentItemId],
    references: [contentItems.id],
  }),
}));

export const userNotesRelations = relations(userNotes, ({ one }) => ({
  user: one(users, {
    fields: [userNotes.userId],
    references: [users.id],
  }),
  contentItem: one(contentItems, {
    fields: [userNotes.contentItemId],
    references: [contentItems.id],
  }),
}));

export const videoProgressRelations = relations(videoProgress, ({ one }) => ({
  user: one(users, {
    fields: [videoProgress.userId],
    references: [users.id],
  }),
  video: one(lessonVideos, {
    fields: [videoProgress.videoId],
    references: [lessonVideos.id],
  }),
}));

export const insertLessonVideoSchema = createInsertSchema(lessonVideos);
export const selectLessonVideoSchema = createSelectSchema(lessonVideos);
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
export const insertExampleSchema = createInsertSchema(examples);
export const selectExampleSchema = createSelectSchema(examples);
export const insertUserNoteSchema = createInsertSchema(userNotes);
export const selectUserNoteSchema = createSelectSchema(userNotes);
export const insertVideoProgressSchema = createInsertSchema(videoProgress);
export const selectVideoProgressSchema = createSelectSchema(videoProgress);

export type LessonVideo = typeof lessonVideos.$inferSelect;
export type NewLessonVideo = typeof lessonVideos.$inferInsert;
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
export type Example = typeof examples.$inferSelect;
export type NewExample = typeof examples.$inferInsert;
export type UserNote = typeof userNotes.$inferSelect;
export type NewUserNote = typeof userNotes.$inferInsert;
export type VideoProgress = typeof videoProgress.$inferSelect;
export type NewVideoProgress = typeof videoProgress.$inferInsert;

export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert; 
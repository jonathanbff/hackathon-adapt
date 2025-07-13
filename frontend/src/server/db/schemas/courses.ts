import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  real,
  json,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { lessonVideos } from "./content";

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("draft").notNull(),
  generationStatus: varchar("generation_status", { length: 50 }).default("not_started").notNull(),
  difficulty: varchar("difficulty", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const modules = pgTable("modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id")
    .references(() => courses.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  isContentGenerated: boolean("is_content_generated").default(false).notNull(),
  generatedLessonsCount: integer("generated_lessons_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id")
    .references(() => modules.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  isContentGenerated: boolean("is_content_generated").default(false).notNull(),
  hasQuiz: boolean("has_quiz").default(false).notNull(),
  hasExamples: boolean("has_examples").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const contentItems = pgTable("content_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  lessonId: uuid("lesson_id")
    .references(() => lessons.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userCourses = pgTable("user_courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  courseId: uuid("course_id")
    .references(() => courses.id, { onDelete: "cascade" })
    .notNull(),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
  progressPercentage: real("progress_percentage").default(0).notNull(),
});

export const courseGenerationRequests = pgTable("course_generation_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  courseId: uuid("course_id").references(() => courses.id, {
    onDelete: "cascade",
  }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  goals: json("goals").$type<string[]>().notNull(),
  duration: varchar("duration", { length: 50 }).notNull(),
  difficulty: varchar("difficulty", { length: 20 }).notNull(),
  format: json("format").$type<string[]>().notNull(),
  structure: json("structure")
    .$type<{
      modules: number;
      lessonsPerModule: number;
      assessments: boolean;
      projects: boolean;
    }>()
    .notNull(),
  materials: json("materials").$type<{
    documents: string[];
    videos: string[];
    audios: string[];
    images: string[];
    roadmap: string | null;
  }>(),
  aiPreferences: json("ai_preferences")
    .$type<{
      tone: string;
      interactivity: string;
      examples: string;
      pacing: string;
    }>()
    .notNull(),
  userProfileContext: json("user_profile_context")
    .$type<{
      learningArea: string;
      learningStyle: string;
      currentLevel: string;
      multipleIntelligences: string[];
      timeAvailable: string;
      preferredSchedule: string;
    }>()
    .notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  generationProgress: integer("generation_progress").default(0).notNull(),
  currentStep: integer("current_step").default(1).notNull(),
  isGenerating: boolean("is_generating").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const aiAgents = pgTable("ai_agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: varchar("agent_id", { length: 100 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  specialty: varchar("specialty", { length: 255 }).notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const generationSteps = pgTable("generation_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .references(() => courseGenerationRequests.id, { onDelete: "cascade" })
    .notNull(),
  stepNumber: integer("step_number").notNull(),
  stepName: varchar("step_name", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  agentId: varchar("agent_id", { length: 100 }).references(
    () => aiAgents.agentId
  ),
  input: json("input"),
  output: json("output"),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const youtubeVideos = pgTable("youtube_videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  youtubeId: varchar("youtube_id", { length: 255 }).unique().notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  channelTitle: varchar("channel_title", { length: 255 }),
  duration: varchar("duration", { length: 50 }),
  views: integer("views"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const coursesRelations = relations(courses, ({ many }) => ({
  modules: many(modules),
  userCourses: many(userCourses),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  contentItems: many(contentItems),
}));

export const contentItemsRelations = relations(contentItems, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [contentItems.lessonId],
    references: [lessons.id],
  }),
}));

export const userCoursesRelations = relations(userCourses, ({ one }) => ({
  user: one(users, {
    fields: [userCourses.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [userCourses.courseId],
    references: [courses.id],
  }),
}));

export const courseGenerationRequestsRelations = relations(
  courseGenerationRequests,
  ({ one, many }) => ({
    user: one(users, {
      fields: [courseGenerationRequests.userId],
      references: [users.id],
    }),
    course: one(courses, {
      fields: [courseGenerationRequests.courseId],
      references: [courses.id],
    }),
    generationSteps: many(generationSteps),
  })
);

export const generationStepsRelations = relations(
  generationSteps,
  ({ one }) => ({
    request: one(courseGenerationRequests, {
      fields: [generationSteps.requestId],
      references: [courseGenerationRequests.id],
    }),
    agent: one(aiAgents, {
      fields: [generationSteps.agentId],
      references: [aiAgents.agentId],
    }),
  })
);

export const aiAgentsRelations = relations(aiAgents, ({ many }) => ({
  generationSteps: many(generationSteps),
}));

export const youtubeVideosRelations = relations(youtubeVideos, ({ many }) => ({
  lessonVideos: many(lessonVideos),
}));

export const insertCourseSchema = createInsertSchema(courses);
export const selectCourseSchema = createSelectSchema(courses);
export const insertModuleSchema = createInsertSchema(modules);
export const selectModuleSchema = createSelectSchema(modules);
export const insertLessonSchema = createInsertSchema(lessons);
export const selectLessonSchema = createSelectSchema(lessons);
export const insertContentItemSchema = createInsertSchema(contentItems);
export const selectContentItemSchema = createSelectSchema(contentItems);
export const insertUserCourseSchema = createInsertSchema(userCourses);
export const selectUserCourseSchema = createSelectSchema(userCourses);
export const insertCourseGenerationRequestSchema = createInsertSchema(
  courseGenerationRequests
);
export const selectCourseGenerationRequestSchema = createSelectSchema(
  courseGenerationRequests
);
export const insertAiAgentSchema = createInsertSchema(aiAgents);
export const selectAiAgentSchema = createSelectSchema(aiAgents);
export const insertGenerationStepSchema = createInsertSchema(generationSteps);
export const selectGenerationStepSchema = createSelectSchema(generationSteps);
export const insertYoutubeVideoSchema = createInsertSchema(youtubeVideos);
export const selectYoutubeVideoSchema = createSelectSchema(youtubeVideos);

// Zod schemas for validation
export const courseGenerationInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  goals: z.array(
    z.enum([
      "career",
      "skill",
      "hobby",
      "certification",
      "business",
      "teaching",
    ])
  ),
  duration: z.enum(["1-week", "1-month", "3-months", "6-months"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  format: z.array(
    z.enum([
      "video",
      "audio",
      "text",
      "interactive",
      "practical",
      "visual",
      "presentation",
      "quiz",
    ])
  ),
  structure: z.object({
    modules: z.number().min(1).max(20),
    lessonsPerModule: z.number().min(1).max(10),
    assessments: z.boolean(),
    projects: z.boolean(),
  }),
  materials: z
    .object({
      documents: z.array(z.string()).optional(),
      videos: z.array(z.string()).optional(),
      audios: z.array(z.string()).optional(),
      images: z.array(z.string()).optional(),
      roadmap: z.string().optional(),
    })
    .optional(),
  aiPreferences: z
    .object({
      tone: z.enum(["professional", "friendly", "energetic"]),
      interactivity: z.enum(["high", "medium", "low"]),
      examples: z.string(),
      pacing: z.string(),
    })
    .optional(),
  userProfileContext: z.object({
    learningArea: z.enum([
      "technology",
      "business",
      "science",
      "arts",
      "languages",
      "health",
      "education",
      "others",
    ]),
    learningStyle: z.enum(["visual", "auditory", "kinesthetic", "reading"]),
    currentLevel: z.enum(["beginner", "intermediate", "advanced"]),
    multipleIntelligences: z.array(z.string()),
    timeAvailable: z.string(),
    preferredSchedule: z.string(),
  }),
});

export const courseStructureSchema = z.object({
  title: z.string(),
  description: z.string(),
  modules: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      orderIndex: z.number(),
      lessons: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          orderIndex: z.number(),
          estimatedDuration: z.string(),
          contentTypes: z.array(z.string()),
        })
      ),
    })
  ),
  estimatedTotalDuration: z.string(),
  prerequisites: z.array(z.string()),
  learningObjectives: z.array(z.string()),
});

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
export type ContentItem = typeof contentItems.$inferSelect;
export type NewContentItem = typeof contentItems.$inferInsert;
export type UserCourse = typeof userCourses.$inferSelect;
export type NewUserCourse = typeof userCourses.$inferInsert;
export type CourseGenerationRequest =
  typeof courseGenerationRequests.$inferSelect;
export type NewCourseGenerationRequest =
  typeof courseGenerationRequests.$inferInsert;
export type AiAgent = typeof aiAgents.$inferSelect;
export type NewAiAgent = typeof aiAgents.$inferInsert;
export type GenerationStep = typeof generationSteps.$inferSelect;
export type NewGenerationStep = typeof generationSteps.$inferInsert;
export type YoutubeVideo = typeof youtubeVideos.$inferSelect;
export type NewYoutubeVideo = typeof youtubeVideos.$inferInsert;
export type CourseGenerationInput = z.infer<typeof courseGenerationInputSchema>;
export type CourseStructure = z.infer<typeof courseStructureSchema>;

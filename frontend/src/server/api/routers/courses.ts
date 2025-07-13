import { z } from "zod";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  courses,
  modules,
  lessons,
  contentItems,
  userCourses,
  userProgress,
  flashcards,
  userInteractions,
} from "~/server/db/schemas";
import {
  calculateNextReview,
  getInitialReviewSchedule,
} from "~/server/services/spaced-repetition";

// Helper function to get course progress data
async function getCourseProgressData(
  ctx: { db: typeof import("~/server/db").db },
  input: { courseId: string; userId: string }
) {
  // Get total content items in course
  const totalContentItems = await ctx.db
    .select({ count: sql`count(*)` })
    .from(contentItems)
    .innerJoin(lessons, eq(contentItems.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(eq(modules.courseId, input.courseId));

  // Get completed content items
  const completedItems = await ctx.db
    .select({ count: sql`count(*)` })
    .from(userProgress)
    .innerJoin(
      contentItems,
      eq(userProgress.contentItemId, contentItems.id),
    )
    .innerJoin(lessons, eq(contentItems.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(
      and(
        eq(modules.courseId, input.courseId),
        eq(userProgress.userId, input.userId),
        eq(userProgress.status, "completed"),
      ),
    );

  // Get due flashcards for this course
  const dueFlashcards = await ctx.db
    .select({ count: sql`count(*)` })
    .from(userProgress)
    .innerJoin(
      flashcards,
      eq(userProgress.contentItemId, flashcards.contentItemId),
    )
    .innerJoin(contentItems, eq(flashcards.contentItemId, contentItems.id))
    .innerJoin(lessons, eq(contentItems.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(
      and(
        eq(modules.courseId, input.courseId),
        eq(userProgress.userId, input.userId),
        sql`${userProgress.nextReviewAt} <= NOW()`,
        eq(userProgress.status, "completed"),
      ),
    );

  const total = Number(totalContentItems[0]?.count) || 0;
  const completed = Number(completedItems[0]?.count) || 0;
  const due = Number(dueFlashcards[0]?.count) || 0;

  return {
    totalContentItems: total,
    completedContentItems: completed,
    progressPercentage:
      total > 0 ? Math.round((completed / total) * 100) : 0,
    dueFlashcards: due,
  };
}

export const coursesRouter = createTRPCRouter({
  // Get all courses for a user
  getUserCourses: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userCoursesData = await ctx.db
        .select({
          id: userCourses.id,
          enrolledAt: userCourses.enrolledAt,
          lastAccessedAt: userCourses.lastAccessedAt,
          progressPercentage: userCourses.progressPercentage,
          course: {
            id: courses.id,
            title: courses.title,
            description: courses.description,
            status: courses.status,
            createdAt: courses.createdAt,
          },
        })
        .from(userCourses)
        .innerJoin(courses, eq(userCourses.courseId, courses.id))
        .where(eq(userCourses.userId, input.userId))
        .orderBy(desc(userCourses.lastAccessedAt));

      return userCoursesData;
    }),

  // Get detailed course structure with progress
  getCourseWithProgress: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get course basic info
      const course = await ctx.db
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))
        .limit(1);

      if (!course[0]) {
        throw new Error("Course not found");
      }

      // Get modules with lessons and content items
      const moduleData = await ctx.db
        .select({
          module: {
            id: modules.id,
            title: modules.title,
            description: modules.description,
            orderIndex: modules.orderIndex,
          },
          lesson: {
            id: lessons.id,
            title: lessons.title,
            description: lessons.description,
            orderIndex: lessons.orderIndex,
          },
          contentItem: {
            id: contentItems.id,
            title: contentItems.title,
            contentType: contentItems.contentType,
            orderIndex: contentItems.orderIndex,
          },
          progress: {
            id: userProgress.id,
            status: userProgress.status,
            attempts: userProgress.attempts,
            score: userProgress.score,
            nextReviewAt: userProgress.nextReviewAt,
            spacedRepetitionInterval: userProgress.spacedRepetitionInterval,
          },
        })
        .from(modules)
        .innerJoin(lessons, eq(modules.id, lessons.moduleId))
        .innerJoin(contentItems, eq(lessons.id, contentItems.lessonId))
        .leftJoin(
          userProgress,
          and(
            eq(userProgress.contentItemId, contentItems.id),
            eq(userProgress.userId, input.userId),
          ),
        )
        .where(eq(modules.courseId, input.courseId))
        .orderBy(
          modules.orderIndex,
          lessons.orderIndex,
          contentItems.orderIndex,
        );

      // Structure the data hierarchically
      const moduleMap = new Map();

      moduleData.forEach((row) => {
        if (!moduleMap.has(row.module.id)) {
          moduleMap.set(row.module.id, {
            ...row.module,
            lessons: new Map(),
          });
        }

        const module = moduleMap.get(row.module.id);
        if (!module.lessons.has(row.lesson.id)) {
          module.lessons.set(row.lesson.id, {
            ...row.lesson,
            contentItems: [],
          });
        }

        const lesson = module.lessons.get(row.lesson.id);
        lesson.contentItems.push({
          ...row.contentItem,
          progress: row.progress,
        });
      });

      // Convert maps to arrays
      const structuredModules = Array.from(moduleMap.values()).map(
        (module) => ({
          ...module,
          lessons: Array.from(module.lessons.values()),
        }),
      );

      return {
        course: course[0],
        modules: structuredModules,
      };
    }),

  // Mark content item as completed and trigger spaced repetition
  completeContentItem: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        contentItemId: z.string(),
        score: z.number().optional(),
        timeSpent: z.number().optional(), // in seconds
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Update or create progress record
      const existingProgress = await ctx.db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, input.userId),
            eq(userProgress.contentItemId, input.contentItemId),
          ),
        )
        .limit(1);

      const now = new Date();
      const { nextReviewAt, nextInterval } = getInitialReviewSchedule();

      if (existingProgress.length > 0) {
        const currentProgress = existingProgress[0]!;
        await ctx.db
          .update(userProgress)
          .set({
            status: "completed",
            score: input.score || currentProgress.score,
            attempts: (currentProgress.attempts || 0) + 1,
            lastAttemptAt: now,
            nextReviewAt,
            spacedRepetitionInterval: nextInterval,
            updatedAt: now,
          })
          .where(eq(userProgress.id, currentProgress.id));
      } else {
        await ctx.db.insert(userProgress).values({
          userId: input.userId,
          contentItemId: input.contentItemId,
          status: "completed",
          score: input.score || 1.0,
          attempts: 1,
          lastAttemptAt: now,
          nextReviewAt,
          spacedRepetitionInterval: nextInterval,
        });
      }

      // Record interaction
      await ctx.db.insert(userInteractions).values({
        userId: input.userId,
        contentItemId: input.contentItemId,
        interactionType: "content_completed",
        interactionData: {
          score: input.score,
          timeSpent: input.timeSpent,
          completedAt: now.toISOString(),
        },
      });

      // Check if there are flashcards for this content item
      const flashcardsCount = await ctx.db
        .select({ count: sql`count(*)` })
        .from(flashcards)
        .where(eq(flashcards.contentItemId, input.contentItemId));

      return {
        success: true,
        hasFlashcards: Number(flashcardsCount[0]?.count) > 0,
        nextReviewAt,
      };
    }),

  // Complete module and initialize spaced repetition for all flashcards
  completeModule: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        moduleId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get all content items in the module
      const contentItemsInModule = await ctx.db
        .select({
          id: contentItems.id,
          hasFlashcards: sql`COUNT(${flashcards.id}) > 0`.as("hasFlashcards"),
        })
        .from(contentItems)
        .innerJoin(lessons, eq(contentItems.lessonId, lessons.id))
        .leftJoin(flashcards, eq(flashcards.contentItemId, contentItems.id))
        .where(eq(lessons.moduleId, input.moduleId))
        .groupBy(contentItems.id);

      // Get flashcards for the module
      const moduleFlashcards = await ctx.db
        .select({
          flashcardId: flashcards.id,
          contentItemId: flashcards.contentItemId,
        })
        .from(flashcards)
        .innerJoin(contentItems, eq(flashcards.contentItemId, contentItems.id))
        .innerJoin(lessons, eq(contentItems.lessonId, lessons.id))
        .where(eq(lessons.moduleId, input.moduleId));

      // Check existing progress for flashcards
      const existingFlashcardProgress = await ctx.db
        .select({ contentItemId: userProgress.contentItemId })
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, input.userId),
            sql`${userProgress.contentItemId} IN (${moduleFlashcards.map((f) => `'${f.contentItemId}'`).join(",")})`,
          ),
        );

      const existingContentItems = new Set(
        existingFlashcardProgress.map((p) => p.contentItemId),
      );

      // Create initial progress records for new flashcards
      const newFlashcardProgress = moduleFlashcards
        .filter((fc) => !existingContentItems.has(fc.contentItemId))
        .map((fc) => ({
          userId: input.userId,
          contentItemId: fc.contentItemId,
          status: "not_started" as const,
          attempts: 0,
          spacedRepetitionInterval: 1,
          nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        }));

      if (newFlashcardProgress.length > 0) {
        await ctx.db.insert(userProgress).values(newFlashcardProgress);
      }

      // Update course progress (will be implemented separately)
      // await this.updateCourseProgress(ctx, input.userId, input.moduleId);

      // Record module completion interaction
      await ctx.db.insert(userInteractions).values({
        userId: input.userId,
        contentItemId: contentItemsInModule[0]?.id || "", // Use first content item as reference
        interactionType: "module_completed",
        interactionData: {
          moduleId: input.moduleId,
          completedAt: new Date().toISOString(),
          flashcardsInitialized: newFlashcardProgress.length,
        },
      });

      return {
        success: true,
        flashcardsInitialized: newFlashcardProgress.length,
        totalFlashcards: moduleFlashcards.length,
      };
    }),

  // Get course progress summary
  getCourseProgress: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await getCourseProgressData(ctx, input);
    }),

  // Helper function to update course progress
  updateCourseProgress: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        courseId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const progress = await getCourseProgressData(ctx, input);

      // Update user course progress
      await ctx.db
        .update(userCourses)
        .set({
          progressPercentage: progress.progressPercentage / 100,
          lastAccessedAt: new Date(),
        })
        .where(
          and(
            eq(userCourses.userId, input.userId),
            eq(userCourses.courseId, input.courseId),
          ),
        );

      return progress;
    }),
});

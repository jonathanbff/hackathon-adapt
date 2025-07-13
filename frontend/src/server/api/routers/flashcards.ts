import { z } from "zod";
import { eq, and, lte, desc, asc } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  flashcards,
  userProgress,
  userInteractions,
  contentItems,
  lessons,
  modules,
} from "~/server/db/schemas";
import {
  calculateNextReview,
  getInitialReviewSchedule,
  type PerformanceRating,
} from "~/server/services/spaced-repetition";

export const flashcardsRouter = createTRPCRouter({
  // Get flashcards for a specific content item
  getFlashcardsForContent: publicProcedure
    .input(
      z.object({
        contentItemId: z.string(),
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const cards = await ctx.db
        .select({
          id: flashcards.id,
          frontContent: flashcards.frontContent,
          backContent: flashcards.backContent,
          createdAt: flashcards.createdAt,
          progress: {
            id: userProgress.id,
            status: userProgress.status,
            attempts: userProgress.attempts,
            score: userProgress.score,
            nextReviewAt: userProgress.nextReviewAt,
            spacedRepetitionInterval: userProgress.spacedRepetitionInterval,
          },
        })
        .from(flashcards)
        .leftJoin(
          userProgress,
          and(
            eq(userProgress.contentItemId, flashcards.contentItemId),
            eq(userProgress.userId, input.userId),
          ),
        )
        .where(eq(flashcards.contentItemId, input.contentItemId))
        .orderBy(flashcards.createdAt);

      return cards;
    }),

  // Get flashcards for a module (all content items within the module)
  getFlashcardsForModule: publicProcedure
    .input(
      z.object({
        moduleId: z.string(),
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const cards = await ctx.db
        .select({
          id: flashcards.id,
          contentItemId: flashcards.contentItemId,
          frontContent: flashcards.frontContent,
          backContent: flashcards.backContent,
          createdAt: flashcards.createdAt,
          contentItem: {
            id: contentItems.id,
            title: contentItems.title,
            lessonId: contentItems.lessonId,
          },
          lesson: {
            id: lessons.id,
            title: lessons.title,
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
        .from(flashcards)
        .innerJoin(contentItems, eq(flashcards.contentItemId, contentItems.id))
        .innerJoin(lessons, eq(contentItems.lessonId, lessons.id))
        .leftJoin(
          userProgress,
          and(
            eq(userProgress.contentItemId, flashcards.contentItemId),
            eq(userProgress.userId, input.userId),
          ),
        )
        .where(eq(lessons.moduleId, input.moduleId))
        .orderBy(
          lessons.orderIndex,
          contentItems.orderIndex,
          flashcards.createdAt,
        );

      return cards;
    }),

  // Get due flashcards for review
  getDueFlashcards: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const now = new Date();

      const dueCards = await ctx.db
        .select({
          id: flashcards.id,
          contentItemId: flashcards.contentItemId,
          frontContent: flashcards.frontContent,
          backContent: flashcards.backContent,
          contentItem: {
            id: contentItems.id,
            title: contentItems.title,
            lessonId: contentItems.lessonId,
          },
          lesson: {
            id: lessons.id,
            title: lessons.title,
            moduleId: lessons.moduleId,
          },
          module: {
            id: modules.id,
            title: modules.title,
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
        .from(flashcards)
        .innerJoin(contentItems, eq(flashcards.contentItemId, contentItems.id))
        .innerJoin(lessons, eq(contentItems.lessonId, lessons.id))
        .innerJoin(modules, eq(lessons.moduleId, modules.id))
        .innerJoin(
          userProgress,
          and(
            eq(userProgress.contentItemId, flashcards.contentItemId),
            eq(userProgress.userId, input.userId),
          ),
        )
        .where(
          and(
            lte(userProgress.nextReviewAt, now),
            eq(userProgress.status, "completed"),
          ),
        )
        .orderBy(asc(userProgress.nextReviewAt));

      return dueCards;
    }),

  // Submit flashcard answer and update spaced repetition
  submitFlashcardAnswer: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        contentItemId: z.string(),
        flashcardId: z.string(),
        performance: z.enum(["easy", "medium", "hard", "failed"]),
        timeSpent: z.number().optional(), // in seconds
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get current progress
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

      const currentInterval =
        existingProgress[0]?.spacedRepetitionInterval || 1;
      const currentAttempts = existingProgress[0]?.attempts || 0;

      // Calculate next review date using spaced repetition utility
      const { nextInterval, nextReviewAt } = calculateNextReview(
        currentInterval,
        input.performance as PerformanceRating,
      );

      // Calculate score based on performance
      const performanceScore = {
        failed: 0,
        hard: 0.6,
        medium: 0.8,
        easy: 1.0,
      }[input.performance];

      // Update or create progress record
      if (existingProgress.length > 0) {
        await ctx.db
          .update(userProgress)
          .set({
            attempts: currentAttempts + 1,
            score: performanceScore,
            lastAttemptAt: new Date(),
            nextReviewAt,
            spacedRepetitionInterval: nextInterval,
            status: "completed",
            updatedAt: new Date(),
          })
          .where(eq(userProgress.id, existingProgress[0].id));
      } else {
        await ctx.db.insert(userProgress).values({
          userId: input.userId,
          contentItemId: input.contentItemId,
          attempts: 1,
          score: performanceScore,
          lastAttemptAt: new Date(),
          nextReviewAt,
          spacedRepetitionInterval: nextInterval,
          status: "completed",
        });
      }

      // Record interaction
      await ctx.db.insert(userInteractions).values({
        userId: input.userId,
        contentItemId: input.contentItemId,
        interactionType: "flashcard_answer",
        interactionData: {
          flashcardId: input.flashcardId,
          performance: input.performance,
          timeSpent: input.timeSpent,
          nextReviewAt: nextReviewAt.toISOString(),
          interval: nextInterval,
        },
      });

      return {
        success: true,
        nextReviewAt,
        interval: nextInterval,
        score: performanceScore,
      };
    }),

  // Get flashcard statistics for a user
  getFlashcardStats: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const now = new Date();

      // Get total flashcards studied
      const totalStudied = await ctx.db
        .select({ count: userProgress.id })
        .from(userProgress)
        .innerJoin(
          flashcards,
          eq(userProgress.contentItemId, flashcards.contentItemId),
        )
        .where(eq(userProgress.userId, input.userId));

      // Get due flashcards count
      const dueCount = await ctx.db
        .select({ count: userProgress.id })
        .from(userProgress)
        .innerJoin(
          flashcards,
          eq(userProgress.contentItemId, flashcards.contentItemId),
        )
        .where(
          and(
            eq(userProgress.userId, input.userId),
            lte(userProgress.nextReviewAt, now),
            eq(userProgress.status, "completed"),
          ),
        );

      // Get recent interactions
      const recentInteractions = await ctx.db
        .select({
          id: userInteractions.id,
          interactionType: userInteractions.interactionType,
          interactionData: userInteractions.interactionData,
          createdAt: userInteractions.createdAt,
          contentItem: {
            id: contentItems.id,
            title: contentItems.title,
          },
        })
        .from(userInteractions)
        .innerJoin(
          contentItems,
          eq(userInteractions.contentItemId, contentItems.id),
        )
        .where(
          and(
            eq(userInteractions.userId, input.userId),
            eq(userInteractions.interactionType, "flashcard_answer"),
          ),
        )
        .orderBy(desc(userInteractions.createdAt))
        .limit(10);

      return {
        totalStudied: totalStudied.length,
        dueCount: dueCount.length,
        recentInteractions,
      };
    }),

  // Initialize spaced repetition for completed modules
  initializeSpacedRepetition: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        moduleId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get all flashcards in the module
      const moduleFlashcards = await ctx.db
        .select({
          flashcardId: flashcards.id,
          contentItemId: flashcards.contentItemId,
        })
        .from(flashcards)
        .innerJoin(contentItems, eq(flashcards.contentItemId, contentItems.id))
        .innerJoin(lessons, eq(contentItems.lessonId, lessons.id))
        .where(eq(lessons.moduleId, input.moduleId));

      // Check existing progress
      const existingProgress = await ctx.db
        .select({ contentItemId: userProgress.contentItemId })
        .from(userProgress)
        .where(eq(userProgress.userId, input.userId));

      const existingContentItems = new Set(
        existingProgress.map((p) => p.contentItemId),
      );

      // Create initial progress records for new flashcards
      const { nextReviewAt, nextInterval } = getInitialReviewSchedule();
      const newProgressRecords = moduleFlashcards
        .filter((fc) => !existingContentItems.has(fc.contentItemId))
        .map((fc) => ({
          userId: input.userId,
          contentItemId: fc.contentItemId,
          status: "not_started" as const,
          attempts: 0,
          spacedRepetitionInterval: nextInterval,
          nextReviewAt,
        }));

      if (newProgressRecords.length > 0) {
        await ctx.db.insert(userProgress).values(newProgressRecords);
      }

      return {
        success: true,
        initializedCount: newProgressRecords.length,
        totalFlashcards: moduleFlashcards.length,
      };
    }),
});

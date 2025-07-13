import { logger, schemaTask, tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { db } from "../../db/connection";
import { courses, modules, lessons } from "../../db/schemas";
import { eq } from "drizzle-orm";
import { generateLessonBatchTask } from "./generate-lesson-batch";

export const generateMoreLessonsTask = schemaTask({
  id: "course-generation.generate-more-lessons",
  schema: z.object({
    userId: z.string(),
    courseId: z.string().uuid(),
    moduleId: z.string().uuid(),
    startFromIndex: z.number().describe("Start generating from this lesson index"),
    count: z.number().default(2).describe("Number of lessons to generate"),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async ({ userId, courseId, moduleId, startFromIndex, count }) => {
    logger.log("Starting on-demand lesson generation", {
      userId,
      courseId,
      moduleId,
      startFromIndex,
      count,
    });

    try {
      // Get course details
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId),
        with: {
          modules: {
            where: eq(modules.id, moduleId),
            with: {
              lessons: true,
            },
          },
        },
      });

      if (!course) {
        throw new Error(`Course not found: ${courseId}`);
      }

      const module = course.modules[0];
      if (!module) {
        throw new Error(`Module not found: ${moduleId}`);
      }

      // Get the lessons that need to be generated
      const allLessons = await db.query.lessons.findMany({
        where: eq(lessons.moduleId, moduleId),
        orderBy: (lessons, { asc }) => [asc(lessons.orderIndex)],
      });

      const lessonsToGenerate = allLessons.slice(startFromIndex, startFromIndex + count);

      if (lessonsToGenerate.length === 0) {
        logger.log("No lessons to generate", {
          moduleId,
          startFromIndex,
          availableLessons: allLessons.length,
        });
        return {
          lessonsGenerated: [],
          message: "No lessons found to generate",
        };
      }

      logger.log("Generating lessons", {
        moduleId,
        lessonsToGenerate: lessonsToGenerate.map(l => ({ id: l.id, title: l.title })),
      });

      // Use the batch generation task
      const lessonBatchResult = await tasks.triggerAndWait(
        "course-generation.generate-lesson-batch",
        {
          userId,
          courseId,
          lessons: lessonsToGenerate.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description || "",
            orderIndex: lesson.orderIndex,
          })),
          moduleContext: {
            title: module.title,
            description: module.description || "",
          },
          courseSettings: {
            title: course.title,
            difficulty: course.difficulty || "beginner",
            userProfileContext: {
              learningArea: "technology", // Default values - you might want to store these in the course
              learningStyle: "visual",
              currentLevel: "beginner",
            },
            aiPreferences: {
              tone: "professional",
              examples: "practical examples",
              pacing: "moderate",
            },
          },
        }
      );

      if (!lessonBatchResult.ok) {
        throw new Error(`Lesson batch generation failed: ${lessonBatchResult.error}`);
      }

      logger.log("On-demand lesson generation completed", {
        userId,
        courseId,
        moduleId,
        generatedLessons: lessonBatchResult.output.lessonsGenerated.length,
      });

      return {
        lessonsGenerated: lessonBatchResult.output.lessonsGenerated,
        moduleTitle: module.title,
        nextStartIndex: startFromIndex + count,
        hasMoreLessons: startFromIndex + count < allLessons.length,
      };

    } catch (error) {
      logger.error("On-demand lesson generation failed", {
        userId,
        courseId,
        moduleId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
}); 
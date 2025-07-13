import { logger, schemaTask, tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { db } from "../../db/connection";
import {
  courses,
  modules,
  lessons,
  courseGenerationRequests,
} from "../../db/schemas";
import { eq } from "drizzle-orm";
import { generateLessonBatchTask } from "./generate-lesson-batch";
import { validateGenerationRequestTask } from "./00-validate-generation-request";
import { createCourseStructureTask } from "./01-create-course-structure";
import { finalizeCourseTask } from "./06-finalize-course";

export const generateEntireCourseTask = schemaTask({
  id: "course-generation.generate-entire-course",
  schema: z.object({
    userId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    difficulty: z
      .enum(["beginner", "intermediate", "advanced"])
      .default("beginner"),
    duration: z.string().default("4 weeks"),
    goals: z.array(z.string()).default([]),
    learningArea: z.string().default("technology"),
    learningStyle: z.string().default("visual"),
    currentLevel: z.string().default("beginner"),
    moduleCount: z.number().default(4),
    lessonsPerModule: z.number().default(4),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async ({
    userId,
    title,
    description,
    difficulty,
    duration,
    goals,
    learningArea,
    learningStyle,
    currentLevel,
    moduleCount,
    lessonsPerModule,
  }) => {
    logger.log("Starting complete course generation", {
      userId,
      title,
      difficulty,
      duration,
      moduleCount,
      lessonsPerModule,
    });

    try {
      const generationRequest = {
        title,
        description: description || `A comprehensive course on ${title}`,
        difficulty,
        duration,
        goals,
        learningArea,
        learningStyle,
        currentLevel,
        structure: {
          modules: moduleCount,
          lessonsPerModule,
          assessments: true,
          projects: true,
        },
      };

      logger.log("Step 1: Validating generation request");
      const validationResult = await tasks.triggerAndWait(
        "course-generation.validate-request",
        {
          userId,
          generationRequest,
        },
      );

      if (!validationResult.ok) {
        throw new Error(`Validation failed: ${validationResult.error}`);
      }

      const courseSettings = validationResult.output.courseSettings;
      logger.log("Generation request validated successfully", {
        courseSettings: courseSettings.title,
      });

      logger.log("Step 2: Creating course structure");
      const structureResult = await tasks.triggerAndWait(
        "course-generation.create-structure",
        {
          userId,
          courseSettings,
        },
      );

      if (!structureResult.ok) {
        throw new Error(
          `Course structure creation failed: ${structureResult.error}`,
        );
      }

      const courseStructure = structureResult.output.courseStructure;
      const courseId = structureResult.output.courseId;
      logger.log("Course structure created successfully", {
        courseId: courseId,
        modulesCount: courseStructure.modules.length,
      });

      logger.log("Step 3: Generating all modules with lessons");
      const moduleResults = [];

      for (const module of courseStructure.modules) {
        logger.log(`Generating lessons for module: ${module.title}`);

        const lessonBatchResult = await tasks.triggerAndWait(
          "course-generation.generate-lesson-batch",
          {
            userId,
            courseId: courseId,
            lessons: module.lessons,
            moduleContext: {
              title: module.title,
              description: module.description,
            },
            courseSettings: {
              title: courseSettings.title,
              difficulty: courseSettings.difficulty,
              format: courseSettings.format,
              userProfileContext: courseSettings.userProfileContext,
              aiPreferences: courseSettings.aiPreferences,
            },
          },
        );

        if (!lessonBatchResult.ok) {
          throw new Error(
            `Lesson generation failed for module ${module.title}: ${lessonBatchResult.error}`,
          );
        }

        const moduleResult = {
          moduleId: module.id,
          moduleTitle: module.title,
          ...lessonBatchResult.output,
        };

        moduleResults.push(moduleResult);
      }

      logger.log("All modules generated successfully", {
        modulesGenerated: moduleResults.length,
        totalLessonsGenerated: moduleResults.reduce(
          (total, module) => total + module.totalLessons,
          0,
        ),
      });

      logger.log("Step 4: Finalizing course");

      // Aggregate results from all modules
      const contentResults = moduleResults.flatMap(
        (module) => module.lessonsGenerated || [],
      );
      const videoResults = moduleResults.flatMap(
        (module) =>
          module.lessonsGenerated?.map((lesson) => ({
            videoAttached: lesson.videoAttached,
            videoTitle: lesson.videoTitle,
            videoId: lesson.videoId,
          })) || [],
      );
      const quizResults = moduleResults.flatMap(
        (module) =>
          module.lessonsGenerated?.map((lesson) => ({
            quizGenerated: lesson.questionsCount > 0,
            questionsCount: lesson.questionsCount,
          })) || [],
      );
      const exampleResults = moduleResults.flatMap(
        (module) =>
          module.lessonsGenerated?.map((lesson) => ({
            examplesCount: lesson.examplesCount,
          })) || [],
      );
      const flashcardResults = moduleResults.flatMap(
        (module) =>
          module.lessonsGenerated?.map((lesson) => ({
            flashcardsCount: lesson.flashcardsCount || 0,
          })) || [],
      );

      // For now, we don't have explicit failure tracking from lesson batch,
      // but we can add it later if needed
      const failedLessons: any[] = [];
      const failedVideos: any[] = [];
      const failedQuizzes: any[] = [];
      const failedExamples: any[] = [];
      const failedFlashcards: any[] = [];

      const finalizeResult = await tasks.triggerAndWait(
        "course-generation.finalize-course",
        {
          userId,
          courseId: courseId,
          courseStructure: {
            ...courseStructure,
            modules: courseStructure.modules.map((module: any) => ({
              ...module,
              isGenerated: true,
            })),
          },
          courseSettings,
          contentResults,
          videoResults,
          quizResults,
          exampleResults,
          failedLessons,
          failedVideos,
          failedQuizzes,
          failedExamples,
          flashcardResults,
          failedFlashcards,
        },
      );

      if (!finalizeResult.ok) {
        throw new Error(`Course finalization failed: ${finalizeResult.error}`);
      }

      logger.log("Complete course generation finished successfully", {
        userId,
        courseId: courseId,
        totalModules: courseStructure.modules.length,
        totalLessonsGenerated: moduleResults.reduce(
          (total, module) => total + module.totalLessons,
          0,
        ),
      });

      return {
        success: true,
        courseId: courseId,
        courseTitle: courseSettings.title,
        totalModules: courseStructure.modules.length,
        totalLessonsGenerated: moduleResults.reduce(
          (total, module) => total + module.totalLessons,
          0,
        ),
        moduleResults,
        generationStatus: "completed",
      };
    } catch (error) {
      logger.error("Complete course generation failed", {
        userId,
        title,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});

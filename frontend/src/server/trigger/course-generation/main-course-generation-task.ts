import { logger, schemaTask, tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { courseGenerationInputSchema } from "~/server/db/schemas";
import { validateGenerationRequestTask } from "./00-validate-generation-request";
import { createCourseStructureTask } from "./01-create-course-structure";
import { generateLessonBatchTask } from "./generate-lesson-batch";
import { finalizeCourseTask } from "./06-finalize-course";

export const mainCourseGenerationTask = schemaTask({
  id: "course-generation.main",
  schema: z.object({
    userId: z.string(),
    generationRequest: courseGenerationInputSchema,
  }),
  retry: {
    maxAttempts: 1,
  },
  run: async ({ userId, generationRequest }) => {
    logger.log("Starting progressive course generation pipeline", {
      userId,
      title: generationRequest.title,
      goals: generationRequest.goals,
      duration: generationRequest.duration,
      difficulty: generationRequest.difficulty,
    });

    try {
      // Step 1: Validate the generation request
      logger.log("Step 1: Validating generation request");
      const validationResult = await tasks.triggerAndWait(
        "course-generation.validate-request",
        {
          userId,
          generationRequest,
        }
      );

      if (!validationResult.ok) {
        throw new Error(`Validation failed: ${validationResult.error}`);
      }

      const courseSettings = validationResult.output.courseSettings;
      logger.log("Generation request validated successfully", {
        courseSettings: courseSettings.title,
      });

      // Step 2: Create course structure
      logger.log("Step 2: Creating course structure");
      const structureResult = await tasks.triggerAndWait(
        "course-generation.create-structure",
        {
          userId,
          courseSettings,
        }
      );

      if (!structureResult.ok) {
        throw new Error(`Course structure creation failed: ${structureResult.error}`);
      }

      const courseStructure = structureResult.output.courseStructure;
      const courseId = structureResult.output.courseId;
      logger.log("Course structure created successfully", {
        courseId: courseId,
        modulesCount: courseStructure.modules.length,
      });

      // Step 3: Generate first 2 modules with full lesson content (sequentially)
      logger.log("Step 3: Generating first 2 modules with lessons");
      const modulesToGenerate = courseStructure.modules.slice(0, 2); // Only first 2 modules
      
      const moduleResults = [];
      
      for (const module of modulesToGenerate) {
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
          }
        );

        if (!lessonBatchResult.ok) {
          throw new Error(`Lesson generation failed for module ${module.title}: ${lessonBatchResult.error}`);
        }

        const moduleResult = {
          moduleId: module.id,
          moduleTitle: module.title,
          ...lessonBatchResult.output,
        };
        
        moduleResults.push(moduleResult);
      }
      
      logger.log("First 2 modules generated successfully", {
        modulesGenerated: moduleResults.length,
        totalLessonsGenerated: moduleResults.reduce((total, module) => total + module.totalLessons, 0),
      });

      // Step 4: Finalize course (mark as partially generated)
      logger.log("Step 4: Finalizing course");
      const finalizeResult = await tasks.triggerAndWait(
        "course-generation.finalize-course",
        {
          userId,
          courseId: courseId,
          courseStructure: {
            ...courseStructure,
            modules: courseStructure.modules.map((module: any, index: number) => ({
              ...module,
              isGenerated: index < 2, // Mark first 2 modules as generated
            })),
          },
        }
      );

      if (!finalizeResult.ok) {
        throw new Error(`Course finalization failed: ${finalizeResult.error}`);
      }

      logger.log("Progressive course generation completed successfully", {
        userId,
        courseId: courseId,
        totalModules: courseStructure.modules.length,
        generatedModules: 2,
        pendingModules: courseStructure.modules.length - 2,
      });

      return {
        success: true,
        courseId: courseId,
        courseTitle: courseSettings.title,
        totalModules: courseStructure.modules.length,
        generatedModules: 2,
        pendingModules: courseStructure.modules.length - 2,
        moduleResults,
        generationStatus: "partially_generated",
      };

    } catch (error) {
      logger.error("Course generation failed", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
}); 
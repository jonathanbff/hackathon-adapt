import { schemaTask, tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { metadata } from "@trigger.dev/sdk/v3";
import { courseGenerationInputSchema } from "~/server/db/schemas";
import { validateGenerationRequestTask } from "./01-validate-generation-request";
import { createCourseStructureTask } from "./02-create-course-structure";
import { generateModuleContentTask } from "./03-generate-module-content";
import { generateLessonContentTask } from "./04-generate-lesson-content";
import { generateAssessmentsTask } from "./05-generate-assessments";
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
    metadata.set("status", "validating_request");
    
    const validation = await tasks.triggerAndWait<typeof validateGenerationRequestTask>(
      "course-generation.validate-request",
      {
        userId,
        generationRequest,
      },
      {
        tags: [userId, "course-generation"],
      }
    );
    
    if (!validation.ok) {
      throw new Error(`Request validation failed: ${validation.error}`);
    }

    metadata.set("status", "creating_structure");
    
    const courseStructure = await tasks.triggerAndWait<typeof createCourseStructureTask>(
      "course-generation.create-structure",
      {
        requestId: validation.output.requestId,
        validatedData: validation.output.validatedData,
      },
      {
        tags: [userId, "course-generation"],
      }
    );
    
    if (!courseStructure.ok) {
      throw new Error(`Course structure creation failed: ${courseStructure.error}`);
    }

    metadata.set("status", "generating_module_content");
    
    const moduleContent = await tasks.triggerAndWait<typeof generateModuleContentTask>(
      "course-generation.generate-modules",
      {
        requestId: validation.output.requestId,
        courseId: courseStructure.output.courseId,
        moduleData: courseStructure.output.moduleData,
        validatedData: validation.output.validatedData,
      },
      {
        tags: [userId, "course-generation"],
      }
    );
    
    if (!moduleContent.ok) {
      throw new Error(`Module content generation failed: ${moduleContent.error}`);
    }

    metadata.set("status", "generating_lesson_content");
    
    const lessonContent = await tasks.triggerAndWait<typeof generateLessonContentTask>(
      "course-generation.generate-lessons",
      {
        requestId: validation.output.requestId,
        courseId: courseStructure.output.courseId,
        moduleData: courseStructure.output.moduleData,
        validatedData: validation.output.validatedData,
      },
      {
        tags: [userId, "course-generation"],
      }
    );
    
    if (!lessonContent.ok) {
      throw new Error(`Lesson content generation failed: ${lessonContent.error}`);
    }

    metadata.set("status", "generating_assessments");
    
    const assessments = await tasks.triggerAndWait<typeof generateAssessmentsTask>(
      "course-generation.generate-assessments",
      {
        requestId: validation.output.requestId,
        courseId: courseStructure.output.courseId,
        moduleData: courseStructure.output.moduleData,
        validatedData: validation.output.validatedData,
      },
      {
        tags: [userId, "course-generation"],
      }
    );
    
    if (!assessments.ok) {
      throw new Error(`Assessment generation failed: ${assessments.error}`);
    }

    metadata.set("status", "finalizing_course");
    
    const finalization = await tasks.triggerAndWait<typeof finalizeCourseTask>(
      "course-generation.finalize-course",
      {
        requestId: validation.output.requestId,
        courseId: courseStructure.output.courseId,
        generationResults: {
          courseStructure: {
            totalModules: courseStructure.output.totalModules,
            totalLessons: courseStructure.output.totalLessons,
          },
          moduleContent: {
            totalModules: moduleContent.output.totalModules,
          },
          lessonContent: {
            totalLessons: lessonContent.output.totalLessons,
            totalContentItems: lessonContent.output.totalContentItems,
          },
          assessments: {
            totalAssessments: assessments.output.totalAssessments,
            totalQuizQuestions: assessments.output.totalQuizQuestions,
            totalExercises: assessments.output.totalExercises,
            totalProjects: assessments.output.totalProjects,
          },
        },
      },
      {
        tags: [userId, "course-generation"],
      }
    );
    
    if (!finalization.ok) {
      throw new Error(`Course finalization failed: ${finalization.error}`);
    }

    metadata.set("status", "completed");
    
    return {
      success: true,
      courseId: finalization.output.courseId,
      courseTitle: finalization.output.courseTitle,
      courseStatus: finalization.output.courseStatus,
      completedAt: finalization.output.completedAt,
      requestId: validation.output.requestId,
      courseStats: finalization.output.courseStats,
      redirectUrl: finalization.output.redirectUrl,
      processingSteps: 6,
      message: "Course generation completed successfully",
    };
  },
}); 
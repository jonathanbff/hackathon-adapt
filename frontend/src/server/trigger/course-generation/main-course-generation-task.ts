import { schemaTask, tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { metadata } from "@trigger.dev/sdk/v3";
import { courseGenerationInputSchema } from "~/server/db/schemas";
import { generateCourseStructureTask } from "./01-generate-course-structure";
import { generateModuleContentTask } from "./02-generate-module-content";
import { generateLessonContentTask } from "./03-generate-lesson-content";
import { generateQuizAssessmentsTask } from "./04-generate-quiz-assessments";
import { finalizeAndSaveCourseTask } from "./05-finalize-and-save-course";

const courseGenerationTaskSchema = z.object({
  userId: z.string(),
  generationRequest: courseGenerationInputSchema,
});

export const mainCourseGenerationTask = schemaTask({
  id: "course-generation.main",
  schema: courseGenerationTaskSchema,
  retry: {
    maxAttempts: 2,
  },
  run: async ({ userId, generationRequest }) => {
    try {
      metadata.set("status", "initializing");
      metadata.set("userId", userId);
      metadata.set("courseTitle", generationRequest.title);

      const tags = [userId, "course-generation", generationRequest.userProfileContext.learningArea];

      // Step 1: Generate Course Structure
      metadata.set("status", "generating_course_structure");
      const courseStructureResult = await tasks.triggerAndWait<typeof generateCourseStructureTask>(
        "course-generation.structure",
        {
          userId,
          generationRequest,
        },
        { tags }
      );

      if (!courseStructureResult.ok) {
        throw new Error(`Course structure generation failed: ${courseStructureResult.error}`);
      }

      const courseStructure = courseStructureResult.output;

      // Step 2: Generate Module Content (parallel processing for efficiency)
      metadata.set("status", "generating_module_content");
      const moduleContentPromises = courseStructure.modules.map(async (module, index) => {
        return tasks.triggerAndWait<typeof generateModuleContentTask>(
          "course-generation.module-content",
          {
            userId,
            moduleInfo: module,
            courseContext: {
              title: courseStructure.title,
              description: courseStructure.description,
              difficulty: generationRequest.difficulty,
              learningArea: generationRequest.userProfileContext.learningArea,
            },
            generationRequest,
          },
          { tags: [...tags, `module-${index}`] }
        );
      });

      const moduleContentResults = await Promise.all(moduleContentPromises);
      const failedModules = moduleContentResults.filter(result => !result.ok);
      
      if (failedModules.length > 0) {
        throw new Error(`Module content generation failed for ${failedModules.length} modules`);
      }

      const moduleContents = moduleContentResults.map(result => result.output);

      // Step 3: Generate Lesson Content (hierarchical - depends on user interaction)
      metadata.set("status", "preparing_lesson_structure");
      const lessonStructure = moduleContents.map(moduleContent => ({
        moduleId: moduleContent.moduleId,
        lessons: moduleContent.lessons.map(lesson => ({
          ...lesson,
          contentGenerated: false, // Will be generated on-demand
        })),
      }));

      // Step 4: Generate Quiz and Assessments (if requested)
      let assessments = null;
      if (generationRequest.structure.assessments) {
        metadata.set("status", "generating_assessments");
        const assessmentResult = await tasks.triggerAndWait<typeof generateQuizAssessmentsTask>(
          "course-generation.assessments",
          {
            userId,
            courseStructure,
            moduleContents,
            generationRequest,
          },
          { tags }
        );

        if (!assessmentResult.ok) {
          throw new Error(`Assessment generation failed: ${assessmentResult.error}`);
        }

        assessments = assessmentResult.output;
      }

      // Step 5: Finalize and Save Course
      metadata.set("status", "finalizing_course");
      const finalCourseResult = await tasks.triggerAndWait<typeof finalizeAndSaveCourseTask>(
        "course-generation.finalize",
        {
          userId,
          courseStructure,
          moduleContents,
          lessonStructure,
          assessments,
          generationRequest,
        },
        { tags }
      );

      if (!finalCourseResult.ok) {
        throw new Error(`Course finalization failed: ${finalCourseResult.error}`);
      }

      metadata.set("status", "completed");
      
      return {
        success: true,
        courseId: finalCourseResult.output.courseId,
        courseTitle: courseStructure.title,
        totalModules: courseStructure.modules.length,
        totalLessons: moduleContents.reduce((sum, module) => sum + module.lessons.length, 0),
        hasAssessments: !!assessments,
        estimatedDuration: courseStructure.estimatedTotalDuration,
        generatedAt: new Date().toISOString(),
        generationSteps: [
          "Course Structure Generated",
          "Module Content Generated",
          "Lesson Structure Prepared",
          assessments ? "Assessments Generated" : "No Assessments",
          "Course Finalized and Saved",
        ],
      };

    } catch (error) {
      metadata.set("status", "failed");
      metadata.set("error", error instanceof Error ? error.message : "Unknown error");
      
      console.error("Course generation failed:", error);
      throw error;
    }
  },
});

export type CourseGenerationTaskInput = z.infer<typeof courseGenerationTaskSchema>;
export type CourseGenerationTaskOutput = {
  success: boolean;
  courseId: string;
  courseTitle: string;
  totalModules: number;
  totalLessons: number;
  hasAssessments: boolean;
  estimatedDuration: string;
  generatedAt: string;
  generationSteps: string[];
}; 
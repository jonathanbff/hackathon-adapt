import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { courses, courseGenerationRequests } from "~/server/db/schemas";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";

export const finalizeCourseTask = schemaTask({
  id: "course-generation.finalize-course",
  schema: z.object({
    requestId: z.string(),
    courseId: z.string(),
    generationResults: z.object({
      courseStructure: z.object({
        totalModules: z.number(),
        totalLessons: z.number(),
      }),
      moduleContent: z.object({
        totalModules: z.number(),
      }),
      lessonContent: z.object({
        totalLessons: z.number(),
        totalContentItems: z.number(),
      }),
      assessments: z.object({
        totalAssessments: z.number(),
        totalQuizQuestions: z.number(),
        totalExercises: z.number(),
        totalProjects: z.number(),
      }),
    }),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async ({ requestId, courseId, generationResults }) => {
    try {
      // Update progress to final step
      await db
        .update(courseGenerationRequests)
        .set({
          generationProgress: 100,
          currentStep: 6,
        })
        .where(eq(courseGenerationRequests.id, requestId));

      // Update course status to published
      const [finalizedCourse] = await db
        .update(courses)
        .set({
          status: "published",
          updatedAt: new Date(),
        })
        .where(eq(courses.id, courseId))
        .returning();

      if (!finalizedCourse) {
        throw new Error("Failed to finalize course");
      }

      // Update course generation request to completed
      const [completedRequest] = await db
        .update(courseGenerationRequests)
        .set({
          status: "completed",
          generationProgress: 100,
          currentStep: 6,
          isGenerating: false,
        })
        .where(eq(courseGenerationRequests.id, requestId))
        .returning();

      if (!completedRequest) {
        throw new Error("Failed to update course generation request");
      }

      // Calculate course statistics
      const courseStats = {
        totalModules: generationResults.courseStructure.totalModules,
        totalLessons: generationResults.lessonContent.totalLessons,
        totalContentItems: generationResults.lessonContent.totalContentItems,
        totalAssessments: generationResults.assessments.totalAssessments,
        totalQuizQuestions: generationResults.assessments.totalQuizQuestions,
        totalExercises: generationResults.assessments.totalExercises,
        totalProjects: generationResults.assessments.totalProjects,
      };

      return {
        success: true,
        courseId: finalizedCourse.id,
        courseTitle: finalizedCourse.title,
        courseStatus: finalizedCourse.status,
        completedAt: new Date(),
        requestId: completedRequest.id,
        courseStats,
        message: "Course generation completed successfully",
        redirectUrl: `/course-structure?courseId=${finalizedCourse.id}`,
      };
    } catch (error) {
      console.error("Error finalizing course:", error);
      
      // Update request status to failed
      await db
        .update(courseGenerationRequests)
        .set({
          status: "failed",
          isGenerating: false,
        })
        .where(eq(courseGenerationRequests.id, requestId));

      // Update course status to failed
      await db
        .update(courses)
        .set({
          status: "failed",
        })
        .where(eq(courses.id, courseId));

      throw new Error(`Course finalization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
}); 
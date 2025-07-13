import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { db } from "../../db/connection";
import { courses } from "../../db/schemas";
import { eq } from "drizzle-orm";

export const finalizeCourseTask = schemaTask({
  id: "course-generation.finalize-course",
  schema: z.object({
    userId: z.string(),
    courseId: z.string().uuid(),
    courseStructure: z.object({
      title: z.string(),
      description: z.string(),
      estimatedTotalDuration: z.string(),
      modules: z.array(
        z.object({
          id: z.string().uuid(),
          title: z.string(),
          description: z.string(),
          lessons: z.array(
            z.object({
              id: z.string().uuid(),
              title: z.string(),
              description: z.string(),
            })
          ),
        })
      ),
    }),
    courseSettings: z.any(),
    contentResults: z.array(z.any()).optional(),
    videoResults: z.array(z.any()).optional(),
    quizResults: z.array(z.any()).optional(),
    exampleResults: z.array(z.any()).optional(),
    failedLessons: z.array(z.any()).optional(),
    failedVideos: z.array(z.any()).optional(),
    failedQuizzes: z.array(z.any()).optional(),
    failedExamples: z.array(z.any()).optional(),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async ({ 
    userId, 
    courseId, 
    courseStructure, 
    courseSettings,
    contentResults,
    videoResults,
    quizResults,
    exampleResults,
    failedLessons,
    failedVideos,
    failedQuizzes,
    failedExamples
  }) => {
    logger.log("Finalizing course generation", {
      userId,
      courseId,
      title: courseStructure.title,
    });

    const totalLessons = courseStructure.modules.reduce((sum, module) => sum + module.lessons.length, 0);
    const successfulContent = contentResults?.length || 0;
    const videosAttached = videoResults?.filter(result => result.videoAttached).length || 0;
    const quizzesGenerated = quizResults?.filter(result => result.quizGenerated).length || 0;
    const examplesGenerated = exampleResults?.reduce((sum, result) => sum + result.examplesCount, 0) || 0;

    const totalFailed = (failedLessons?.length || 0) + 
                       (failedVideos?.length || 0) + 
                       (failedQuizzes?.length || 0) + 
                       (failedExamples?.length || 0);

    const completionPercentage = Math.round((successfulContent / totalLessons) * 100);

    await db
      .update(courses)
      .set({
        status: totalFailed > 0 ? "completed_with_errors" : "completed",
        updatedAt: new Date(),
      })
      .where(eq(courses.id, courseId));

    const generationSummary = {
      totalLessons,
      successfulContent,
      videosAttached,
      quizzesGenerated,
      examplesGenerated,
      totalFailed,
      completionPercentage,
      failedBreakdown: {
        failedLessons: failedLessons?.length || 0,
        failedVideos: failedVideos?.length || 0,
        failedQuizzes: failedQuizzes?.length || 0,
        failedExamples: failedExamples?.length || 0,
      },
    };

    logger.log("Course generation finalized successfully", {
      userId,
      courseId,
      title: courseStructure.title,
      status: totalFailed > 0 ? "completed_with_errors" : "completed",
      summary: generationSummary,
    });

    return {
      userId,
      courseId,
      courseTitle: courseStructure.title,
      courseStatus: totalFailed > 0 ? "completed_with_errors" : "completed",
      courseStructure,
      generationSummary,
    };
  },
}); 
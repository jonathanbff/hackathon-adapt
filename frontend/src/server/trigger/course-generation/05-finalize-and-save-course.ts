import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { metadata } from "@trigger.dev/sdk/v3";
import { db } from "~/server/db";
import { courses, modules, lessons, contentItems, quizzes, quizQuestions } from "~/server/db/schemas";

const finalizeCourseTaskSchema = z.object({
  userId: z.string(),
  courseStructure: z.object({
    title: z.string(),
    description: z.string(),
    modules: z.array(z.object({
      title: z.string(),
      description: z.string(),
      orderIndex: z.number(),
      lessons: z.array(z.object({
        title: z.string(),
        description: z.string(),
        orderIndex: z.number(),
        estimatedDuration: z.string(),
        contentTypes: z.array(z.string()),
      })),
    })),
    estimatedTotalDuration: z.string(),
  }),
  moduleContents: z.array(z.object({
    moduleId: z.string(),
    title: z.string(),
    description: z.string(),
    lessons: z.array(z.object({
      title: z.string(),
      description: z.string(),
      orderIndex: z.number(),
      estimatedDuration: z.string(),
      contentTypes: z.array(z.string()),
    })),
  })),
  lessonStructure: z.array(z.object({
    moduleId: z.string(),
    lessons: z.array(z.object({
      title: z.string(),
      description: z.string(),
      orderIndex: z.number(),
      contentGenerated: z.boolean(),
    })),
  })),
  assessments: z.any().optional(),
  generationRequest: z.object({
    title: z.string(),
    description: z.string().optional(),
    difficulty: z.string(),
    userProfileContext: z.object({
      learningArea: z.string(),
    }),
  }),
});

export const finalizeAndSaveCourseTask = schemaTask({
  id: "course-generation.finalize",
  schema: finalizeCourseTaskSchema,
  retry: {
    maxAttempts: 2,
  },
  run: async ({ userId, courseStructure, moduleContents, lessonStructure, assessments, generationRequest }) => {
    try {
      metadata.set("step", "finalizing_course");
      metadata.set("userId", userId);
      metadata.set("courseTitle", courseStructure.title);

      // Step 1: Create the course
      metadata.set("substep", "creating_course");
      const [course] = await db.insert(courses).values({
        title: courseStructure.title,
        description: courseStructure.description,
        status: "published",
      }).returning();

      if (!course) {
        throw new Error("Failed to create course");
      }

      // Step 2: Create modules
      metadata.set("substep", "creating_modules");
      const createdModules = await Promise.all(
        courseStructure.modules.map(async (moduleData) => {
          const [module] = await db.insert(modules).values({
            courseId: course.id,
            title: moduleData.title,
            description: moduleData.description,
            orderIndex: moduleData.orderIndex,
          }).returning();

          if (!module) {
            throw new Error(`Failed to create module: ${moduleData.title}`);
          }

          // Create lessons for this module
          const moduleLessons = moduleData.lessons;
          const createdLessons = await Promise.all(
            moduleLessons.map(async (lessonData) => {
              const [lesson] = await db.insert(lessons).values({
                moduleId: module.id,
                title: lessonData.title,
                description: lessonData.description,
                orderIndex: lessonData.orderIndex,
              }).returning();

              if (!lesson) {
                throw new Error(`Failed to create lesson: ${lessonData.title}`);
              }

              // Create content items for this lesson
              const contentTypeData = lessonData.contentTypes.map((contentType, index) => ({
                lessonId: lesson.id,
                title: `${lessonData.title} - ${contentType}`,
                content: `Content for ${lessonData.title} - ${contentType} will be generated on-demand.`,
                contentType,
                orderIndex: index + 1,
              }));

              await db.insert(contentItems).values(contentTypeData);

              return lesson;
            })
          );

          return {
            module,
            lessons: createdLessons,
          };
        })
      );

      // Step 3: Create assessments if provided
      let createdAssessments = null;
      if (assessments) {
        metadata.set("substep", "creating_assessments");
        
        // Create module quizzes
        const moduleQuizzes = await Promise.all(
          assessments.assessments.map(async (assessment: any) => {
            const [quiz] = await db.insert(quizzes).values({
              contentItemId: createdModules[0].lessons[0].id, // Temporary assignment
              title: assessment.quiz.title,
              description: assessment.quiz.description,
            }).returning();

            if (!quiz) {
              throw new Error(`Failed to create quiz: ${assessment.quiz.title}`);
            }

            // Create quiz questions
            const quizQuestionData = assessment.quiz.questions.map((question: any, index: number) => ({
              quizId: quiz.id,
              question: question.question,
              questionType: question.type,
              options: question.options || [],
              correctAnswer: question.correctAnswer,
              orderIndex: index + 1,
            }));

            await db.insert(quizQuestions).values(quizQuestionData);

            return quiz;
          })
        );

        // Create final assessment
        const [finalQuiz] = await db.insert(quizzes).values({
          contentItemId: createdModules[0].lessons[0].id, // Temporary assignment
          title: assessments.finalAssessment.title,
          description: assessments.finalAssessment.description,
        }).returning();

        if (finalQuiz) {
          const finalQuizQuestionData = assessments.finalAssessment.questions.map((question: any, index: number) => ({
            quizId: finalQuiz.id,
            question: question.question,
            questionType: question.type,
            options: question.options || [],
            correctAnswer: question.correctAnswer,
            orderIndex: index + 1,
          }));

          await db.insert(quizQuestions).values(finalQuizQuestionData);
        }

        createdAssessments = {
          moduleQuizzes,
          finalQuiz,
        };
      }

      // Step 4: Calculate final statistics
      metadata.set("substep", "calculating_statistics");
      const totalModules = createdModules.length;
      const totalLessons = createdModules.reduce((sum, mod) => sum + mod.lessons.length, 0);
      const totalContentItems = totalLessons * 3; // Average content items per lesson

      metadata.set("substep", "completed");

      return {
        success: true,
        courseId: course.id,
        statistics: {
          totalModules,
          totalLessons,
          totalContentItems,
          hasAssessments: !!assessments,
          totalQuizzes: createdAssessments ? createdAssessments.moduleQuizzes.length + 1 : 0,
        },
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          status: course.status,
          createdAt: course.createdAt,
        },
        generationMetadata: {
          generatedAt: new Date().toISOString(),
          generationDuration: courseStructure.estimatedTotalDuration,
          difficulty: generationRequest.difficulty,
          learningArea: generationRequest.userProfileContext.learningArea,
        },
      };

    } catch (error) {
      metadata.set("substep", "failed");
      metadata.set("error", error instanceof Error ? error.message : "Unknown error");
      
      console.error("Course finalization failed:", error);
      throw new Error(`Course finalization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

export type FinalizeCourseTaskInput = z.infer<typeof finalizeCourseTaskSchema>;
export type FinalizeCourseTaskOutput = {
  success: boolean;
  courseId: string;
  statistics: {
    totalModules: number;
    totalLessons: number;
    totalContentItems: number;
    hasAssessments: boolean;
    totalQuizzes: number;
  };
  course: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    createdAt: Date;
  };
  generationMetadata: {
    generatedAt: string;
    generationDuration: string;
    difficulty: string;
    learningArea: string;
  };
}; 
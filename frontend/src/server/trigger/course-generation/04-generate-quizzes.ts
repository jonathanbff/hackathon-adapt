import { logger, schemaTask, tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { db } from "../../db/connection";
import { contentItems, quizzes, quizQuestions } from "../../db/schemas";

const quizSchema = z.object({
  title: z.string(),
  description: z.string(),
  questions: z.array(
    z.object({
      question: z.string(),
      questionType: z.enum(["multiple_choice", "true_false", "short_answer"]),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string(),
      explanation: z.string(),
      orderIndex: z.number(),
    })
  ),
});

export const generateQuizTask = schemaTask({
  id: "course-generation.generate-quiz",
  schema: z.object({
    courseId: z.string().uuid(),
    lesson: z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string(),
      keyTopics: z.array(z.string()),
    }),
    moduleContext: z.object({
      title: z.string(),
      description: z.string(),
      learningObjectives: z.array(z.string()),
    }),
    courseSettings: z.object({
      title: z.string(),
      userProfileContext: z.object({
        learningArea: z.string(),
        currentLevel: z.string(),
      }),
      difficulty: z.string(),
      structure: z.object({
        assessments: z.boolean(),
      }),
    }),
    lessonContent: z.object({
      keyPoints: z.array(z.string()),
      practicalExercises: z.array(z.string()),
      summary: z.string(),
    }).optional(),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async ({ courseId, lesson, moduleContext, courseSettings, lessonContent }) => {
    logger.log("Generating quiz for lesson", {
      courseId,
      lessonId: lesson.id,
      title: lesson.title,
      module: moduleContext.title,
    });

    if (!courseSettings.structure.assessments) {
      logger.log("Assessments not enabled, skipping quiz generation", {
        courseId,
        lessonId: lesson.id,
      });
      return {
        courseId,
        lessonId: lesson.id,
        quizGenerated: false,
        message: "Assessments not enabled in course structure",
      };
    }

    const contextInfo = [
      `Lesson: ${lesson.title}`,
      `Description: ${lesson.description}`,
      `Key Topics: ${lesson.keyTopics.join(", ")}`,
      `Module: ${moduleContext.title}`,
      `Learning Objectives: ${moduleContext.learningObjectives.join(", ")}`,
    ];

    if (lessonContent) {
      contextInfo.push(
        `Key Points: ${lessonContent.keyPoints.join(", ")}`,
        `Practical Exercises: ${lessonContent.practicalExercises.join(", ")}`,
        `Summary: ${lessonContent.summary}`
      );
    }

    const prompt = `Create a comprehensive quiz for the lesson "${lesson.title}" in the module "${moduleContext.title}".

Context Information:
${contextInfo.join("\n")}

Course Details:
- Learning Area: ${courseSettings.userProfileContext.learningArea}
- Difficulty Level: ${courseSettings.difficulty}
- Current Level: ${courseSettings.userProfileContext.currentLevel}

Quiz Requirements:
1. Create 5-8 questions total
2. Include a mix of question types:
   - Multiple choice (4-5 questions)
   - True/false (2-3 questions)
   - Short answer (1-2 questions)
3. Questions should test understanding, application, and critical thinking
4. Provide clear explanations for all correct answers
5. Make questions appropriate for ${courseSettings.difficulty} level
6. Focus on the key topics and learning objectives

Generate questions that assess the learner's understanding of the lesson content and their ability to apply the concepts.`;

    try {
      const { object: quiz } = await generateObject({
        model: groq("llama-3.3-70b-versatile"),
        schema: quizSchema,
        prompt,
      });

      const [quizContentItem] = await db
        .insert(contentItems)
        .values({
          lessonId: lesson.id,
          title: quiz.title,
          content: quiz.description,
          contentType: "quiz",
          orderIndex: 2,
        })
        .returning({
          id: contentItems.id,
          title: contentItems.title,
        });

      if (!quizContentItem) {
        throw new Error("Failed to create quiz content item");
      }

      const [newQuiz] = await db
        .insert(quizzes)
        .values({
          contentItemId: quizContentItem.id,
          title: quiz.title,
          description: quiz.description,
        })
        .returning({
          id: quizzes.id,
          title: quizzes.title,
        });

      if (!newQuiz) {
        throw new Error("Failed to create quiz record");
      }

      const questionPromises = quiz.questions.map(async (questionData) => {
        const [newQuestion] = await db
          .insert(quizQuestions)
          .values({
            quizId: newQuiz.id,
            question: questionData.question,
            questionType: questionData.questionType,
            options: questionData.options || [],
            correctAnswer: questionData.correctAnswer,
            orderIndex: questionData.orderIndex,
          })
          .returning({
            id: quizQuestions.id,
            question: quizQuestions.question,
            questionType: quizQuestions.questionType,
          });

        if (!newQuestion) {
          throw new Error(`Failed to create question: ${questionData.question}`);
        }

        return newQuestion;
      });

      const createdQuestions = await Promise.all(questionPromises);

      logger.log("Quiz generated successfully", {
        courseId,
        lessonId: lesson.id,
        quizId: newQuiz.id,
        quizTitle: quiz.title,
        contentItemId: quizContentItem.id,
        questionsCount: createdQuestions.length,
      });

      return {
        courseId,
        lessonId: lesson.id,
        quizId: newQuiz.id,
        quizTitle: quiz.title,
        contentItemId: quizContentItem.id,
        questionsCount: createdQuestions.length,
        quizGenerated: true,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Quiz generation failed", {
        courseId,
        lessonId: lesson.id,
        error: errorMessage,
      });

      return {
        courseId,
        lessonId: lesson.id,
        quizGenerated: false,
        error: errorMessage,
      };
    }
  },
});

export const generateQuizzesBatchTask = schemaTask({
  id: "course-generation.generate-quizzes-batch",
  schema: z.object({
    userId: z.string(),
    courseId: z.string().uuid(),
    courseStructure: z.object({
      modules: z.array(
        z.object({
          id: z.string().uuid(),
          title: z.string(),
          description: z.string(),
          learningObjectives: z.array(z.string()),
          lessons: z.array(
            z.object({
              id: z.string().uuid(),
              title: z.string(),
              description: z.string(),
              keyTopics: z.array(z.string()),
            })
          ),
        })
      ),
    }),
    courseSettings: z.any(),
    contentResults: z.array(z.any()).optional(),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async ({ userId, courseId, courseStructure, courseSettings, contentResults }) => {
    logger.log("Starting quiz generation for all lessons", {
      userId,
      courseId,
      totalLessons: courseStructure.modules.reduce((sum, module) => sum + module.lessons.length, 0),
    });

    const allLessons = courseStructure.modules.flatMap(module => 
      module.lessons.map(lesson => ({
        ...lesson,
        moduleContext: {
          title: module.title,
          description: module.description,
          learningObjectives: module.learningObjectives,
        },
      }))
    );

    const quizResults = [];
    const failedQuizzes = [];

    for (const lesson of allLessons) {
      try {
        const lessonContent = contentResults?.find(result => result.lessonId === lesson.id)?.lessonContent;

        const result = await tasks.triggerAndWait(
          generateQuizTask.id,
          {
            courseId,
            lesson,
            moduleContext: lesson.moduleContext,
            courseSettings,
            lessonContent,
          }
        );

        if (result.ok) {
          quizResults.push(result.output);
        } else {
          throw new Error(`Task failed: ${result.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failedQuizzes.push({
          lessonId: lesson.id,
          error: errorMessage,
        });
        logger.error("Quiz generation failed for lesson", {
          userId,
          courseId,
          lessonId: lesson.id,
          error: errorMessage,
        });
      }
    }

    const quizzesGenerated = quizResults.filter(result => result.quizGenerated);

    if (failedQuizzes.length > 0) {
      logger.error("Some quiz generations failed", {
        userId,
        courseId,
        failedCount: failedQuizzes.length,
        totalCount: allLessons.length,
      });
    }

    logger.log("Quiz generation completed", {
      userId,
      courseId,
      successfulCount: quizResults.length,
      quizzesGeneratedCount: quizzesGenerated.length,
      failedCount: failedQuizzes.length,
      totalCount: allLessons.length,
    });

    return {
      userId,
      courseId,
      courseStructure,
      courseSettings,
      quizResults,
      failedQuizzes,
      quizzesGeneratedCount: quizzesGenerated.length,
    };
  },
}); 
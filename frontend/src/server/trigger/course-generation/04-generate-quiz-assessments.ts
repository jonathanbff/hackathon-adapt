import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { metadata } from "@trigger.dev/sdk/v3";
import { generateStructuredContent, courseGenerationPrompts } from "~/server/tools/groq-ai";

const quizAssessmentTaskSchema = z.object({
  userId: z.string(),
  courseStructure: z.object({
    title: z.string(),
    description: z.string(),
    modules: z.array(z.object({
      title: z.string(),
      description: z.string(),
      orderIndex: z.number(),
    })),
  }),
  moduleContents: z.array(z.object({
    moduleId: z.string(),
    title: z.string(),
    keyTopics: z.array(z.string()),
  })),
  generationRequest: z.object({
    difficulty: z.string(),
    userProfileContext: z.object({
      learningArea: z.string(),
      currentLevel: z.string(),
    }),
  }),
});

const quizOutputSchema = z.object({
  courseId: z.string(),
  assessments: z.array(z.object({
    moduleId: z.string(),
    moduleTitle: z.string(),
    quiz: z.object({
      title: z.string(),
      description: z.string(),
      questions: z.array(z.object({
        id: z.string(),
        type: z.enum(["multiple_choice", "true_false", "short_answer", "practical"]),
        question: z.string(),
        options: z.array(z.string()).optional(),
        correctAnswer: z.string(),
        explanation: z.string(),
        difficulty: z.string(),
        points: z.number(),
      })),
      totalPoints: z.number(),
      passingScore: z.number(),
      timeLimit: z.string(),
    }),
  })),
  finalAssessment: z.object({
    title: z.string(),
    description: z.string(),
    questions: z.array(z.object({
      id: z.string(),
      type: z.enum(["multiple_choice", "true_false", "short_answer", "practical"]),
      question: z.string(),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string(),
      explanation: z.string(),
      difficulty: z.string(),
      points: z.number(),
    })),
    totalPoints: z.number(),
    passingScore: z.number(),
    timeLimit: z.string(),
  }),
});

export const generateQuizAssessmentsTask = schemaTask({
  id: "course-generation.assessments",
  schema: quizAssessmentTaskSchema,
  retry: {
    maxAttempts: 2,
  },
  run: async ({ userId, courseStructure, moduleContents, generationRequest }) => {
    try {
      metadata.set("step", "quiz_assessment_generation");
      metadata.set("userId", userId);
      metadata.set("courseTitle", courseStructure.title);

      // Generate assessments for each module
      const moduleAssessments = await Promise.all(
        moduleContents.map(async (moduleContent, index) => {
          const quizPrompt = courseGenerationPrompts.quizGeneration(
            moduleContent.title,
            generationRequest.difficulty,
            `Course: ${courseStructure.title}\nModule Topics: ${moduleContent.keyTopics.join(", ")}`
          );

          const quizResult = await generateStructuredContent(
            z.object({
              title: z.string(),
              description: z.string(),
              questions: z.array(z.object({
                id: z.string(),
                type: z.enum(["multiple_choice", "true_false", "short_answer", "practical"]),
                question: z.string(),
                options: z.array(z.string()).optional(),
                correctAnswer: z.string(),
                explanation: z.string(),
                difficulty: z.string(),
                points: z.number(),
              })),
              totalPoints: z.number(),
              passingScore: z.number(),
              timeLimit: z.string(),
            }),
            quizPrompt,
            {
              model: "FAST",
              temperature: 0.6,
              systemPrompt: "You are an expert assessment designer. Create comprehensive, fair, and engaging quizzes that test understanding, application, and critical thinking.",
            }
          );

          return {
            moduleId: moduleContent.moduleId,
            moduleTitle: moduleContent.title,
            quiz: quizResult.content,
          };
        })
      );

      // Generate final course assessment
      const finalAssessmentPrompt = `
Create a comprehensive final assessment for the course "${courseStructure.title}".

Course Overview:
${courseStructure.description}

Modules Covered:
${moduleContents.map(m => `- ${m.title}: ${m.keyTopics.join(", ")}`).join("\n")}

Difficulty: ${generationRequest.difficulty}
Learning Area: ${generationRequest.userProfileContext.learningArea}

Create a final assessment that:
1. Tests understanding across all modules
2. Includes application and synthesis questions
3. Balances different question types
4. Provides comprehensive explanations
5. Sets appropriate difficulty and time limits
`;

      const finalAssessmentResult = await generateStructuredContent(
        z.object({
          title: z.string(),
          description: z.string(),
          questions: z.array(z.object({
            id: z.string(),
            type: z.enum(["multiple_choice", "true_false", "short_answer", "practical"]),
            question: z.string(),
            options: z.array(z.string()).optional(),
            correctAnswer: z.string(),
            explanation: z.string(),
            difficulty: z.string(),
            points: z.number(),
          })),
          totalPoints: z.number(),
          passingScore: z.number(),
          timeLimit: z.string(),
        }),
        finalAssessmentPrompt,
        {
          model: "FAST",
          temperature: 0.6,
          systemPrompt: "You are an expert assessment designer creating comprehensive final assessments that test overall course mastery.",
        }
      );

      const assessmentOutput = {
        courseId: `course-${Date.now()}`,
        assessments: moduleAssessments,
        finalAssessment: finalAssessmentResult.content,
      };

      return {
        success: true,
        assessments: assessmentOutput,
        generationMetadata: {
          totalModuleQuizzes: moduleAssessments.length,
          totalQuestions: moduleAssessments.reduce((sum, assess) => sum + assess.quiz.questions.length, 0) + finalAssessmentResult.content.questions.length,
          generatedAt: new Date().toISOString(),
        },
      };

    } catch (error) {
      console.error("Quiz assessment generation failed:", error);
      throw new Error(`Quiz assessment generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

export type QuizAssessmentTaskInput = z.infer<typeof quizAssessmentTaskSchema>;
export type QuizAssessmentTaskOutput = {
  success: boolean;
  assessments: z.infer<typeof quizOutputSchema>;
  generationMetadata: {
    totalModuleQuizzes: number;
    totalQuestions: number;
    generatedAt: string;
  };
}; 
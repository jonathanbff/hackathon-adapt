import { schemaTask } from "@trigger.dev/sdk/v3";
import { generateObject } from "ai";
import { z } from "zod";
// import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import { courseGenerationRequests, contentItems } from "~/server/db/schemas";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";

const assessmentContentSchema = z.object({
  moduleQuiz: z.object({
    title: z.string(),
    description: z.string(),
    questions: z.array(z.object({
      type: z.enum(["multiple_choice", "true_false", "short_answer"]),
      question: z.string(),
      options: z.array(z.string()).optional(),
      correct: z.union([z.number(), z.boolean()]).optional(),
      explanation: z.string().optional(),
      sampleAnswer: z.string().optional(),
      points: z.number().default(5),
    })),
  }),
  practicalExercises: z.array(z.object({
    title: z.string(),
    description: z.string(),
    instructions: z.string(),
    expectedOutcome: z.string(),
  })),
  projectIdeas: z.array(z.object({
    title: z.string(),
    description: z.string(),
    requirements: z.array(z.string()),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  })),
});

export const generateAssessmentsTask = schemaTask({
  id: "course-generation.generate-assessments",
  schema: z.object({
    requestId: z.string(),
    courseId: z.string(),
    moduleData: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      orderIndex: z.number(),
      lessons: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        orderIndex: z.number(),
      })),
    })),
    validatedData: z.object({
      title: z.string(),
      difficulty: z.string(),
      structure: z.object({
        assessments: z.boolean(),
        projects: z.boolean(),
      }),
      aiPreferences: z.object({
        tone: z.string(),
        interactivity: z.string(),
      }),
    }),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async ({ requestId, courseId, moduleData, validatedData }) => {
    try {
      // Update progress
      await db
        .update(courseGenerationRequests)
        .set({
          generationProgress: 85,
          currentStep: 5,
        })
        .where(eq(courseGenerationRequests.id, requestId));

      const generatedAssessments = [];

      if (validatedData.structure.assessments) {
        // Generate assessments for each module
        for (const moduleInfo of moduleData) {
          const assessmentPrompt = `
            Create assessments for the module "${moduleInfo.title}".
            
            Module: ${moduleInfo.description || 'No description'}
            Difficulty: ${validatedData.difficulty}
            
            Lessons: ${moduleInfo.lessons.map(lesson => lesson.title).join(', ')}
            
            Create a quiz with 3-5 questions (mix of multiple choice, true/false, short answer), 2 practical exercises, and 2 project ideas.
            
            Return exactly this JSON structure:
            {
              "moduleQuiz": {
                "title": "Quiz Title",
                "description": "Quiz description",
                "questions": [
                  {
                    "type": "multiple_choice",
                    "question": "Question text",
                    "options": ["A", "B", "C", "D"],
                    "correct": 0,
                    "explanation": "Why this answer is correct",
                    "points": 5
                  },
                  {
                    "type": "true_false",
                    "question": "True or false statement",
                    "correct": true,
                    "explanation": "Why this is true/false",
                    "points": 5
                  },
                  {
                    "type": "short_answer",
                    "question": "Open-ended question",
                    "sampleAnswer": "Example answer",
                    "explanation": "What makes a good answer",
                    "points": 5
                  }
                ]
              },
              "practicalExercises": [
                {
                  "title": "Exercise 1",
                  "description": "What students will do",
                  "instructions": "Step by step guide",
                  "expectedOutcome": "What they should achieve"
                },
                {
                  "title": "Exercise 2", 
                  "description": "What students will do",
                  "instructions": "Step by step guide",
                  "expectedOutcome": "What they should achieve"
                }
              ],
              "projectIdeas": [
                {
                  "title": "Project 1",
                  "description": "Project description",
                  "requirements": ["Requirement 1", "Requirement 2"],
                  "difficulty": "beginner"
                },
                {
                  "title": "Project 2",
                  "description": "Project description", 
                  "requirements": ["Requirement 1", "Requirement 2"],
                  "difficulty": "beginner"
                }
              ]
            }
          `;

                     const { object } = await generateObject({
             model: openai("gpt-4o-mini"),
             prompt: assessmentPrompt,
             schema: assessmentContentSchema,
             temperature: 0.7,
           }).catch(error => {
             console.error("Error generating assessments:", error);
             throw new Error(`Failed to generate assessments: ${error.message}`);
           });

           const assessmentContent = object;

          // Create assessment content items
          const assessmentItems = [];
          let orderIndex = 1;

          // Add module quiz
          assessmentItems.push({
            lessonId: moduleInfo.lessons[moduleInfo.lessons.length - 1]?.id || "", // Use last lesson
            title: assessmentContent.moduleQuiz.title,
            content: JSON.stringify(assessmentContent.moduleQuiz),
            contentType: "quiz",
            orderIndex: orderIndex++,
          });

          // Add practical exercises
          for (const exercise of assessmentContent.practicalExercises) {
            assessmentItems.push({
              lessonId: moduleInfo.lessons[moduleInfo.lessons.length - 1]?.id || "",
              title: exercise.title,
              content: JSON.stringify(exercise),
              contentType: "exercise",
              orderIndex: orderIndex++,
            });
          }

          // Add project ideas if projects are enabled
          if (validatedData.structure.projects) {
            for (const project of assessmentContent.projectIdeas) {
              assessmentItems.push({
                lessonId: moduleInfo.lessons[moduleInfo.lessons.length - 1]?.id || "",
                title: project.title,
                content: JSON.stringify(project),
                contentType: "project",
                orderIndex: orderIndex++,
              });
            }
          }

          // Insert assessment items
          for (const item of assessmentItems) {
            if (item.lessonId) {
              await db.insert(contentItems).values(item);
            }
          }

          generatedAssessments.push({
            moduleId: moduleInfo.id,
            moduleTitle: moduleInfo.title,
            assessmentCount: assessmentItems.length,
            quizQuestions: assessmentContent.moduleQuiz.questions.length,
            exercises: assessmentContent.practicalExercises.length,
            projects: validatedData.structure.projects ? assessmentContent.projectIdeas.length : 0,
          });
        }
      }

      // Update progress
      await db
        .update(courseGenerationRequests)
        .set({
          generationProgress: 95,
        })
        .where(eq(courseGenerationRequests.id, requestId));

      return {
        success: true,
        courseId,
        generatedAssessments,
        totalAssessments: generatedAssessments.length,
        totalQuizQuestions: generatedAssessments.reduce((sum, assess) => sum + assess.quizQuestions, 0),
        totalExercises: generatedAssessments.reduce((sum, assess) => sum + assess.exercises, 0),
        totalProjects: generatedAssessments.reduce((sum, assess) => sum + assess.projects, 0),
        message: "Assessments generated successfully",
      };
    } catch (error) {
      console.error("Error generating assessments:", error);
      
      // Update request status to failed
      await db
        .update(courseGenerationRequests)
        .set({
          status: "failed",
          isGenerating: false,
        })
        .where(eq(courseGenerationRequests.id, requestId));

      throw new Error(`Assessment generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
}); 
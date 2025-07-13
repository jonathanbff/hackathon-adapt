import { schemaTask } from "@trigger.dev/sdk/v3";
import { generateObject } from "ai";
import { z } from "zod";
import { groq } from "@ai-sdk/groq";
import { lessons, courseGenerationRequests, contentItems } from "~/server/db/schemas";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";

const lessonContentSchema = z.object({
  lessonContent: z.object({
    introduction: z.string(),
    objectives: z.array(z.string()),
    sections: z.array(z.object({
      title: z.string(),
      content: z.string(),
      type: z.string(),
    })),
    examples: z.array(z.object({
      title: z.string(),
      content: z.string(),
      type: z.string(),
    })),
    keyTakeaways: z.array(z.string()),
    exercises: z.array(z.object({
      title: z.string(),
      description: z.string(),
      type: z.string(),
    })),
    estimatedTime: z.string(),
  }),
});

export const generateLessonContentTask = schemaTask({
  id: "course-generation.generate-lessons",
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
      format: z.array(z.string()),
      aiPreferences: z.object({
        tone: z.string(),
        interactivity: z.string(),
        examples: z.string(),
        pacing: z.string(),
      }),
      userProfileContext: z.object({
        learningArea: z.string(),
        learningStyle: z.string(),
        currentLevel: z.string(),
        multipleIntelligences: z.array(z.string()),
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
          generationProgress: 70,
          currentStep: 4,
        })
        .where(eq(courseGenerationRequests.id, requestId));

      const generatedLessons = [];
      let totalLessons = 0;
      let processedLessons = 0;

      // Count total lessons
      for (const module of moduleData) {
        totalLessons += module.lessons.length;
      }

      // Generate content for each lesson
      for (const moduleInfo of moduleData) {
        for (const lessonInfo of moduleInfo.lessons) {
          const lessonPrompt = `
            Generate detailed lesson content for "${lessonInfo.title}" in module "${moduleInfo.title}".
            
                         Lesson Description: ${lessonInfo.description || 'No description provided'}
             Module Context: ${moduleInfo.description || 'No description provided'}
            
            Course Context:
            - Learning area: ${validatedData.userProfileContext.learningArea}
            - Learning style: ${validatedData.userProfileContext.learningStyle}
            - Current level: ${validatedData.userProfileContext.currentLevel}
            - Difficulty: ${validatedData.difficulty}
            - Tone: ${validatedData.aiPreferences.tone}
            - Content format: ${validatedData.format.join(", ")}
            - Interactivity: ${validatedData.aiPreferences.interactivity}
            - Examples preference: ${validatedData.aiPreferences.examples}
            
            Generate comprehensive lesson content including:
            1. Lesson introduction
            2. Learning objectives
            3. Main content sections
            4. Practical examples
            5. Key takeaways
            6. Practice exercises
            
            Return a JSON structure with:
            {
              "lessonContent": {
                "introduction": "Lesson introduction text",
                "objectives": ["Objective 1", "Objective 2"],
                "sections": [
                  {
                    "title": "Section Title",
                    "content": "Section content",
                    "type": "text|video|interactive|quiz"
                  }
                ],
                "examples": [
                  {
                    "title": "Example Title",
                    "content": "Example content",
                    "type": "code|scenario|case_study"
                  }
                ],
                "keyTakeaways": ["Key point 1", "Key point 2"],
                "exercises": [
                  {
                    "title": "Exercise Title",
                    "description": "Exercise description",
                    "type": "practice|homework|project"
                  }
                ],
                "estimatedTime": "X minutes"
              }
            }
          `;

                                const { object } = await generateObject({
             model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
             prompt: lessonPrompt,
             schema: lessonContentSchema,
             temperature: 0.7,
           }).catch(error => {
             console.error("Error generating lesson content:", error);
             throw new Error(`Failed to generate lesson content: ${error.message}`);
           });

           const lessonContent = object;

          // Update the lesson with generated content
          const [updatedLesson] = await db
            .update(lessons)
            .set({
              description: `${lessonInfo.description || 'No description provided'}\n\n${lessonContent.lessonContent.introduction}`,
            })
            .where(eq(lessons.id, lessonInfo.id))
            .returning();

          if (!updatedLesson) {
            throw new Error(`Failed to update lesson ${lessonInfo.title}`);
          }

          // Create content items for the lesson
          const contentItemsData = [];
          let orderIndex = 1;

          // Add lesson objectives
          contentItemsData.push({
            lessonId: lessonInfo.id,
            title: "Learning Objectives",
            content: lessonContent.lessonContent.objectives.join('\n'),
            contentType: "text",
            orderIndex: orderIndex++,
          });

          // Add main content sections
          for (const section of lessonContent.lessonContent.sections) {
            contentItemsData.push({
              lessonId: lessonInfo.id,
              title: section.title,
              content: section.content,
              contentType: section.type,
              orderIndex: orderIndex++,
            });
          }

          // Add examples
          for (const example of lessonContent.lessonContent.examples) {
            contentItemsData.push({
              lessonId: lessonInfo.id,
              title: `Example: ${example.title}`,
              content: example.content,
              contentType: example.type,
              orderIndex: orderIndex++,
            });
          }

          // Add key takeaways
          contentItemsData.push({
            lessonId: lessonInfo.id,
            title: "Key Takeaways",
            content: lessonContent.lessonContent.keyTakeaways.join('\n'),
            contentType: "text",
            orderIndex: orderIndex++,
          });

          // Add exercises
          for (const exercise of lessonContent.lessonContent.exercises) {
            contentItemsData.push({
              lessonId: lessonInfo.id,
              title: `Exercise: ${exercise.title}`,
              content: exercise.description,
              contentType: exercise.type,
              orderIndex: orderIndex++,
            });
          }

          // Insert content items
          for (const contentItem of contentItemsData) {
            await db.insert(contentItems).values(contentItem);
          }

          generatedLessons.push({
            id: updatedLesson.id,
            title: updatedLesson.title,
            moduleTitle: moduleInfo.title,
            contentItemsCount: contentItemsData.length,
            estimatedTime: lessonContent.lessonContent.estimatedTime,
          });

          processedLessons++;

          // Update progress incrementally
          const currentProgress = 70 + (processedLessons / totalLessons) * 15;
          await db
            .update(courseGenerationRequests)
            .set({
              generationProgress: Math.round(currentProgress),
            })
            .where(eq(courseGenerationRequests.id, requestId));
        }
      }

      return {
        success: true,
        courseId,
        generatedLessons,
        totalLessons: generatedLessons.length,
        totalContentItems: generatedLessons.reduce((sum, lesson) => sum + lesson.contentItemsCount, 0),
        message: "Lesson content generated successfully",
      };
    } catch (error) {
      console.error("Error generating lesson content:", error);
      
      // Update request status to failed
      await db
        .update(courseGenerationRequests)
        .set({
          status: "failed",
          isGenerating: false,
        })
        .where(eq(courseGenerationRequests.id, requestId));

      throw new Error(`Lesson content generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
}); 
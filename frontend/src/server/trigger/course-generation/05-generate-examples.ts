import { logger, schemaTask, tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { db } from "~/server/db/connection";
import { contentItems, examples } from "~/server/db/schemas";

const examplesSchema = z.object({
  examples: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      exampleType: z.enum(["real_world", "analogy", "case_study", "code_example"]),
      keyPointsIllustrated: z.array(z.string()),
      orderIndex: z.number(),
    })
  ),
});

export const generateExamplesTask = schemaTask({
  id: "course-generation.generate-examples",
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
        learningStyle: z.string(),
      }),
      difficulty: z.string(),
      aiPreferences: z.object({
        examples: z.string(),
        tone: z.string(),
        interactivity: z.string(),
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
    logger.log("Generating examples for lesson", {
      courseId,
      lessonId: lesson.id,
      title: lesson.title,
      module: moduleContext.title,
    });

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

    const prompt = `Generate diverse examples and analogies for the lesson "${lesson.title}" in the module "${moduleContext.title}".

Context Information:
${contextInfo.join("\n")}

Course Details:
- Learning Area: ${courseSettings.userProfileContext.learningArea}
- Current Level: ${courseSettings.userProfileContext.currentLevel}
- Learning Style: ${courseSettings.userProfileContext.learningStyle}
- Difficulty: ${courseSettings.difficulty}

AI Preferences:
- Examples Style: ${courseSettings.aiPreferences.examples}
- Tone: ${courseSettings.aiPreferences.tone}
- Interactivity: ${courseSettings.aiPreferences.interactivity}

Example Requirements:
1. Generate 3-5 diverse examples total
2. Include different types of examples:
   - Real-world applications (1-2 examples)
   - Analogies that explain complex concepts (1-2 examples)
   - Case studies or scenarios (1 example)
   - Code examples (if applicable to the topic)
3. Each example should be tailored to the learner's level and learning style
4. Examples should illustrate key concepts and help with understanding
5. Make examples engaging and relatable to the learner's context

Generate examples that make the lesson content more accessible and memorable for the learner.`;

    try {
      const { object: examplesData } = await generateObject({
        model: groq("llama-3.3-70b-versatile"),
        schema: examplesSchema,
        prompt,
      });

      const examplePromises = examplesData.examples.map(async (exampleData) => {
        const [exampleContentItem] = await db
          .insert(contentItems)
          .values({
            lessonId: lesson.id,
            title: `Example: ${exampleData.title}`,
            content: exampleData.content,
            contentType: "example",
            orderIndex: 3 + exampleData.orderIndex,
          })
          .returning({
            id: contentItems.id,
            title: contentItems.title,
          });

        if (!exampleContentItem) {
          throw new Error(`Failed to create example content item: ${exampleData.title}`);
        }

        const [newExample] = await db
          .insert(examples)
          .values({
            contentItemId: exampleContentItem.id,
            title: exampleData.title,
            content: exampleData.content,
            exampleType: exampleData.exampleType,
            orderIndex: exampleData.orderIndex,
          })
          .returning({
            id: examples.id,
            title: examples.title,
            exampleType: examples.exampleType,
          });

        if (!newExample) {
          throw new Error(`Failed to create example: ${exampleData.title}`);
        }

        return {
          ...newExample,
          contentItemId: exampleContentItem.id,
          keyPointsIllustrated: exampleData.keyPointsIllustrated,
        };
      });

      const createdExamples = await Promise.all(examplePromises);

      logger.log("Examples generated successfully", {
        courseId,
        lessonId: lesson.id,
        examplesCount: createdExamples.length,
        exampleTypes: createdExamples.map(ex => ex.exampleType),
      });

      return {
        courseId,
        lessonId: lesson.id,
        examplesCount: createdExamples.length,
        exampleTypes: createdExamples.map(ex => ex.exampleType),
        examples: createdExamples,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Examples generation failed", {
        courseId,
        lessonId: lesson.id,
        error: errorMessage,
      });

      return {
        courseId,
        lessonId: lesson.id,
        examplesCount: 0,
        error: errorMessage,
      };
    }
  },
});

export const generateExamplesBatchTask = schemaTask({
  id: "course-generation.generate-examples-batch",
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
    logger.log("Starting examples generation for all lessons", {
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

    const exampleResults = [];
    const failedExamples = [];

    for (const lesson of allLessons) {
      try {
        const lessonContent = contentResults?.find(result => result.lessonId === lesson.id)?.lessonContent;

        const result = await tasks.triggerAndWait(
          generateExamplesTask.id,
          {
            courseId,
            lesson,
            moduleContext: lesson.moduleContext,
            courseSettings,
            lessonContent,
          }
        );

        if (result.ok) {
          exampleResults.push(result.output);
        } else {
          throw new Error(`Task failed: ${result.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failedExamples.push({
          lessonId: lesson.id,
          error: errorMessage,
        });
        logger.error("Examples generation failed for lesson", {
          userId,
          courseId,
          lessonId: lesson.id,
          error: errorMessage,
        });
      }
    }

    const totalExamples = exampleResults.reduce((sum, result) => sum + result.examplesCount, 0);

    if (failedExamples.length > 0) {
      logger.error("Some examples generation failed", {
        userId,
        courseId,
        failedCount: failedExamples.length,
        totalCount: allLessons.length,
      });
    }

    logger.log("Examples generation completed", {
      userId,
      courseId,
      successfulCount: exampleResults.length,
      totalExamples,
      failedCount: failedExamples.length,
      totalCount: allLessons.length,
    });

    return {
      userId,
      courseId,
      courseStructure,
      courseSettings,
      exampleResults,
      failedExamples,
      totalExamples,
    };
  },
}); 
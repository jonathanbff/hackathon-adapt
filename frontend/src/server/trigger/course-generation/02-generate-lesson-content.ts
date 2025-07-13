import { logger, schemaTask, batch, tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { generateObject, generateText } from "ai";
import { groq } from "@ai-sdk/groq";
import { db } from "~/server/db/connection";
import { contentItems, articles } from "~/server/db/schemas";
import { vectorSearchTool } from "~/server/tools/vector-search";

const lessonContentSchema = z.object({
  title: z.string(),
  introduction: z.string(),
  mainContent: z.string(),
  keyPoints: z.array(z.string()),
  practicalExercises: z.array(z.string()),
  summary: z.string(),
  furtherReading: z.array(z.string()),
  estimatedReadingTime: z.string(),
});

export const generateLessonContentTask = schemaTask({
  id: "course-generation.generate-lesson-content",
  schema: z.object({
    userId: z.string(),
    courseId: z.string().uuid(),
    lesson: z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string(),
      orderIndex: z.number(),
      estimatedDuration: z.string(),
      contentTypes: z.array(z.string()),
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
        learningStyle: z.string(),
        currentLevel: z.string(),
        multipleIntelligences: z.array(z.string()),
      }),
      aiPreferences: z.object({
        tone: z.string(),
        interactivity: z.string(),
        examples: z.string(),
        pacing: z.string(),
      }),
      difficulty: z.string(),
      format: z.array(z.string()),
    }),
    materials: z.any().optional(),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async ({ userId, courseId, lesson, moduleContext, courseSettings, materials }) => {
    logger.log("Generating lesson content", {
      userId,
      courseId,
      lessonId: lesson.id,
      title: lesson.title,
      module: moduleContext.title,
    });

    let contextualInfo = "";
    
    // TODO: Re-implement vector search integration
    // if (materials?.documents && materials.documents.length > 0) {
    //   // Vector search implementation will be added separately
    // }

    const prompt = `Create comprehensive lesson content for "${lesson.title}" in the module "${moduleContext.title}".

Lesson Context:
- Description: ${lesson.description}
- Key Topics: ${lesson.keyTopics.join(", ")}
- Estimated Duration: ${lesson.estimatedDuration}
- Content Types: ${lesson.contentTypes.join(", ")}

Course Context:
- Learning Area: ${courseSettings.userProfileContext.learningArea}
- Learning Style: ${courseSettings.userProfileContext.learningStyle}
- Current Level: ${courseSettings.userProfileContext.currentLevel}
- Difficulty: ${courseSettings.difficulty}
- Preferred Formats: ${courseSettings.format.join(", ")}

Module Learning Objectives:
${moduleContext.learningObjectives.map(obj => `- ${obj}`).join("\n")}

AI Preferences:
- Tone: ${courseSettings.aiPreferences.tone}
- Interactivity: ${courseSettings.aiPreferences.interactivity}
- Examples: ${courseSettings.aiPreferences.examples}
- Pacing: ${courseSettings.aiPreferences.pacing}

${contextualInfo ? `\nContextual Information from Materials:\n${contextualInfo}` : ""}

Create engaging, educational content that matches the learner's profile and incorporates the provided context where relevant.`;

    const { object: lessonContent } = await generateObject({
      model: groq("llama-3.3-70b-versatile"),
      schema: lessonContentSchema,
      prompt,
    });

    const [newContentItem] = await db
      .insert(contentItems)
      .values({
        lessonId: lesson.id,
        title: lessonContent.title,
        content: lessonContent.mainContent,
        contentType: "lesson",
        orderIndex: 1,
      })
      .returning({
        id: contentItems.id,
        title: contentItems.title,
        content: contentItems.content,
      });

    if (!newContentItem) {
      throw new Error(`Failed to create content item for lesson: ${lesson.title}`);
    }

    logger.log("Lesson content generated successfully", {
      userId,
      courseId,
      lessonId: lesson.id,
      contentItemId: newContentItem.id,
      title: lessonContent.title,
      keyPointsCount: lessonContent.keyPoints.length,
      exercisesCount: lessonContent.practicalExercises.length,
      estimatedReadingTime: lessonContent.estimatedReadingTime,
    });

    return {
      userId,
      courseId,
      lessonId: lesson.id,
      contentItemId: newContentItem.id,
      lessonContent: {
        title: lessonContent.title,
        introduction: lessonContent.introduction,
        mainContent: lessonContent.mainContent,
        keyPoints: lessonContent.keyPoints,
        practicalExercises: lessonContent.practicalExercises,
        summary: lessonContent.summary,
        furtherReading: lessonContent.furtherReading,
        estimatedReadingTime: lessonContent.estimatedReadingTime,
      },
    };
  },
});

export const generateLessonContentBatchTask = schemaTask({
  id: "course-generation.generate-lesson-content-batch",
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
              orderIndex: z.number(),
              estimatedDuration: z.string(),
              contentTypes: z.array(z.string()),
              keyTopics: z.array(z.string()),
            })
          ),
        })
      ),
    }),
    courseSettings: z.any(),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async ({ userId, courseId, courseStructure, courseSettings }) => {
    logger.log("Starting batch lesson content generation", {
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

    const contentResults = [];
    const failedLessons = [];

    for (const lesson of allLessons) {
      try {
        const result = await tasks.triggerAndWait(
          generateLessonContentTask.id,
          {
            userId,
            courseId,
            lesson,
            moduleContext: lesson.moduleContext,
            courseSettings,
            materials: courseSettings.materials,
          }
        );

        if (result.ok) {
          contentResults.push(result.output);
        } else {
          throw new Error(`Task failed: ${result.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failedLessons.push({
          lessonId: lesson.id,
          error: errorMessage,
        });
        logger.error("Lesson content generation failed", {
          userId,
          courseId,
          lessonId: lesson.id,
          error: errorMessage,
        });
      }
    }

    if (failedLessons.length > 0) {
      logger.error("Some lesson content generation failed", {
        userId,
        courseId,
        failedCount: failedLessons.length,
        totalCount: allLessons.length,
      });
    }

    logger.log("Batch lesson content generation completed", {
      userId,
      courseId,
      successfulCount: contentResults.length,
      failedCount: failedLessons.length,
      totalCount: allLessons.length,
    });

    return {
      userId,
      courseId,
      courseStructure,
      courseSettings,
      contentResults,
      failedLessons,
    };
  },
}); 
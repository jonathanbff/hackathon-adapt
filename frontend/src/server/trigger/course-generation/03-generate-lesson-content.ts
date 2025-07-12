import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { metadata } from "@trigger.dev/sdk/v3";
import { generateStructuredContent, courseGenerationPrompts } from "~/server/tools/groq-ai";
import { vectorSearchTool } from "~/server/tools/vector-search";

const lessonContentTaskSchema = z.object({
  userId: z.string(),
  lessonId: z.string(),
  lessonTitle: z.string(),
  lessonDescription: z.string(),
  moduleContext: z.string(),
  courseContext: z.string(),
  difficulty: z.string(),
  learningArea: z.string(),
});

const lessonContentOutputSchema = z.object({
  lessonId: z.string(),
  title: z.string(),
  content: z.string(),
  objectives: z.array(z.string()),
  keyPoints: z.array(z.string()),
  examples: z.array(z.string()),
  practicalExercises: z.array(z.string()),
  additionalResources: z.array(z.string()),
  assessmentQuestions: z.array(z.string()),
  estimatedDuration: z.string(),
});

export const generateLessonContentTask = schemaTask({
  id: "course-generation.lesson-content",
  schema: lessonContentTaskSchema,
  retry: {
    maxAttempts: 2,
  },
  run: async ({ userId, lessonId, lessonTitle, lessonDescription, moduleContext, courseContext, difficulty, learningArea }) => {
    try {
      metadata.set("step", "lesson_content_generation");
      metadata.set("userId", userId);
      metadata.set("lessonTitle", lessonTitle);

      // Gather context from materials
      const contextResults = await vectorSearchTool.execute({
        query: `${lessonTitle} ${learningArea} ${difficulty}`,
        limit: 3,
      });

      const materials = contextResults.results.map(result => ({
        title: result.metadata?.filename || "Unknown",
        content: result.content,
      }));

      // Generate lesson content
      const lessonPrompt = courseGenerationPrompts.lessonContent(
        { title: lessonTitle, description: lessonDescription },
        moduleContext,
        materials
      );

      const lessonContentResult = await generateStructuredContent(
        lessonContentOutputSchema,
        lessonPrompt,
        {
          model: "FAST",
          temperature: 0.7,
          systemPrompt: "You are an expert educator creating detailed lesson content. Focus on clear explanations, practical examples, and engaging activities.",
        }
      );

      const finalContent = {
        ...lessonContentResult.content,
        lessonId,
        generatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        lessonContent: finalContent,
        generationMetadata: {
          tokensUsed: lessonContentResult.usage?.totalTokens || 0,
          model: "groq-llama-3.1-70b",
          generatedAt: new Date().toISOString(),
          contextSources: materials.length,
        },
      };

    } catch (error) {
      console.error("Lesson content generation failed:", error);
      throw new Error(`Lesson content generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

export type LessonContentTaskInput = z.infer<typeof lessonContentTaskSchema>;
export type LessonContentTaskOutput = {
  success: boolean;
  lessonContent: z.infer<typeof lessonContentOutputSchema> & {
    generatedAt: string;
  };
  generationMetadata: {
    tokensUsed: number;
    model: string;
    generatedAt: string;
    contextSources: number;
  };
}; 
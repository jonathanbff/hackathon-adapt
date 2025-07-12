import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { metadata } from "@trigger.dev/sdk/v3";
import { courseGenerationInputSchema } from "~/server/db/schemas";
import { generateStructuredContent, courseGenerationPrompts } from "~/server/tools/groq-ai";
import { vectorSearchTool } from "~/server/tools/vector-search";
import { youtubeSearchTool } from "~/server/tools/youtube-search";
import type { YoutubeVideoResult } from "~/server/tools/youtube-search";

const moduleInfoSchema = z.object({
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
});

const courseContextSchema = z.object({
  title: z.string(),
  description: z.string(),
  difficulty: z.string(),
  learningArea: z.string(),
});

const moduleContentTaskSchema = z.object({
  userId: z.string(),
  moduleInfo: moduleInfoSchema,
  courseContext: courseContextSchema,
  generationRequest: courseGenerationInputSchema,
});

const moduleContentOutputSchema = z.object({
  moduleId: z.string(),
  title: z.string(),
  description: z.string(),
  objectives: z.array(z.string()),
  introduction: z.string(),
  keyTopics: z.array(z.string()),
  lessons: z.array(z.object({
    title: z.string(),
    description: z.string(),
    orderIndex: z.number(),
    estimatedDuration: z.string(),
    contentTypes: z.array(z.string()),
    learningObjectives: z.array(z.string()),
    keyPoints: z.array(z.string()),
    suggestedVideos: z.array(z.object({
      id: z.string(),
      title: z.string(),
      duration: z.string(),
      relevanceScore: z.number(),
    })),
    practicalExercises: z.array(z.string()),
    assessmentQuestions: z.array(z.string()),
  })),
  recommendedResources: z.array(z.string()),
  assessmentCriteria: z.array(z.string()),
  estimatedCompletionTime: z.string(),
});

export const generateModuleContentTask = schemaTask({
  id: "course-generation.module-content",
  schema: moduleContentTaskSchema,
  retry: {
    maxAttempts: 2,
  },
  run: async ({ userId, moduleInfo, courseContext, generationRequest }) => {
    try {
      metadata.set("step", "module_content_generation");
      metadata.set("userId", userId);
      metadata.set("moduleTitle", moduleInfo.title);
      metadata.set("courseTitle", courseContext.title);

      // Step 1: Gather contextual information from vector search
      metadata.set("substep", "gathering_context");
      
      const contextQueries = [
        `${moduleInfo.title} ${courseContext.learningArea}`,
        `${moduleInfo.description} ${courseContext.difficulty}`,
        `${courseContext.title} ${moduleInfo.title}`,
      ];

      const contextResults = await Promise.all(
        contextQueries.map(query => 
          vectorSearchTool.execute({
            query,
            limit: 2,
          })
        )
      );

      const relevantContext = contextResults
        .flatMap(result => result.results)
        .map(result => ({
          title: result.metadata?.filename || "Unknown",
          content: result.content,
          score: result.score,
        }))
        .filter(item => item.score > 0.7) // Only high-relevance content
        .slice(0, 3); // Limit to top 3 results

      // Step 2: Search for relevant YouTube videos
      metadata.set("substep", "searching_videos");
      
      const videoSearchQueries = [
        `${moduleInfo.title} ${courseContext.learningArea} tutorial`,
        `${moduleInfo.title} ${courseContext.difficulty} course`,
        `learn ${moduleInfo.title} ${courseContext.learningArea}`,
      ];

      const videoSearchResults = await Promise.all(
        videoSearchQueries.map(query =>
          youtubeSearchTool.execute({
            query,
            limit: 3,
            duration: "medium",
            sortBy: "relevance",
          })
        )
      );

      const relevantVideos = videoSearchResults
        .flatMap(result => result.videos)
        .filter(video => !video.isLive && video.duration !== "Unknown")
        .slice(0, 6); // Limit to top 6 videos

      // Step 3: Generate detailed module content
      metadata.set("substep", "generating_module_content");
      
      const contextString = relevantContext.length > 0 
        ? relevantContext.map(ctx => `${ctx.title}: ${ctx.content.substring(0, 300)}...`).join("\n\n")
        : "No specific context available from materials";

      const videoContext = relevantVideos.length > 0
        ? relevantVideos.map(video => `${video.title} (${video.duration}) - ${video.description.substring(0, 100)}...`).join("\n")
        : "No relevant videos found";

      const modulePrompt = `
${courseGenerationPrompts.moduleContent(moduleInfo, courseContext.title)}

Additional Context from Materials:
${contextString}

Available Video Resources:
${videoContext}

Learning Preferences:
- Tone: ${generationRequest.aiPreferences.tone}
- Interactivity: ${generationRequest.aiPreferences.interactivity}
- Learning Style: ${generationRequest.userProfileContext.learningStyle}
- Examples: ${generationRequest.aiPreferences.examples}

Generate comprehensive module content that incorporates the available context and aligns with the user's learning preferences.
`;

      const moduleContentResult = await generateStructuredContent(
        moduleContentOutputSchema,
        modulePrompt,
        {
          model: "FAST",
          temperature: 0.7,
          systemPrompt: `You are an expert instructional designer creating detailed module content. Focus on:

1. Creating clear, actionable learning objectives
2. Structuring content progressively from basic to advanced
3. Incorporating practical examples and exercises
4. Suggesting relevant video resources
5. Providing assessment opportunities
6. Making content engaging and interactive
7. Adapting to different learning styles

Generate content that is immediately useful and can guide both content creation and student learning.`,
        }
      );

      const moduleContent = moduleContentResult.content;

      // Step 4: Enhance lessons with video recommendations
      metadata.set("substep", "enhancing_with_videos");
      
      const enhancedLessons = moduleContent.lessons.map((lesson, index) => {
        const relevantVideosForLesson = relevantVideos
          .filter(video => 
            video.title.toLowerCase().includes(lesson.title.toLowerCase().split(' ')[0]) ||
            video.description.toLowerCase().includes(lesson.title.toLowerCase().split(' ')[0])
          )
          .slice(0, 2)
          .map(video => ({
            id: video.id,
            title: video.title,
            duration: video.duration,
            relevanceScore: calculateRelevanceScore(lesson.title, video.title, video.description),
          }));

        return {
          ...lesson,
          suggestedVideos: relevantVideosForLesson,
        };
      });

      // Step 5: Finalize module content
      metadata.set("substep", "finalizing_content");
      
      const finalModuleContent = {
        ...moduleContent,
        moduleId: `module-${moduleInfo.orderIndex}-${Date.now()}`,
        lessons: enhancedLessons,
        metadata: {
          hasContextFromMaterials: relevantContext.length > 0,
          totalSuggestedVideos: relevantVideos.length,
          contextSources: relevantContext.length,
          generatedAt: new Date().toISOString(),
        },
      };

      metadata.set("substep", "completed");
      
      return {
        success: true,
        moduleContent: finalModuleContent,
        generationMetadata: {
          tokensUsed: moduleContentResult.usage?.totalTokens || 0,
          model: "groq-llama-3.1-70b",
          generatedAt: new Date().toISOString(),
          contextSources: relevantContext.length,
          videoSources: relevantVideos.length,
        },
      };

    } catch (error) {
      metadata.set("substep", "failed");
      metadata.set("error", error instanceof Error ? error.message : "Unknown error");
      
      console.error("Module content generation failed:", error);
      throw new Error(`Module content generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

function calculateRelevanceScore(lessonTitle: string, videoTitle: string, videoDescription: string): number {
  const lessonWords = lessonTitle.toLowerCase().split(' ');
  const videoText = (videoTitle + ' ' + videoDescription).toLowerCase();
  
  let score = 0;
  let totalWords = lessonWords.length;
  
  for (const word of lessonWords) {
    if (word.length > 3 && videoText.includes(word)) {
      score += 1;
    }
  }
  
  return Math.min(score / totalWords, 1.0);
}

export type ModuleContentTaskInput = z.infer<typeof moduleContentTaskSchema>;
export type ModuleContentTaskOutput = {
  success: boolean;
  moduleContent: z.infer<typeof moduleContentOutputSchema> & {
    metadata: {
      hasContextFromMaterials: boolean;
      totalSuggestedVideos: number;
      contextSources: number;
      generatedAt: string;
    };
  };
  generationMetadata: {
    tokensUsed: number;
    model: string;
    generatedAt: string;
    contextSources: number;
    videoSources: number;
  };
}; 
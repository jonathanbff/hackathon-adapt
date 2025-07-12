import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { metadata } from "@trigger.dev/sdk/v3";
import { courseGenerationInputSchema, courseStructureSchema } from "~/server/db/schemas";
import { generateStructuredContent, courseGenerationPrompts } from "~/server/tools/groq-ai";
import { vectorSearchTool } from "~/server/tools/vector-search";

const courseStructureTaskSchema = z.object({
  userId: z.string(),
  generationRequest: courseGenerationInputSchema,
});

export const generateCourseStructureTask = schemaTask({
  id: "course-generation.structure",
  schema: courseStructureTaskSchema,
  retry: {
    maxAttempts: 2,
  },
  run: async ({ userId, generationRequest }) => {
    try {
      metadata.set("step", "course_structure_generation");
      metadata.set("userId", userId);
      metadata.set("courseTitle", generationRequest.title);

      // Step 1: Gather context from uploaded materials if available
      let contextFromMaterials = "";
      if (generationRequest.materials?.documents?.length) {
        metadata.set("substep", "gathering_context_from_materials");
        
        const contextQueries = [
          `${generationRequest.title} course content`,
          `${generationRequest.userProfileContext.learningArea} ${generationRequest.difficulty} level`,
          generationRequest.description || generationRequest.title,
        ];

        const contextResults = await Promise.all(
          contextQueries.map(query => 
            vectorSearchTool.execute({
              query,
              limit: 3,
            })
          )
        );

        const relevantContext = contextResults
          .flatMap(result => result.results)
          .map(result => result.content)
          .join("\n\n");

        contextFromMaterials = relevantContext.substring(0, 2000); // Limit context length
      }

      // Step 2: Generate course structure using Groq
      metadata.set("substep", "generating_course_structure");
      
      const prompt = courseGenerationPrompts.courseStructure(generationRequest);
      const enhancedPrompt = contextFromMaterials 
        ? `${prompt}\n\nAdditional Context from Materials:\n${contextFromMaterials}`
        : prompt;

      const structureResult = await generateStructuredContent(
        courseStructureSchema,
        enhancedPrompt,
        {
          model: "FAST",
          temperature: 0.7,
          systemPrompt: `You are an expert educational course designer. Create comprehensive, well-structured courses that are engaging, progressive, and tailored to the learner's needs. 

Key principles:
1. Structure content logically from basic to advanced
2. Include clear learning objectives
3. Balance theoretical knowledge with practical application
4. Consider different learning styles
5. Make content engaging and interactive
6. Provide realistic time estimates
7. Include diverse content types

Generate a detailed course structure that can be immediately presented to the user, with the understanding that detailed content will be generated on-demand as the user progresses through the course.`,
        }
      );

      const courseStructure = structureResult.content;

      // Step 3: Validate and enhance the structure
      metadata.set("substep", "validating_structure");
      
      const validatedStructure = {
        ...courseStructure,
        modules: courseStructure.modules.map((module, index) => ({
          ...module,
          orderIndex: index + 1,
          lessons: module.lessons.map((lesson, lessonIndex) => ({
            ...lesson,
            orderIndex: lessonIndex + 1,
            contentTypes: lesson.contentTypes || ["text", "video", "interactive"],
          })),
        })),
      };

      // Step 4: Calculate realistic estimates
      metadata.set("substep", "calculating_estimates");
      
      const totalLessons = validatedStructure.modules.reduce(
        (sum, module) => sum + module.lessons.length, 
        0
      );
      
      const estimatedMinutesPerLesson = getEstimatedMinutesPerLesson(
        generationRequest.difficulty,
        generationRequest.format
      );
      
      const totalEstimatedMinutes = totalLessons * estimatedMinutesPerLesson;
      const estimatedDuration = formatDuration(totalEstimatedMinutes, generationRequest.duration);

      const finalStructure = {
        ...validatedStructure,
        estimatedTotalDuration: estimatedDuration,
        createdAt: new Date().toISOString(),
        generatedBy: "groq-ai",
        metadata: {
          totalModules: validatedStructure.modules.length,
          totalLessons,
          averageLessonsPerModule: Math.round(totalLessons / validatedStructure.modules.length),
          targetDuration: generationRequest.duration,
          difficulty: generationRequest.difficulty,
          learningArea: generationRequest.userProfileContext.learningArea,
          hasContext: !!contextFromMaterials,
        },
      };

      metadata.set("substep", "completed");
      
      return {
        success: true,
        courseStructure: finalStructure,
        generationMetadata: {
          tokensUsed: structureResult.usage?.totalTokens || 0,
          model: "groq-llama-3.1-70b",
          generatedAt: new Date().toISOString(),
          hasContextFromMaterials: !!contextFromMaterials,
        },
      };

    } catch (error) {
      metadata.set("substep", "failed");
      metadata.set("error", error instanceof Error ? error.message : "Unknown error");
      
      console.error("Course structure generation failed:", error);
      throw new Error(`Course structure generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

function getEstimatedMinutesPerLesson(difficulty: string, formats: string[]): number {
  const baseDuration = 15; // Base minutes per lesson
  
  const difficultyMultiplier = {
    beginner: 1.0,
    intermediate: 1.3,
    advanced: 1.6,
  }[difficulty] || 1.0;

  const formatMultiplier = formats.includes("video") ? 1.5 : 
                           formats.includes("interactive") ? 1.4 : 
                           formats.includes("practical") ? 1.6 : 1.0;

  return Math.round(baseDuration * difficultyMultiplier * formatMultiplier);
}

function formatDuration(totalMinutes: number, targetDuration: string): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  const formattedTime = hours > 0 
    ? `${hours}h ${minutes}m` 
    : `${minutes}m`;
  
  return `${formattedTime} (${targetDuration} target)`;
}

export type CourseStructureTaskInput = z.infer<typeof courseStructureTaskSchema>;
export type CourseStructureTaskOutput = {
  success: boolean;
  courseStructure: z.infer<typeof courseStructureSchema> & {
    createdAt: string;
    generatedBy: string;
    metadata: {
      totalModules: number;
      totalLessons: number;
      averageLessonsPerModule: number;
      targetDuration: string;
      difficulty: string;
      learningArea: string;
      hasContext: boolean;
    };
  };
  generationMetadata: {
    tokensUsed: number;
    model: string;
    generatedAt: string;
    hasContextFromMaterials: boolean;
  };
}; 
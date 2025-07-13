import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { courseGenerationInputSchema } from "~/server/db/schemas";

export const validateGenerationRequestTask = schemaTask({
  id: "course-generation.validate-request",
  schema: z.object({
    userId: z.string(),
    generationRequest: courseGenerationInputSchema,
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async ({ userId, generationRequest }) => {
    logger.log("Validating course generation request", {
      userId,
      title: generationRequest.title,
      goals: generationRequest.goals,
      duration: generationRequest.duration,
      difficulty: generationRequest.difficulty,
    });

    // Validate required fields
    if (!generationRequest.title || generationRequest.title.length === 0) {
      throw new Error("Course title is required");
    }

    if (!generationRequest.goals || generationRequest.goals.length === 0) {
      throw new Error("At least one learning goal is required");
    }

    if (!generationRequest.userProfileContext) {
      throw new Error("User profile context is required");
    }

    // Apply defaults for optional fields
    const courseSettings = {
      title: generationRequest.title,
      description: generationRequest.description || "",
      goals: generationRequest.goals,
      duration: generationRequest.duration,
      difficulty: generationRequest.difficulty,
      format: generationRequest.format,
      structure: generationRequest.structure,
      materials: generationRequest.materials || {
        documents: [],
        videos: [],
        audios: [],
        images: [],
      },
      aiPreferences: generationRequest.aiPreferences || {
        tone: "professional",
        interactivity: "medium",
        examples: "practical examples with real-world applications",
        pacing: "moderate pace with clear explanations",
      },
      userProfileContext: generationRequest.userProfileContext,
    };

    logger.log("Course generation request validated successfully", {
      userId,
      title: courseSettings.title,
      modulesCount: courseSettings.structure.modules,
      lessonsPerModule: courseSettings.structure.lessonsPerModule,
    });

    return {
      userId,
      courseSettings,
    };
  },
}); 
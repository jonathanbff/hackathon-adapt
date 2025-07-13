import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { courseGenerationInputSchema, courseGenerationRequests } from "~/server/db/schemas";
import { db } from "~/server/db";

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
    try {
      // Validate the input data
      const validatedData = courseGenerationInputSchema.parse(generationRequest);
      
      // Transform materials to match database schema
      const materials = validatedData.materials ? {
        documents: validatedData.materials.documents || [],
        videos: validatedData.materials.videos || [],
        audios: validatedData.materials.audios || [],
        images: validatedData.materials.images || [],
        roadmap: validatedData.materials.roadmap || null,
      } : null;

      // Create the course generation request in the database
      const [newRequest] = await db
        .insert(courseGenerationRequests)
        .values({
          userId,
          title: validatedData.title,
          description: validatedData.description,
          goals: validatedData.goals,
          duration: validatedData.duration,
          difficulty: validatedData.difficulty,
          format: validatedData.format,
          structure: validatedData.structure,
          materials,
          aiPreferences: validatedData.aiPreferences,
          userProfileContext: validatedData.userProfileContext,
          status: "processing",
          generationProgress: 10,
          currentStep: 1,
          isGenerating: true,
        })
        .returning();

      if (!newRequest) {
        throw new Error("Failed to create course generation request");
      }

      return {
        success: true,
        requestId: newRequest.id,
        validatedData,
        message: "Course generation request validated and created successfully",
      };
    } catch (error) {
      console.error("Error validating generation request:", error);
      throw new Error(`Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
}); 
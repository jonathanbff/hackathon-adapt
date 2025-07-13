import { schemaTask } from "@trigger.dev/sdk/v3";
import { generateObject } from "ai";
import { z } from "zod";
import { groq } from "@ai-sdk/groq";
import { modules, courseGenerationRequests, contentItems } from "~/server/db/schemas";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";

const moduleContentSchema = z.object({
  moduleContent: z.object({
    introduction: z.string(),
    objectives: z.array(z.string()),
    prerequisites: z.array(z.string()),
    keyTopics: z.array(z.string()),
    summary: z.string(),
    estimatedTime: z.string(),
  }),
});

export const generateModuleContentTask = schemaTask({
  id: "course-generation.generate-modules",
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
          generationProgress: 50,
          currentStep: 3,
        })
        .where(eq(courseGenerationRequests.id, requestId));

      const generatedModules = [];

      // Generate content for each module
      for (const moduleInfo of moduleData) {
        const modulePrompt = `
          Generate detailed content for the module "${moduleInfo.title}" in a ${validatedData.difficulty} level course.
          
                     Module Description: ${moduleInfo.description || 'No description provided'}
          
          Course Context:
          - Learning area: ${validatedData.userProfileContext.learningArea}
          - Learning style: ${validatedData.userProfileContext.learningStyle}
          - Current level: ${validatedData.userProfileContext.currentLevel}
          - Tone: ${validatedData.aiPreferences.tone}
          - Content format: ${validatedData.format.join(", ")}
          - Interactivity: ${validatedData.aiPreferences.interactivity}
          
          Lessons in this module:
                     ${moduleInfo.lessons.map(lesson => `- ${lesson.title}: ${lesson.description || 'No description provided'}`).join('\n')}
          
          Generate comprehensive module content including:
          1. Learning objectives
          2. Key concepts overview
          3. Prerequisites
          4. Module introduction
          5. Summary of what students will achieve
          
          Return a JSON structure with:
          {
            "moduleContent": {
              "introduction": "Module introduction text",
              "objectives": ["Learning objective 1", "Learning objective 2"],
              "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
              "keyTopics": ["Topic 1", "Topic 2"],
              "summary": "Module summary text",
              "estimatedTime": "X hours"
            }
          }
        `;

                          const { object } = await generateObject({
           model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
           prompt: modulePrompt,
           schema: moduleContentSchema,
           temperature: 0.7,
         }).catch(error => {
           console.error("Error generating module content:", error);
           throw new Error(`Failed to generate module content: ${error.message}`);
         });

         const moduleContent = object;

        // Update the module with generated content
        const [updatedModule] = await db
          .update(modules)
          .set({
                         description: `${moduleInfo.description || 'No description provided'}\n\n${moduleContent.moduleContent.introduction}`,
          })
          .where(eq(modules.id, moduleInfo.id))
          .returning();

        if (!updatedModule) {
          throw new Error(`Failed to update module ${moduleInfo.title}`);
        }

        // Create content items for the module
        const contentItemsData = [
          {
            lessonId: moduleInfo.lessons[0]?.id || "", // Use first lesson as container
            title: "Learning Objectives",
            content: moduleContent.moduleContent.objectives.join('\n'),
            contentType: "text",
            orderIndex: 1,
          },
          {
            lessonId: moduleInfo.lessons[0]?.id || "",
            title: "Prerequisites",
            content: moduleContent.moduleContent.prerequisites.join('\n'),
            contentType: "text",
            orderIndex: 2,
          },
          {
            lessonId: moduleInfo.lessons[0]?.id || "",
            title: "Key Topics",
            content: moduleContent.moduleContent.keyTopics.join('\n'),
            contentType: "text",
            orderIndex: 3,
          },
          {
            lessonId: moduleInfo.lessons[0]?.id || "",
            title: "Module Summary",
            content: moduleContent.moduleContent.summary,
            contentType: "text",
            orderIndex: 4,
          },
        ];

        // Insert content items
        for (const contentItem of contentItemsData) {
          if (contentItem.lessonId) {
            await db.insert(contentItems).values(contentItem);
          }
        }

        generatedModules.push({
          id: updatedModule.id,
          title: updatedModule.title,
          generatedContent: moduleContent.moduleContent,
          contentItemsCount: contentItemsData.length,
        });

        // Update progress incrementally
        const currentProgress = 50 + (generatedModules.length / moduleData.length) * 20;
        await db
          .update(courseGenerationRequests)
          .set({
            generationProgress: Math.round(currentProgress),
          })
          .where(eq(courseGenerationRequests.id, requestId));
      }

      return {
        success: true,
        courseId,
        generatedModules,
        totalModules: generatedModules.length,
        message: "Module content generated successfully",
      };
    } catch (error) {
      console.error("Error generating module content:", error);
      
      // Update request status to failed
      await db
        .update(courseGenerationRequests)
        .set({
          status: "failed",
          isGenerating: false,
        })
        .where(eq(courseGenerationRequests.id, requestId));

      throw new Error(`Module content generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
}); 
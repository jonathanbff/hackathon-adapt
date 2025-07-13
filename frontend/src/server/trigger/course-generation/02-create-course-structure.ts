import { schemaTask } from "@trigger.dev/sdk/v3";
import { generateObject } from "ai";
import { z } from "zod";
import { groq } from "@ai-sdk/groq";
import { courses, modules, lessons, courseGenerationRequests } from "~/server/db/schemas";
import { db } from "~/server/db";
import { eq } from "drizzle-orm";

const courseStructureSchema = z.object({
  course: z.object({
    title: z.string(),
    description: z.string(),
  }),
  modules: z.array(z.object({
    title: z.string(),
    description: z.string(),
    lessons: z.array(z.object({
      title: z.string(),
      description: z.string(),
    })),
  })),
});

export const createCourseStructureTask = schemaTask({
  id: "course-generation.create-structure",
  schema: z.object({
    requestId: z.string(),
    validatedData: z.object({
      title: z.string(),
      description: z.string().optional(),
      goals: z.array(z.string()),
      duration: z.string(),
      difficulty: z.string(),
      format: z.array(z.string()),
      structure: z.object({
        modules: z.number(),
        lessonsPerModule: z.number(),
        assessments: z.boolean(),
        projects: z.boolean(),
      }),
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
  run: async ({ requestId, validatedData }) => {
    try {
      // Update progress
      await db
        .update(courseGenerationRequests)
        .set({
          generationProgress: 25,
          currentStep: 2,
        })
        .where(eq(courseGenerationRequests.id, requestId));

      // Generate course structure using AI
      const structurePrompt = `
        Create a comprehensive course structure for a ${validatedData.difficulty} level course titled "${validatedData.title}".
        
        Requirements:
        - ${validatedData.structure.modules} modules
        - ${validatedData.structure.lessonsPerModule} lessons per module
        - Duration: ${validatedData.duration}
        - Learning goals: ${validatedData.goals.join(", ")}
        - Learning style: ${validatedData.userProfileContext.learningStyle}
        - Content format: ${validatedData.format.join(", ")}
        - Tone: ${validatedData.aiPreferences.tone}
        
        Return a JSON structure with:
        {
          "course": {
            "title": "Course Title",
            "description": "Course description"
          },
          "modules": [
            {
              "title": "Module Title",
              "description": "Module description",
              "lessons": [
                {
                  "title": "Lesson Title",
                  "description": "Lesson description"
                }
              ]
            }
          ]
        }
      `;

             const { object } = await generateObject({
         model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
         prompt: structurePrompt,
         schema: courseStructureSchema,
         temperature: 0.7,
       }).catch(error => {
         console.error("Error generating course structure:", error);
         throw new Error(`Failed to generate course structure: ${error.message}`);
       });

       const courseStructure = object;

      // Create the course record
      const [newCourse] = await db
        .insert(courses)
        .values({
          title: courseStructure.course.title,
          description: courseStructure.course.description,
          status: "draft",
        })
        .returning();

      if (!newCourse) {
        throw new Error("Failed to create course record");
      }

      // Link course to generation request
      await db
        .update(courseGenerationRequests)
        .set({
          courseId: newCourse.id,
          generationProgress: 35,
        })
        .where(eq(courseGenerationRequests.id, requestId));

             // Create modules and lessons
       const moduleData = [];
       for (let i = 0; i < courseStructure.modules.length; i++) {
         const moduleInfo = courseStructure.modules[i];
         
         if (!moduleInfo) {
           throw new Error(`Module ${i + 1} is undefined`);
         }
         
         const [newModule] = await db
           .insert(modules)
           .values({
             courseId: newCourse.id,
             title: moduleInfo.title,
             description: moduleInfo.description,
             orderIndex: i + 1,
           })
           .returning();

         if (!newModule) {
           throw new Error(`Failed to create module ${i + 1}`);
         }

         const lessonData = [];
         for (let j = 0; j < moduleInfo.lessons.length; j++) {
           const lessonInfo = moduleInfo.lessons[j];
           
           if (!lessonInfo) {
             throw new Error(`Lesson ${j + 1} in module ${i + 1} is undefined`);
           }
           
           const [newLesson] = await db
             .insert(lessons)
             .values({
               moduleId: newModule.id,
               title: lessonInfo.title,
               description: lessonInfo.description,
               orderIndex: j + 1,
             })
             .returning();

           if (!newLesson) {
             throw new Error(`Failed to create lesson ${j + 1} in module ${i + 1}`);
           }

           lessonData.push({
             id: newLesson.id,
             title: newLesson.title,
             description: newLesson.description,
             orderIndex: newLesson.orderIndex,
           });
         }

         moduleData.push({
           id: newModule.id,
           title: newModule.title,
           description: newModule.description,
           orderIndex: newModule.orderIndex,
           lessons: lessonData,
         });
       }

      return {
        success: true,
        courseId: newCourse.id,
        courseTitle: newCourse.title,
        moduleData,
        totalModules: moduleData.length,
        totalLessons: moduleData.reduce((sum, module) => sum + module.lessons.length, 0),
        message: "Course structure created successfully",
      };
    } catch (error) {
      console.error("Error creating course structure:", error);
      
      // Update request status to failed
      await db
        .update(courseGenerationRequests)
        .set({
          status: "failed",
          isGenerating: false,
        })
        .where(eq(courseGenerationRequests.id, requestId));

      throw new Error(`Course structure creation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
}); 
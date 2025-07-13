import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { db } from "../../db/connection";
import { courses, modules, lessons } from "../../db/schemas";

const courseStructureSchema = z.object({
  title: z.string(),
  description: z.string(),
  estimatedTotalDuration: z.string(),
  prerequisites: z.array(z.string()),
  learningObjectives: z.array(z.string()),
  modules: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      orderIndex: z.number(),
      estimatedDuration: z.string(),
      learningObjectives: z.array(z.string()),
      lessons: z.array(
        z.object({
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
});

export const createCourseStructureTask = schemaTask({
  id: "course-generation.create-structure",
  schema: z.object({
    userId: z.string(),
    courseSettings: z.object({
      title: z.string(),
      structure: z.object({
        modules: z.number(),
        lessonsPerModule: z.number(),
        assessments: z.boolean(),
        projects: z.boolean(),
      }),
      materials: z.any().optional(),
      userProfileContext: z.object({
        learningArea: z.string(),
        learningStyle: z.string(),
        currentLevel: z.string(),
        multipleIntelligences: z.array(z.string()),
        timeAvailable: z.string(),
        preferredSchedule: z.string(),
      }),
      aiPreferences: z.object({
        tone: z.string(),
        interactivity: z.string(),
        examples: z.string(),
        pacing: z.string(),
      }),
      goals: z.array(z.string()),
      duration: z.string(),
      difficulty: z.string(),
      format: z.array(z.string()),
    }),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async ({ userId, courseSettings }) => {
    logger.log("Creating course structure", {
      userId,
      title: courseSettings.title,
      modulesCount: courseSettings.structure.modules,
      lessonsPerModule: courseSettings.structure.lessonsPerModule,
    });

    const prompt = `Create a comprehensive course structure for "${courseSettings.title}".

Course Requirements:
- Target: ${courseSettings.userProfileContext.learningArea} learners
- Level: ${courseSettings.difficulty}
- Duration: ${courseSettings.duration}
- Goals: ${courseSettings.goals.join(", ")}
- Learning Style: ${courseSettings.userProfileContext.learningStyle}
- Current Level: ${courseSettings.userProfileContext.currentLevel}
- Preferred Formats: ${courseSettings.format.join(", ")}

Structure Requirements:
- ${courseSettings.structure.modules} modules
- ${courseSettings.structure.lessonsPerModule} lessons per module
- ${courseSettings.structure.assessments ? "Include assessments" : "No assessments"}
- ${courseSettings.structure.projects ? "Include projects" : "No projects"}

AI Preferences:
- Tone: ${courseSettings.aiPreferences.tone}
- Interactivity: ${courseSettings.aiPreferences.interactivity}
- Pacing: ${courseSettings.aiPreferences.pacing}

Create a structured course with clear learning progression, practical examples, and engaging content that matches the learner's profile.`;

    const { object: courseStructure } = await generateObject({
      model: groq("llama-3.3-70b-versatile"),
      schema: courseStructureSchema,
      prompt,
    });

    const [newCourse] = await db
      .insert(courses)
      .values({
        title: courseStructure.title,
        description: courseStructure.description,
        status: "generating",
      })
      .returning({
        id: courses.id,
        title: courses.title,
        description: courses.description,
      });

    if (!newCourse) {
      throw new Error("Failed to create course");
    }

    const modulePromises = courseStructure.modules.map(async (moduleData) => {
      const [newModule] = await db
        .insert(modules)
        .values({
          courseId: newCourse.id,
          title: moduleData.title,
          description: moduleData.description,
          orderIndex: moduleData.orderIndex,
        })
        .returning({
          id: modules.id,
          title: modules.title,
          description: modules.description,
          orderIndex: modules.orderIndex,
        });

      if (!newModule) {
        throw new Error(`Failed to create module: ${moduleData.title}`);
      }

      const lessonPromises = moduleData.lessons.map(async (lessonData) => {
        const [newLesson] = await db
          .insert(lessons)
          .values({
            moduleId: newModule.id,
            title: lessonData.title,
            description: lessonData.description,
            orderIndex: lessonData.orderIndex,
          })
          .returning({
            id: lessons.id,
            title: lessons.title,
            description: lessons.description,
            orderIndex: lessons.orderIndex,
          });

        if (!newLesson) {
          throw new Error(`Failed to create lesson: ${lessonData.title}`);
        }

        return {
          id: newLesson.id,
          title: newLesson.title,
          description: newLesson.description,
          orderIndex: newLesson.orderIndex,
          estimatedDuration: lessonData.estimatedDuration,
          contentTypes: lessonData.contentTypes,
          keyTopics: lessonData.keyTopics,
        };
      });

      const completedLessons = await Promise.all(lessonPromises);

      return {
        id: newModule.id,
        title: newModule.title,
        description: newModule.description,
        orderIndex: newModule.orderIndex,
        estimatedDuration: moduleData.estimatedDuration,
        learningObjectives: moduleData.learningObjectives,
        lessons: completedLessons,
      };
    });

    const completedModules = await Promise.all(modulePromises);

    const finalCourseStructure = {
      title: courseStructure.title,
      description: courseStructure.description,
      estimatedTotalDuration: courseStructure.estimatedTotalDuration,
      prerequisites: courseStructure.prerequisites,
      learningObjectives: courseStructure.learningObjectives,
      modules: completedModules,
    };

    logger.log("Course structure created successfully", {
      userId,
      courseId: newCourse.id,
      title: finalCourseStructure.title,
      modulesCount: finalCourseStructure.modules.length,
      totalLessons: finalCourseStructure.modules.reduce(
        (sum, module) => sum + module.lessons.length,
        0
      ),
    });

    return {
      userId,
      courseId: newCourse.id,
      courseStructure: finalCourseStructure,
    };
  },
}); 
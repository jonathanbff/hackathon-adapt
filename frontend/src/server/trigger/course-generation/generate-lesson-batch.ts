import { logger, schemaTask, tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { db } from "../../db/connection";
import { contentItems, articles, quizzes, quizQuestions, examples, lessons as lessonsTable, modules, youtubeVideos } from "../../db/schemas";
import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { eq } from "drizzle-orm";
import { env } from "../../../env";

const lessonContentSchema = z.object({
  summary: z.string().describe("Comprehensive lesson summary"),
  content: z.string().describe("Detailed lesson content in markdown"),
  keyTopics: z.array(z.string()).describe("Key topics covered in the lesson"),
  learningObjectives: z.array(z.string()).describe("Learning objectives for the lesson"),
  quiz: z.object({
    title: z.string(),
    questions: z.array(z.object({
      question: z.string(),
      questionType: z.enum(['multiple_choice', 'true_false', 'short_answer']),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string(),
    }))
  }),
  examples: z.array(z.object({
    title: z.string(),
    content: z.string(),
    type: z.enum(['practical', 'theoretical', 'real_world']),
  }))
});

// Video search function
async function searchVideoForLesson(lesson: any, moduleContext: any, courseSettings: any) {
  const searchQuery = `${lesson.title} ${moduleContext.title} ${courseSettings.userProfileContext.learningArea} ${courseSettings.difficulty} tutorial`;

  try {
    if (!courseSettings.format?.includes("video")) {
      return {
        videoAttached: false,
        message: "Video format not requested",
      };
    }

    const params = new URLSearchParams({
      engine: "youtube",
      q: searchQuery,
      api_key: env.SEARCHAPI_KEY || "",
    });

    const response = await fetch(`https://www.searchapi.io/api/v1/search?${params.toString()}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`YouTube search API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.videos || data.videos.length === 0) {
      return {
        videoAttached: false,
        message: "No relevant videos found",
      };
    }

    const topVideo = data.videos[0];
    if (!topVideo) {
      return {
        videoAttached: false,
        message: "No video data returned from search",
      };
    }

    // Helper function to parse relative time from YouTube API
    const parseRelativeTime = (timeString: string): Date => {
      if (!timeString) return new Date();
      
      const now = new Date();
      const lowerTime = timeString.toLowerCase();
      
      if (lowerTime.includes('hour')) {
        const hours = parseInt(lowerTime.match(/\d+/)?.[0] || '0');
        return new Date(now.getTime() - hours * 60 * 60 * 1000);
      } else if (lowerTime.includes('day')) {
        const days = parseInt(lowerTime.match(/\d+/)?.[0] || '0');
        return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      } else if (lowerTime.includes('week')) {
        const weeks = parseInt(lowerTime.match(/\d+/)?.[0] || '0');
        return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
      } else if (lowerTime.includes('month')) {
        const months = parseInt(lowerTime.match(/\d+/)?.[0] || '0');
        return new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000);
      } else if (lowerTime.includes('year')) {
        const years = parseInt(lowerTime.match(/\d+/)?.[0] || '0');
        return new Date(now.getTime() - years * 365 * 24 * 60 * 60 * 1000);
      }
      
      // If it's a standard date format, try to parse it
      const parsed = new Date(timeString);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    };

    const videoData = {
      youtubeId: topVideo.id,
      title: topVideo.title,
      description: topVideo.description || "",
      channelTitle: topVideo.channel?.title || "",
      duration: topVideo.length || "",
      views: topVideo.extracted_views || 0,
      publishedAt: parseRelativeTime(topVideo.published_time || ""),
      thumbnailUrl: topVideo.thumbnail?.static || topVideo.thumbnail?.rich || "",
      metadata: {
        searchQuery,
        lessonId: lesson.id,
        moduleTitle: moduleContext.title,
      },
    };

    // Check if video already exists
    const [existingVideo] = await db
      .select()
      .from(youtubeVideos)
      .where(eq(youtubeVideos.youtubeId, videoData.youtubeId))
      .limit(1);

    let videoId: string;
    if (existingVideo) {
      videoId = existingVideo.id;
    } else {
      const [newVideo] = await db
        .insert(youtubeVideos)
        .values(videoData)
        .returning({
          id: youtubeVideos.id,
        });

      if (!newVideo) {
        throw new Error("Failed to create video record");
      }
      videoId = newVideo.id;
    }

    // Create video content item
    const [videoContentItem] = await db
      .insert(contentItems)
      .values({
        lessonId: lesson.id,
        title: `Video: ${videoData.title}`,
        content: videoData.description,
        contentType: "video",
        orderIndex: 0, // Videos come first
      })
      .returning({
        id: contentItems.id,
      });

    if (!videoContentItem) {
      throw new Error("Failed to create video content item");
    }

    return {
      videoAttached: true,
      videoId,
      videoTitle: videoData.title,
      contentItemId: videoContentItem.id,
      searchQuery,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      videoAttached: false,
      error: errorMessage,
    };
  }
}

export const generateLessonBatchTask = schemaTask({
  id: "course-generation.generate-lesson-batch",
  schema: z.object({
    userId: z.string(),
    courseId: z.string().uuid(),
    lessons: z.array(z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string(),
      orderIndex: z.number(),
    })),
    moduleContext: z.object({
      title: z.string(),
      description: z.string(),
    }),
          courseSettings: z.object({
        title: z.string(),
        difficulty: z.string(),
        format: z.array(z.string()).optional(),
        userProfileContext: z.object({
          learningArea: z.string(),
          learningStyle: z.string(),
          currentLevel: z.string(),
        }),
        aiPreferences: z.object({
          tone: z.string(),
          examples: z.string(),
          pacing: z.string(),
        }),
      }),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async ({ userId, courseId, lessons, moduleContext, courseSettings }) => {
    logger.log("Starting comprehensive lesson generation (content + videos + quizzes + examples)", {
      userId,
      courseId,
      lessonsCount: lessons.length,
      moduleTitle: moduleContext.title,
    });

    const generatedLessons = [];

    for (const lesson of lessons) {
      try {
        logger.log("Generating lesson content", {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
        });

        const prompt = `Create comprehensive lesson content for "${lesson.title}" in the module "${moduleContext.title}".

Course Context:
- Course: ${courseSettings.title}
- Difficulty: ${courseSettings.difficulty}
- Learning Area: ${courseSettings.userProfileContext.learningArea}
- Learning Style: ${courseSettings.userProfileContext.learningStyle}
- Current Level: ${courseSettings.userProfileContext.currentLevel}

Module Context:
- Module: ${moduleContext.title}
- Description: ${moduleContext.description}

Lesson Details:
- Title: ${lesson.title}
- Description: ${lesson.description}

AI Preferences:
- Tone: ${courseSettings.aiPreferences.tone}
- Examples: ${courseSettings.aiPreferences.examples}
- Pacing: ${courseSettings.aiPreferences.pacing}

Generate comprehensive lesson content including:
1. Detailed lesson content (markdown format)
2. Key topics and learning objectives
3. A quiz with 3-5 questions appropriate for the difficulty level
4. 2-3 practical examples

Make the content engaging, educational, and appropriate for the specified learning style and difficulty level.`;

        const { object: lessonContent } = await generateObject({
          model: groq("llama-3.3-70b-versatile"),
          schema: lessonContentSchema,
          prompt,
        });

        // Step 1: Search and attach video
        logger.log("Searching for video", {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
        });

        const videoResult = await searchVideoForLesson(lesson, moduleContext, courseSettings);
        
        if (videoResult.error) {
          logger.warn("Video search failed", {
            lessonId: lesson.id,
            error: videoResult.error,
          });
        }

        // Step 2: Create the content item for lesson content
        const [contentItem] = await db
          .insert(contentItems)
          .values({
            lessonId: lesson.id,
            title: lesson.title,
            content: lesson.description,
            orderIndex: lesson.orderIndex,
            contentType: "lesson",
          })
          .returning();

        if (!contentItem) {
          throw new Error(`Failed to create content item for lesson ${lesson.title}`);
        }

        // Step 3: Create the article content
        const [article] = await db
          .insert(articles)
          .values({
            contentItemId: contentItem.id,
            title: lesson.title,
            content: lessonContent.content,
            references: JSON.stringify({
              keyTopics: lessonContent.keyTopics,
              learningObjectives: lessonContent.learningObjectives,
              summary: lessonContent.summary,
            }),
          })
          .returning();

        // Step 4: Create the quiz
        const [quiz] = await db
          .insert(quizzes)
          .values({
            contentItemId: contentItem.id,
            title: lessonContent.quiz.title,
            description: `Quiz for ${lesson.title}`,
          })
          .returning();

        if (quiz) {
          // Step 5: Create quiz questions
          for (const [index, question] of lessonContent.quiz.questions.entries()) {
            await db.insert(quizQuestions).values({
              quizId: quiz.id,
              question: question.question,
              questionType: question.questionType,
              options: question.options ? JSON.stringify(question.options) : null,
              correctAnswer: question.correctAnswer,
              orderIndex: index + 1,
            });
          }
        }

        // Step 6: Create examples
        for (const [index, example] of lessonContent.examples.entries()) {
          await db.insert(examples).values({
            contentItemId: contentItem.id,
            title: example.title,
            content: example.content,
            exampleType: example.type,
            orderIndex: index + 1,
          });
        }

        // Step 7: Mark lesson as generated
        await db
          .update(lessonsTable)
          .set({
            isContentGenerated: true,
            hasQuiz: lessonContent.quiz.questions.length > 0,
            hasExamples: lessonContent.examples.length > 0,
            updatedAt: new Date(),
          })
          .where(eq(lessonsTable.id, lesson.id));

        generatedLessons.push({
          lessonId: lesson.id,
          contentItemId: contentItem.id,
          title: lesson.title,
          summary: lessonContent.summary,
          keyTopics: lessonContent.keyTopics,
          examplesCount: lessonContent.examples.length,
          questionsCount: lessonContent.quiz.questions.length,
          videoAttached: videoResult.videoAttached,
          videoTitle: videoResult.videoTitle || null,
          videoId: videoResult.videoId || null,
        });

        logger.log("Complete lesson generated successfully", {
          lessonId: lesson.id,
          contentItemId: contentItem.id,
          examplesCount: lessonContent.examples.length,
          questionsCount: lessonContent.quiz.questions.length,
          videoAttached: videoResult.videoAttached,
          videoTitle: videoResult.videoTitle || "No video",
        });

      } catch (error) {
        logger.error("Failed to generate lesson", {
          lessonId: lesson.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw error;
      }
    }

    const videosAttached = generatedLessons.filter(lesson => lesson.videoAttached).length;
    const totalQuestions = generatedLessons.reduce((sum, lesson) => sum + lesson.questionsCount, 0);
    const totalExamples = generatedLessons.reduce((sum, lesson) => sum + lesson.examplesCount, 0);

    logger.log("Comprehensive lesson generation completed", {
      userId,
      courseId,
      generatedLessonsCount: generatedLessons.length,
      videosAttached,
      totalQuestions,
      totalExamples,
    });

    return {
      lessonsGenerated: generatedLessons,
      moduleTitle: moduleContext.title,
      totalLessons: lessons.length,
      videosAttached,
      totalQuestions,
      totalExamples,
    };
  },
}); 
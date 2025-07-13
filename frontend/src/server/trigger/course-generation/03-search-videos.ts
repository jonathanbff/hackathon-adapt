import { logger, schemaTask, tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { db } from "../../db/connection";
import { youtubeVideos, contentItems } from "../../db/schemas";
import { env } from "../../../env";
import { eq } from "drizzle-orm";

const videoSearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  link: z.string(),
  duration: z.string(),
  views: z.number().optional(),
  channel: z.object({
    id: z.string(),
    name: z.string(),
    verified: z.boolean().optional(),
  }),
  thumbnail: z.string().optional(),
  publishedTime: z.string().optional(),
  isLive: z.boolean().optional(),
});

export const searchVideoTask = schemaTask({
  id: "course-generation.search-video",
  schema: z.object({
    courseId: z.string().uuid(),
    lesson: z.object({
      id: z.string().uuid(),
      title: z.string(),
      description: z.string(),
      keyTopics: z.array(z.string()),
    }),
    moduleContext: z.object({
      title: z.string(),
      description: z.string(),
    }),
    courseSettings: z.object({
      title: z.string(),
      userProfileContext: z.object({
        learningArea: z.string(),
        currentLevel: z.string(),
      }),
      difficulty: z.string(),
      format: z.array(z.string()),
    }),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async ({ courseId, lesson, moduleContext, courseSettings }) => {
    logger.log("Searching for videos", {
      courseId,
      lessonId: lesson.id,
      title: lesson.title,
      module: moduleContext.title,
    });

    if (!courseSettings.format.includes("video")) {
      logger.log("Video format not requested, skipping video search", {
        courseId,
        lessonId: lesson.id,
      });
      return {
        courseId,
        lessonId: lesson.id,
        videoAttached: false,
        message: "Video format not requested",
      };
    }

    const searchQuery = `${lesson.title} ${moduleContext.title} ${courseSettings.userProfileContext.learningArea} ${courseSettings.difficulty} tutorial`;

    try {
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
        logger.log("No videos found for lesson", {
          courseId,
          lessonId: lesson.id,
          searchQuery,
        });
        return {
          courseId,
          lessonId: lesson.id,
          videoAttached: false,
          message: "No relevant videos found",
        };
      }

      const topVideo = data.videos[0];
      if (!topVideo) {
        throw new Error("No video data returned from search");
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
          courseTitle: courseSettings.title,
        },
      };

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

      const [videoContentItem] = await db
        .insert(contentItems)
        .values({
          lessonId: lesson.id,
          title: `Video: ${videoData.title}`,
          content: videoData.description,
          contentType: "video",
          orderIndex: 0,
        })
        .returning({
          id: contentItems.id,
        });

      if (!videoContentItem) {
        throw new Error("Failed to create video content item");
      }

      logger.log("Video attached to lesson successfully", {
        courseId,
        lessonId: lesson.id,
        videoId,
        videoTitle: videoData.title,
        contentItemId: videoContentItem.id,
      });

      return {
        courseId,
        lessonId: lesson.id,
        videoId,
        videoTitle: videoData.title,
        videoAttached: true,
        contentItemId: videoContentItem.id,
        searchQuery,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("Video search failed", {
        courseId,
        lessonId: lesson.id,
        searchQuery,
        error: errorMessage,
      });

      return {
        courseId,
        lessonId: lesson.id,
        videoAttached: false,
        error: errorMessage,
      };
    }
  },
});

export const searchVideosBatchTask = schemaTask({
  id: "course-generation.search-videos-batch",
  schema: z.object({
    userId: z.string(),
    courseId: z.string().uuid(),
    courseStructure: z.object({
      modules: z.array(
        z.object({
          id: z.string().uuid(),
          title: z.string(),
          description: z.string(),
          lessons: z.array(
            z.object({
              id: z.string().uuid(),
              title: z.string(),
              description: z.string(),
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
    logger.log("Starting batch video search", {
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
        },
      }))
    );

    const videoResults = [];
    const failedVideos = [];
    let videosAttachedCount = 0;

    for (const lesson of allLessons) {
      try {
        const result = await tasks.triggerAndWait(
          searchVideoTask.id,
          {
            courseId,
            lesson,
            moduleContext: lesson.moduleContext,
            courseSettings,
          }
        );

        if (result.ok) {
          videoResults.push(result.output);
          if (result.output.videoAttached) {
            videosAttachedCount++;
          }
        } else {
          throw new Error(`Task failed: ${result.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failedVideos.push({
          lessonId: lesson.id,
          error: errorMessage,
        });
        logger.error("Video search failed for lesson", {
          userId,
          courseId,
          lessonId: lesson.id,
          error: errorMessage,
        });
      }
    }

    if (failedVideos.length > 0) {
      logger.error("Some video searches failed", {
        userId,
        courseId,
        failedCount: failedVideos.length,
        totalCount: allLessons.length,
      });
    }

    logger.log("Video search completed", {
      userId,
      courseId,
      successfulCount: videoResults.length,
      videosAttachedCount,
      failedCount: failedVideos.length,
      totalCount: allLessons.length,
    });

    return {
      userId,
      courseId,
      courseStructure,
      courseSettings,
      videoResults,
      failedVideos,
      videosAttachedCount,
    };
  },
});

function parseDuration(duration: string): number {
  if (!duration) return 0;
  
  const parts = duration.split(':');
  if (parts.length === 1) return parseInt(parts[0] || '0') || 0;
  if (parts.length === 2) return (parseInt(parts[0] || '0') || 0) * 60 + (parseInt(parts[1] || '0') || 0);
  if (parts.length === 3) return (parseInt(parts[0] || '0') || 0) * 3600 + (parseInt(parts[1] || '0') || 0) * 60 + (parseInt(parts[2] || '0') || 0);
  
  return 0;
} 
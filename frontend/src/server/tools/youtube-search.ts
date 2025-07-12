import { tool } from "ai";
import { z } from "zod";
import { env } from "~/env";

const youtubeSearchSchema = z.object({
  query: z.string().describe("The search query to find relevant YouTube videos"),
  limit: z.number().default(5).describe("Maximum number of videos to return"),
  duration: z.enum(["short", "medium", "long", "any"]).default("any").describe("Filter by video duration"),
  sortBy: z.enum(["relevance", "date", "views", "rating"]).default("relevance").describe("Sort results by"),
});

export const youtubeSearchTool = tool({
  description: "Search YouTube for educational videos relevant to course content. Use this to find videos that can be incorporated into lessons.",
  parameters: youtubeSearchSchema,
  execute: async ({ query, limit, duration, sortBy }) => {
    try {
      const params = new URLSearchParams({
        engine: "youtube",
        q: query,
        api_key: env.SEARCHAPI_KEY || "",
      });

      if (duration !== "any") {
        params.append("duration", duration);
      }

      if (sortBy !== "relevance") {
        params.append("sort", sortBy);
      }

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
          videos: [],
          message: "No YouTube videos found for your query.",
          query,
        };
      }

      const videos = data.videos.slice(0, limit).map((video: any) => ({
        id: video.id,
        title: video.title,
        description: video.description || "",
        link: video.link,
        duration: video.length || "Unknown",
        views: video.extracted_views || 0,
        channel: {
          id: video.channel?.id || "",
          name: video.channel?.title || "",
          verified: video.channel?.verified === "Verified",
        },
        thumbnail: video.thumbnail?.static || video.thumbnail?.rich || "",
        publishedTime: video.published_time || "",
        isLive: video.live || false,
      }));

      return {
        videos,
        message: `Found ${videos.length} relevant YouTube videos.`,
        query,
        totalResults: data.search_information?.total_results || 0,
      };
    } catch (error) {
      console.error("YouTube search error:", error);
      return {
        videos: [],
        message: "An error occurred while searching YouTube videos. Please try again.",
        query,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

export interface YoutubeVideoResult {
  id: string;
  title: string;
  description: string;
  link: string;
  duration: string;
  views: number;
  channel: {
    id: string;
    name: string;
    verified: boolean;
  };
  thumbnail: string;
  publishedTime: string;
  isLive: boolean;
}

export interface YoutubeSearchResult {
  videos: YoutubeVideoResult[];
  message: string;
  query: string;
  totalResults?: number;
  error?: string;
} 
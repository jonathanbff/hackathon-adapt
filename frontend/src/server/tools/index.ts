import { tool } from "ai";
import { vectorSearchTool } from "./vector-search";
import { webSearchTool } from "./web-search";
import { youtubeSearchTool } from "./youtube-search";

export const tools = {
  vector_search: vectorSearchTool,
  web_search: webSearchTool,
  youtube_search: youtubeSearchTool,
};

export * from "./groq-ai";

export type ToolsType = typeof tools; 
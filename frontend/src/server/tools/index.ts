import { tool } from "ai";
import { vectorSearchTool } from "./vector-search";
import { webSearchTool } from "./web-search";

export const tools = {
  vector_search: vectorSearchTool,
  web_search: webSearchTool,
};

export type ToolsType = typeof tools; 
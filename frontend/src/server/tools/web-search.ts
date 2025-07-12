import { tool } from "ai";
import { z } from "zod";

const webSearchSchema = z.object({
  query: z.string().describe("The search query to find current information on the web"),
  limit: z.number().default(5).describe("Maximum number of search results to return"),
});

export const webSearchTool = tool({
  description: "Search the web for current information, news, or data that may not be available in the document database. Use this when users ask for recent information or when vector search doesn't return relevant results.",
  parameters: webSearchSchema,
  execute: async ({ query, limit }) => {
    try {
      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&limit=${limit}`;
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ChatBot/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`Search API returned ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.RelatedTopics || data.RelatedTopics.length === 0) {
        return {
          results: [],
          message: "No web search results found for your query.",
          query,
        };
      }

      const results = data.RelatedTopics.slice(0, limit).map((item: any, index: number) => ({
        id: `web-${index}`,
        title: item.Text?.split(' - ')[0] || "No title",
        snippet: item.Text || "No description available",
        url: item.FirstURL || "#",
        source: "DuckDuckGo",
      }));

      return {
        results,
        message: `Found ${results.length} web search results.`,
        query,
      };
    } catch (error) {
      console.error("Web search error:", error);
      
      const fallbackResults = [{
        id: "web-fallback",
        title: "Search not available",
        snippet: `I apologize, but I couldn't search the web for "${query}" at the moment. Please try rephrasing your question or check if the information might be available in the uploaded documents.`,
        url: "#",
        source: "System",
      }];

      return {
        results: fallbackResults,
        message: "Web search temporarily unavailable. Using fallback response.",
        query,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
}); 
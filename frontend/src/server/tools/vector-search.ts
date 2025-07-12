import { tool } from "ai";
import { z } from "zod";
import { Index } from "@upstash/vector";
import { env } from "~/env";

const vectorSearchSchema = z.object({
  query: z.string().describe("The search query to find relevant documents"),
  limit: z.number().default(5).describe("Maximum number of results to return"),
});

export const vectorSearchTool = tool({
  description: "Search through ingested documents using vector similarity search. Use this to find relevant information from uploaded documents.",
  parameters: vectorSearchSchema,
  execute: async ({ query, limit }) => {
    try {
      const index = new Index({
        url: env.UPSTASH_VECTOR_REST_URL,
        token: env.UPSTASH_VECTOR_REST_TOKEN,
      });

      const queryResults = await index.query({
        data: query,
        topK: limit,
        includeMetadata: true,
        includeData: true,
      });

      if (!queryResults || queryResults.length === 0) {
        return {
          results: [],
          message: "No relevant documents found for your query.",
        };
      }

      const results = queryResults.map((result) => ({
        id: result.id,
        content: result.data || "No content available",
        score: result.score,
        metadata: {
          documentId: result.metadata?.documentId,
          filename: result.metadata?.filename,
          userId: result.metadata?.userId,
          chunkIndex: result.metadata?.chunkIndex,
          createdAt: result.metadata?.createdAt,
        },
      }));

      return {
        results,
        message: `Found ${results.length} relevant document chunks.`,
        query,
      };
    } catch (error) {
      console.error("Vector search error:", error);
      return {
        results: [],
        message: "An error occurred while searching documents. Please try again.",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
}); 
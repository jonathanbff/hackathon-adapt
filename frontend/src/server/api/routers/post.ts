import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    // Since we don't have a posts table yet, return a mock response
    return {
      id: 1,
      title: "Latest Post",
      content: "This is the latest post content",
      createdAt: new Date(),
    };
  }),
}); 
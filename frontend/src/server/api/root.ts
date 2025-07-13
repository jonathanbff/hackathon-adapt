import { postRouter } from "~/server/api/routers/post";
import { userRouter } from "~/server/api/routers/user";
import { chatRouter } from "~/server/api/routers/chat";
import { flashcardsRouter } from "~/server/api/routers/flashcards";
import { coursesRouter } from "~/server/api/routers/courses";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  user: userRouter,
  chat: chatRouter,
  flashcards: flashcardsRouter,
  courses: coursesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

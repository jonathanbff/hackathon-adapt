import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { courseGenerationInputSchema, courses, courseGenerationRequests, modules } from "~/server/db/schemas";
import { runs, tasks } from "@trigger.dev/sdk/v3";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";

export const courseGenerationRouter = createTRPCRouter({
  generate: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        generationRequest: courseGenerationInputSchema,
      })
    )
    .mutation(async ({ input }) => {
      try {
        const run = await tasks.trigger("course-generation.main", {
          userId: input.userId,
          generationRequest: input.generationRequest,
        });

        return {
          success: true,
          runId: run.id,
          message: "Full AI course generation started successfully",
        };
      } catch (error) {
        console.error("Failed to trigger course generation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start course generation",
        });
      }
    }),

  getStatus: publicProcedure
    .input(z.object({ runId: z.string() }))
    .query(async ({ input }) => {
      try {
        const run = await runs.retrieve(input.runId);
        
        return {
          id: run.id,
          status: run.status,
          isCompleted: run.status === "COMPLETED",
          isFailed: run.status === "FAILED",
          metadata: run.metadata,
          output: run.output,
          createdAt: run.createdAt,
          updatedAt: run.updatedAt,
        };
      } catch (error) {
        console.error("Failed to retrieve run status:", error);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Run not found",
        });
      }
    }),

  getRequestStatus: publicProcedure
    .input(z.object({ requestId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const [request] = await ctx.db
          .select()
          .from(courseGenerationRequests)
          .where(eq(courseGenerationRequests.id, input.requestId))
          .limit(1);

        if (!request) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Request not found",
          });
        }

        return {
          id: request.id,
          status: request.status,
          isCompleted: request.status === "completed",
          isFailed: request.status === "failed",
          isGenerating: request.isGenerating,
          generationProgress: request.generationProgress,
          currentStep: request.currentStep,
          courseId: request.courseId,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
        };
      } catch (error) {
        console.error("Failed to retrieve request status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve request status",
        });
      }
    }),

  getModules: publicProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const moduleList = await ctx.db
          .select()
          .from(modules)
          .where(eq(modules.courseId, input.courseId))
          .orderBy(modules.orderIndex);

        return {
          modules: moduleList,
        };
      } catch (error) {
        console.error("Failed to fetch modules:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch modules",
        });
      }
    }),

  getResult: publicProcedure
    .input(z.object({ runId: z.string() }))
    .query(async ({ input }) => {
      try {
        const run = await runs.retrieve(input.runId);
        
        if (run.status !== "COMPLETED") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Course generation is not completed yet",
          });
        }

        return {
          success: true,
          result: run.output,
          completedAt: run.finishedAt,
        };
      } catch (error) {
        console.error("Failed to retrieve run result:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve generation result",
        });
      }
    }),

  getCourse: publicProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const [course] = await ctx.db
          .select()
          .from(courses)
          .where(eq(courses.id, input.courseId))
          .limit(1);

        if (course) {
          return course;
        }

        const [request] = await ctx.db
          .select()
          .from(courseGenerationRequests)
          .where(eq(courseGenerationRequests.id, input.courseId))
          .limit(1);

        if (request && request.courseId) {
          const [actualCourse] = await ctx.db
            .select()
            .from(courses)
            .where(eq(courses.id, request.courseId))
            .limit(1);

          if (actualCourse) {
            return actualCourse;
          }
        }

        if (request) {
          return {
            id: request.id,
            title: request.title,
            description: request.description || "Course is being generated...",
            status: request.status,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
            isGenerationRequest: true,
            generationProgress: request.generationProgress,
            currentStep: request.currentStep,
            isGenerating: request.isGenerating,
          };
        }

        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found",
        });
      } catch (error) {
        console.error("Failed to fetch course:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch course data",
        });
      }
    }),

  getRuns: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const runsResult = await runs.list({
          limit: input.limit,
          tag: input.userId,
        });

        return {
          runs: runsResult.data.map((run) => ({
            id: run.id,
            status: run.status,
            metadata: run.metadata,
            createdAt: run.createdAt,
            updatedAt: run.updatedAt,
            isCompleted: run.status === "COMPLETED",
            isFailed: run.status === "FAILED",
          })),
          pagination: {
            limit: input.limit,
            offset: input.offset,
            hasNext: !!runsResult.pagination.next,
            hasPrevious: !!runsResult.pagination.previous,
          },
        };
      } catch (error) {
        console.error("Failed to retrieve runs:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve generation runs",
        });
      }
    }),

  getAllCourses: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const allCourses = await ctx.db
          .select({
            id: courses.id,
            title: courses.title,
            description: courses.description,
            status: courses.status,
            createdAt: courses.createdAt,
            updatedAt: courses.updatedAt,
          })
          .from(courses)
          .orderBy(desc(courses.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        const pendingRequests = await ctx.db
          .select({
            id: courseGenerationRequests.id,
            title: courseGenerationRequests.title,
            description: courseGenerationRequests.description,
            status: courseGenerationRequests.status,
            createdAt: courseGenerationRequests.createdAt,
            updatedAt: courseGenerationRequests.updatedAt,
            userId: courseGenerationRequests.userId,
            isGenerating: courseGenerationRequests.isGenerating,
            generationProgress: courseGenerationRequests.generationProgress,
          })
          .from(courseGenerationRequests)
          .orderBy(desc(courseGenerationRequests.createdAt))
          .limit(10);

        const coursesWithType = allCourses.map(course => ({
          ...course,
          type: "completed" as const,
        }));

        const requestsWithType = pendingRequests
          .filter(req => req.status !== "completed")
          .map(request => ({
            id: request.id,
            title: request.title,
            description: request.description || "Course being generated...",
            status: request.status,
                         createdAt: request.createdAt,
             updatedAt: request.updatedAt,
             type: "generating" as const,
            isGenerating: request.isGenerating,
            generationProgress: request.generationProgress,
          }));

        const combinedResults = [...requestsWithType, ...coursesWithType]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, input.limit);

        return {
          courses: combinedResults,
          pagination: {
            limit: input.limit,
            offset: input.offset,
            total: allCourses.length + requestsWithType.length,
          },
        };
      } catch (error) {
        console.error("Failed to fetch all courses:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch courses",
        });
      }
    }),
}); 
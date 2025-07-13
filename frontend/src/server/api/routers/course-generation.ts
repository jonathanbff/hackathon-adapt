import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { courseGenerationInputSchema, courses, modules } from "~/server/db/schemas";
import { runs, tasks } from "@trigger.dev/sdk/v3";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";

export const courseGenerationRouter = createTRPCRouter({
  generate: publicProcedure
    .input(
      z.object({
        userId: z.string(),
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
          message: "AI course generation started successfully",
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

        if (!course) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Course not found",
          });
        }

        return course;
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

        return {
          courses: allCourses.map(course => ({
            ...course,
            type: "completed" as const,
          })),
          pagination: {
            limit: input.limit,
            offset: input.offset,
            total: allCourses.length,
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

  generateMoreLessons: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        courseId: z.string(),
        moduleId: z.string(),
        startFromIndex: z.number(),
        count: z.number().default(2),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const run = await tasks.trigger("course-generation.generate-more-lessons", {
          userId: input.userId,
          courseId: input.courseId,
          moduleId: input.moduleId,
          startFromIndex: input.startFromIndex,
          count: input.count,
        });

        return {
          success: true,
          runId: run.id,
          message: "On-demand lesson generation started successfully",
        };
      } catch (error) {
        console.error("Failed to trigger on-demand lesson generation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to start on-demand lesson generation",
        });
      }
    }),
}); 
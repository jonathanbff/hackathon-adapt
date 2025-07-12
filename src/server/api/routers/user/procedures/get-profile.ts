import { publicProcedure } from "~/server/api/trpc";
import { type User, users } from "~/server/db/schemas/users";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const getProfile = publicProcedure
  .input(
    z.object({
      userId: z.string().uuid(),
    })
  )
  .query(async ({ ctx, input }) => {
    const [userProfile] = await ctx.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, input.userId));

    if (!userProfile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User profile not found",
      });
    }

    return userProfile;
  }); 
import { protectedProcedure } from "~/server/api/trpc";
import { type User, users } from "~/server/db/schemas/users";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const getProfile = protectedProcedure
  .query(async ({ ctx }) => {
    const [userProfile] = await ctx.db
      .select({
        id: users.id,
        clerkId: users.clerkId,
        email: users.email,
        name: users.name,
        imageUrl: users.imageUrl,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        onboardingCompleted: users.onboardingCompleted,
        metadata: users.metadata,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.clerkId, ctx.auth.userId));

    if (!userProfile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User profile not found",
      });
    }

    return userProfile;
  }); 
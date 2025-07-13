import { protectedProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schemas/users";
import { eq } from "drizzle-orm";
import { clerkClient } from "~/lib/auth";
import { ONBOARDING_STATUS } from "~/types/auth";

export const completeOnboarding = protectedProcedure.mutation(
  async ({ ctx }) => {
    await clerkClient.users.updateUser(ctx.auth.userId, {
      publicMetadata: {
        onboardingStatus: ONBOARDING_STATUS.COMPLETED,
      },
    });

    const [updatedUser] = await ctx.db
      .update(users)
      .set({
        onboardingCompleted: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, ctx.auth.userId))
      .returning();

    return updatedUser;
  }
);

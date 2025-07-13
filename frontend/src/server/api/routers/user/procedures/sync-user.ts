import { protectedProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schemas/users";
import { eq } from "drizzle-orm";
import { clerkClient } from "~/lib/auth";

export const syncUser = protectedProcedure
  .mutation(async ({ ctx }) => {
    const clerkUser = await clerkClient.users.getUser(ctx.auth.userId);
    
    const existingUser = await ctx.db
      .select()
      .from(users)
      .where(eq(users.clerkId, ctx.auth.userId))
      .limit(1);

    const userData = {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
      imageUrl: clerkUser.imageUrl,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      username: clerkUser.username,
      metadata: clerkUser.publicMetadata,
      updatedAt: new Date(),
    };

    if (existingUser.length === 0) {
      const [newUser] = await ctx.db
        .insert(users)
        .values(userData)
        .returning();
      
      return newUser;
    } else {
      const [updatedUser] = await ctx.db
        .update(users)
        .set(userData)
        .where(eq(users.clerkId, ctx.auth.userId))
        .returning();
      
      return updatedUser;
    }
  }); 
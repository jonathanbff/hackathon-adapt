import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { chatConversations, chatMessages } from "~/server/db/schemas";
import { eq, desc } from "drizzle-orm";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

export const chatRouter = createTRPCRouter({
  getConversations: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({
        id: chatConversations.id,
        title: chatConversations.title,
        createdAt: chatConversations.createdAt,
        updatedAt: chatConversations.updatedAt,
      })
      .from(chatConversations)
      .orderBy(desc(chatConversations.updatedAt))
      .limit(20);
  }),

  getConversation: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const conversation = await ctx.db
        .select()
        .from(chatConversations)
        .where(eq(chatConversations.id, input.id))
        .limit(1);

      if (!conversation.length) {
        throw new Error("Conversation not found");
      }

      const messages = await ctx.db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, input.id))
        .orderBy(chatMessages.createdAt);

      return {
        conversation: conversation[0],
        messages,
      };
    }),

  createConversation: publicProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255).optional(),
        videoId: z.string().uuid().optional(),
        userId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [conversation] = await ctx.db
        .insert(chatConversations)
        .values({
          title: input.title ?? "New Conversation",
          userId: input.userId ?? null,
          videoId: input.videoId ?? null,
        })
        .returning();

      return conversation;
    }),

  addMessage: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1),
        references: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [message] = await ctx.db
        .insert(chatMessages)
        .values({
          conversationId: input.conversationId,
          role: input.role,
          content: input.content,
          references: input.references,
        })
        .returning();

      await ctx.db
        .update(chatConversations)
        .set({ updatedAt: new Date() })
        .where(eq(chatConversations.id, input.conversationId));

      // Auto-generate title after first user message
      if (input.role === "user") {
        const messageCount = await ctx.db
          .select({ count: chatMessages.id })
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, input.conversationId));

        if (messageCount.length === 1) {
          // This is the first message, generate title asynchronously
          setTimeout(async () => {
            try {
              const { text } = await generateText({
                model: groq("llama-3.1-8b-instant"),
                prompt: `Generate a short, descriptive title (max 50 characters) for this conversation based on the user's first message. Be concise and capture the main topic. Only return the title, no quotes or extra text.

User message: ${input.content}

Title:`,
                maxTokens: 20,
                temperature: 0.7,
              });

              const title = text.trim().replace(/['"]/g, "").slice(0, 50);

              await ctx.db
                .update(chatConversations)
                .set({
                  title: title || "New Conversation",
                  updatedAt: new Date(),
                })
                .where(eq(chatConversations.id, input.conversationId));
            } catch (error) {
              console.error("Error auto-generating conversation title:", error);
            }
          }, 100);
        }
      }

      return message;
    }),

  updateConversationTitle: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [conversation] = await ctx.db
        .update(chatConversations)
        .set({
          title: input.title,
          updatedAt: new Date(),
        })
        .where(eq(chatConversations.id, input.id))
        .returning();

      return conversation;
    }),

  deleteConversation: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(chatMessages)
        .where(eq(chatMessages.conversationId, input.id));

      await ctx.db
        .delete(chatConversations)
        .where(eq(chatConversations.id, input.id));

      return { success: true };
    }),

  generateConversationTitle: publicProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const messages = await ctx.db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, input.conversationId))
        .orderBy(chatMessages.createdAt)
        .limit(4);

      if (messages.length === 0) {
        return { title: "New Conversation" };
      }

      const conversationContext = messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      try {
        const { text } = await generateText({
          model: groq("llama-3.1-8b-instant"),
          prompt: `Generate a short, descriptive title (max 50 characters) for this conversation. Be concise and capture the main topic. Only return the title, no quotes or extra text.

Conversation:
${conversationContext}

Title:`,
          maxTokens: 20,
          temperature: 0.7,
        });

        const title = text.trim().replace(/['"]/g, "").slice(0, 50);

        const [updatedConversation] = await ctx.db
          .update(chatConversations)
          .set({
            title: title || "New Conversation",
            updatedAt: new Date(),
          })
          .where(eq(chatConversations.id, input.conversationId))
          .returning();

        return { title: updatedConversation?.title || "New Conversation" };
      } catch (error) {
        console.error("Error generating conversation title:", error);
        
        const fallbackTitle = messages[0]?.content.slice(0, 50) || "New Conversation";
        
        const [updatedConversation] = await ctx.db
          .update(chatConversations)
          .set({
            title: fallbackTitle,
            updatedAt: new Date(),
          })
          .where(eq(chatConversations.id, input.conversationId))
          .returning();

        return { title: updatedConversation?.title || "New Conversation" };
      }
    }),
}); 
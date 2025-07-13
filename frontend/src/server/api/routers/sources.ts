import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { documents, assets } from "~/server/db/schemas/assets";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const sourcesRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const documentsWithAssets = await ctx.db
          .select({
            id: documents.id,
            filename: documents.filename,
            documentType: documents.documentType,
            processingStatus: documents.processingStatus,
            metadata: documents.metadata,
            createdAt: documents.createdAt,
            updatedAt: documents.updatedAt,
            assetUrl: assets.url,
            assetSize: assets.size,
            contentType: assets.contentType,
          })
          .from(documents)
          .leftJoin(assets, eq(documents._asset, assets.id))
          .orderBy(desc(documents.createdAt))
          .limit(input.limit)
          .offset(input.offset);

        return {
          documents: documentsWithAssets,
          pagination: {
            limit: input.limit,
            offset: input.offset,
            hasMore: documentsWithAssets.length === input.limit,
          },
        };
      } catch (error) {
        console.error("Failed to fetch documents:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch sources",
        });
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const [documentWithAsset] = await ctx.db
          .select({
            id: documents.id,
            filename: documents.filename,
            documentType: documents.documentType,
            processingStatus: documents.processingStatus,
            metadata: documents.metadata,
            createdAt: documents.createdAt,
            updatedAt: documents.updatedAt,
            assetUrl: assets.url,
            assetSize: assets.size,
            contentType: assets.contentType,
          })
          .from(documents)
          .leftJoin(assets, eq(documents._asset, assets.id))
          .where(eq(documents.id, input.id))
          .limit(1);

        if (!documentWithAsset) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }

        return documentWithAsset;
      } catch (error) {
        console.error("Failed to fetch document:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch document",
        });
      }
    }),

  getStats: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const totalCount = await ctx.db
          .select()
          .from(documents);

        const processingCount = await ctx.db
          .select()
          .from(documents)
          .where(eq(documents.processingStatus, "pending"));

        return {
          total: totalCount.length,
          processing: processingCount.length,
          completed: totalCount.length - processingCount.length,
        };
      } catch (error) {
        console.error("Failed to fetch document stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch document statistics",
        });
      }
    }),

  debugStatus: publicProcedure
    .input(z.object({ documentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const [document] = await ctx.db
          .select({
            id: documents.id,
            filename: documents.filename,
            processingStatus: documents.processingStatus,
            createdAt: documents.createdAt,
            updatedAt: documents.updatedAt,
          })
          .from(documents)
          .where(eq(documents.id, input.documentId))
          .limit(1);

        if (!document) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }

        console.log(`[DEBUG] Document ${input.documentId} status:`, document);
        return document;
      } catch (error) {
        console.error("Failed to fetch document status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch document status",
        });
      }
    }),

  // Temporary endpoint to fix stuck documents
  fixStuckDocuments: publicProcedure
    .mutation(async ({ ctx }) => {
      try {
        // Find all documents that are stuck in pending status for more than 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const stuckDocuments = await ctx.db
          .select({
            id: documents.id,
            filename: documents.filename,
            processingStatus: documents.processingStatus,
            createdAt: documents.createdAt,
          })
          .from(documents)
          .where(eq(documents.processingStatus, "pending"));

        const results = [];
        
        for (const doc of stuckDocuments) {
          // Check if document is older than 5 minutes
          if (new Date(doc.createdAt) < fiveMinutesAgo) {
            // Mark as completed (temporary fix)
            await ctx.db
              .update(documents)
              .set({
                processingStatus: "completed",
                updatedAt: new Date(),
              })
              .where(eq(documents.id, doc.id));
              
            results.push({
              id: doc.id,
              filename: doc.filename,
              action: "marked_as_completed",
            });
          } else {
            results.push({
              id: doc.id,
              filename: doc.filename,
              action: "too_recent_to_fix",
            });
          }
        }

        console.log(`[FIX] Updated ${results.length} stuck documents:`, results);
        return {
          success: true,
          updatedDocuments: results,
        };
      } catch (error) {
        console.error("Failed to fix stuck documents:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fix stuck documents",
        });
      }
    }),
}); 
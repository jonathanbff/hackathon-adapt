import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { put } from "@vercel/blob";
import { db } from "~/server/db/connection";
import { assets } from "~/server/db/schemas/assets";

export const storeDocumentBlobTask = schemaTask({
  id: "ingestion.store-document-blob",
  schema: z.object({
    document: z.object({
      id: z.string(),
      url: z.string(),
      filename: z.string(),
    }),
    userId: z.string(),
    documentType: z.enum(["pdf", "docx", "txt", "other"]),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async ({ document, userId, documentType }) => {
    logger.log("Storing document in blob storage", {
      documentId: document.id,
      filename: document.filename,
      userId: userId,
      documentType: documentType,
    });

    const response = await fetch(document.url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch document: ${response.status} ${response.statusText}`
      );
    }

    const documentBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "application/octet-stream";

    const fileExtension = document.filename.split('.').pop() || documentType;
    const blobPath = `${userId}/documents/${document.id}.${fileExtension}`;

    const blob = await put(blobPath, documentBuffer, {
      access: "public",
      contentType: contentType,
      addRandomSuffix: true,
    });

    const [newAsset] = await db
      .insert(assets)
      .values({
        _clerk: userId,
        url: blob.url,
        pathname: blob.pathname,
      })
      .returning({
        id: assets.id,
        url: assets.url,
        pathname: assets.pathname,
      });

    if (!newAsset) {
      throw new Error("Failed to store document asset in database");
    }

    logger.log("Document stored successfully", {
      documentId: document.id,
      assetId: newAsset.id,
      blobUrl: blob.url,
      userId: userId,
    });

    return {
      assetId: newAsset.id,
      blobUrl: blob.url,
      pathname: blob.pathname,
      size: documentBuffer.byteLength,
      contentType: contentType,
    };
  },
}); 
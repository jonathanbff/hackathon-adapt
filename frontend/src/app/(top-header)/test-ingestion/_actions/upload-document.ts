"use server";

import { put } from "@vercel/blob";
import { tasks } from "@trigger.dev/sdk/v3";
import { db } from "~/server/db/connection";
import { documents, assets } from "~/server/db/schemas/assets";
import { mainIngestionTask } from "~/server/trigger/ingestion";
import { randomUUID } from "crypto";

export async function uploadDocument(formData: FormData) {
  try {
    const userId = "test-user-" + randomUUID().slice(0, 8);

    const file = formData.get("file") as File;
    if (!file) {
      return { error: "No file provided" };
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { error: "File size must be less than 10MB" };
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      return { error: "Please upload a PDF, DOCX, or TXT file" };
    }

    const documentId = randomUUID();
    const fileExtension = file.name.split('.').pop() || 'unknown';
    const blobPath = `${userId}/test-documents/${documentId}.${fileExtension}`;

    const blob = await put(blobPath, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: true,
    });

    const [newAsset] = await db.insert(assets).values({
      _clerk: userId,
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      size: file.size,
    }).returning({ id: assets.id });

    if (!newAsset) {
      throw new Error("Failed to create asset");
    }

    await db.insert(documents).values({
      id: documentId,
      _clerk: userId,
      _asset: newAsset.id,
      filename: file.name,
      documentType: file.type === "application/pdf" ? "pdf" : 
                    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? "docx" : "txt",
      processingStatus: "pending",
      metadata: {
        originalSize: file.size,
        uploadedAt: new Date().toISOString(),
        testUpload: true,
      },
    });

    await tasks.trigger<typeof mainIngestionTask>("ingestion.main", {
      document: {
        id: documentId,
        url: blob.url,
        filename: file.name,
      },
      userId: userId,
    });

    return {
      success: true,
      documentId: documentId,
      message: "Document uploaded and processing started",
    };
  } catch (error) {
    console.error("Upload error:", error);
    return { error: "Upload failed. Please try again." };
  }
} 
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { db } from "~/server/db/connection";
import { content } from "~/server/db/schemas/content";

const boundingBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  page: z.number(),
});

const layoutElementSchema = z.object({
  type: z.enum(["header", "paragraph", "table", "list", "image", "footer"]),
  content: z.string(),
  boundingBox: boundingBoxSchema,
  metadata: z.record(z.string(), z.any()).optional(),
});

const documentMetadataSchema = z.object({
  title: z.string().nullable(),
  author: z.string().nullable(),
  subject: z.string().nullable(),
  keywords: z.array(z.string()).default([]),
  createdAt: z.string().nullable(),
  modifiedAt: z.string().nullable(),
  pageCount: z.number(),
  language: z.string().nullable(),
  layoutElements: z.array(layoutElementSchema).default([]),
});

export const extractMetadataLayoutTask = schemaTask({
  id: "ingestion.extract-metadata-layout",
  schema: z.object({
    document: z.object({
      id: z.string(),
      blobUrl: z.string(),
      filename: z.string(),
    }),
    markdownContent: z.string(),
    userId: z.string(),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async ({ document, markdownContent, userId }) => {
    logger.log("Extracting metadata and layout information", {
      documentId: document.id,
      markdownLength: markdownContent.length,
      userId: userId,
    });

    const response = await fetch(document.blobUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch document: ${response.status} ${response.statusText}`
      );
    }

    const documentBuffer = await response.arrayBuffer();

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: documentMetadataSchema,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this document and extract comprehensive metadata and layout information.

Extract the following metadata:
- Document title (if present)
- Author information
- Subject/topic
- Keywords (relevant terms from the document)
- Creation and modification dates (if available)
- Page count
- Language

For layout elements, analyze the structure and identify:
- Headers (h1, h2, h3, etc.)
- Paragraphs
- Tables
- Lists
- Images/figures
- Footers

For each layout element, provide:
- Type classification
- Content text
- Estimated bounding box coordinates (x, y, width, height) relative to page
- Page number where the element appears
- Additional metadata if relevant

Use the markdown content to understand the document structure:
${markdownContent.substring(0, 8000)}...

Provide realistic bounding box coordinates based on typical document layouts.`,
            },
            {
              type: "file",
              data: new Uint8Array(documentBuffer),
              mimeType: "application/pdf",
              filename: document.filename,
            },
          ],
        },
      ],
    });

    const [newContent] = await db
      .insert(content)
      .values({
        _clerk: userId,
        title: object.title || document.filename,
        content: markdownContent,
        metadata: {
          author: object.author,
          subject: object.subject,
          keywords: object.keywords,
          createdAt: object.createdAt,
          modifiedAt: object.modifiedAt,
          pageCount: object.pageCount,
          language: object.language,
          layoutElements: object.layoutElements,
          originalFilename: document.filename,
        },
      })
      .returning({
        id: content.id,
        title: content.title,
      });

    if (!newContent) {
      throw new Error("Failed to store document metadata in database");
    }

    logger.log("Metadata and layout extracted successfully", {
      documentId: document.id,
      contentId: newContent.id,
      layoutElementsCount: object.layoutElements.length,
      userId: userId,
    });

    return {
      contentId: newContent.id,
      title: object.title,
      author: object.author,
      subject: object.subject,
      keywords: object.keywords,
      pageCount: object.pageCount,
      language: object.language,
      layoutElements: object.layoutElements,
    };
  },
}); 
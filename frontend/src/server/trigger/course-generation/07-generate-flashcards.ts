import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { db } from "../../db/connection";
import { flashcards, contentItems } from "../../db/schemas";
import { eq } from "drizzle-orm";

const flashcardSchema = z.object({
  front: z.string(),
  back: z.string(),
});

export const generateFlashcardsTask = schemaTask({
  id: "course-generation.generate-flashcards",
  schema: z.object({
    userId: z.string(),
    courseId: z.string().uuid(),
    contentResults: z.array(
      z.object({
        contentItemId: z.string().uuid(),
        lessonContent: z.object({
          title: z.string(),
          introduction: z.string(),
          mainContent: z.string(),
          keyPoints: z.array(z.string()),
          practicalExercises: z.array(z.string()),
          summary: z.string(),
          furtherReading: z.array(z.string()),
          estimatedReadingTime: z.string(),
        }),
      })
    ),
  }),
  retry: {
    maxAttempts: 3,
  },
  run: async ({ userId, courseId, contentResults }) => {
    logger.log("Generating flashcards from lesson content", {
      userId,
      courseId,
      contentItemsCount: contentResults.length,
    });

    const flashcardResults = [];
    const failedFlashcards = [];

    for (const contentResult of contentResults) {
      try {
        logger.log("Generating flashcards for content item", {
          contentItemId: contentResult.contentItemId,
          title: contentResult.lessonContent.title,
        });

        // Prepare course content for Modal API
        const courseContent = {
          title: contentResult.lessonContent.title,
          introduction: contentResult.lessonContent.introduction,
          mainContent: contentResult.lessonContent.mainContent,
          keyPoints: contentResult.lessonContent.keyPoints,
          practicalExercises: contentResult.lessonContent.practicalExercises,
          summary: contentResult.lessonContent.summary,
          furtherReading: contentResult.lessonContent.furtherReading,
        };

        // Call Modal API to generate flashcards
        const modalResponse = await fetch(
          "https://davisuga-chief--edu-one-generate-flashcards.modal.run",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              course_content: courseContent,
            }),
          }
        );

        if (!modalResponse.ok) {
          throw new Error(`Modal API error: ${modalResponse.status} ${modalResponse.statusText}`);
        }

        const modalData = await modalResponse.json();

        if (modalData.error) {
          throw new Error(`Modal API returned error: ${modalData.error}`);
        }

        const generatedFlashcards = modalData.flashcards;

        if (!Array.isArray(generatedFlashcards)) {
          throw new Error("Invalid flashcards format from Modal API");
        }

        // Validate and parse flashcards
        const validFlashcards = [];
        for (const card of generatedFlashcards) {
          try {
            // Handle different possible formats from the API
            let frontContent, backContent;

            if (typeof card === "object" && card !== null) {
              frontContent = card.front || card.question || card.frontContent || "";
              backContent = card.back || card.answer || card.backContent || "";
            } else {
              logger.warn("Skipping invalid flashcard format", { card });
              continue;
            }

            if (frontContent && backContent) {
              validFlashcards.push({
                frontContent: String(frontContent).trim(),
                backContent: String(backContent).trim(),
              });
            }
          } catch (error) {
            logger.warn("Failed to parse flashcard", { card, error });
          }
        }

        if (validFlashcards.length === 0) {
          throw new Error("No valid flashcards generated");
        }

        // Insert flashcards into database
        const insertedFlashcards = await db
          .insert(flashcards)
          .values(
            validFlashcards.map((card) => ({
              contentItemId: contentResult.contentItemId,
              frontContent: card.frontContent,
              backContent: card.backContent,
            }))
          )
          .returning({
            id: flashcards.id,
            frontContent: flashcards.frontContent,
            backContent: flashcards.backContent,
          });

        const flashcardResult = {
          contentItemId: contentResult.contentItemId,
          lessonTitle: contentResult.lessonContent.title,
          flashcardsGenerated: insertedFlashcards.length,
          flashcards: insertedFlashcards,
        };

        flashcardResults.push(flashcardResult);

        logger.log("Flashcards generated successfully", {
          contentItemId: contentResult.contentItemId,
          flashcardsCount: insertedFlashcards.length,
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        failedFlashcards.push({
          contentItemId: contentResult.contentItemId,
          lessonTitle: contentResult.lessonContent.title,
          error: errorMessage,
        });

        logger.error("Flashcard generation failed", {
          userId,
          courseId,
          contentItemId: contentResult.contentItemId,
          error: errorMessage,
        });
      }
    }

    const totalFlashcardsGenerated = flashcardResults.reduce(
      (sum, result) => sum + result.flashcardsGenerated,
      0
    );

    logger.log("Flashcard generation completed", {
      userId,
      courseId,
      totalContentItems: contentResults.length,
      successfulContentItems: flashcardResults.length,
      failedContentItems: failedFlashcards.length,
      totalFlashcardsGenerated,
    });

    return {
      userId,
      courseId,
      flashcardResults,
      failedFlashcards,
      totalFlashcardsGenerated,
      summary: {
        totalContentItems: contentResults.length,
        successfulContentItems: flashcardResults.length,
        failedContentItems: failedFlashcards.length,
        totalFlashcardsGenerated,
      },
    };
  },
});

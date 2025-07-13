import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { env } from "~/env";

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: env.GROQ_API_KEY,
});

const GROQ_MODELS = {
  FAST: "llama-3.3-70b-versatile",
  ULTRA_FAST: "llama-3.1-8b-instant",
  REASONING: "llama-3.2-90b-text-preview",
} as const;

export interface GroqGenerationOptions {
  model?: keyof typeof GROQ_MODELS;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export async function generateStructuredContent<T>(
  schema: z.ZodSchema<T>,
  prompt: string,
  options: GroqGenerationOptions = {}
): Promise<{ content: T; usage?: any }> {
  const {
    model = "FAST",
    temperature = 0.7,
    maxTokens = 8000,
    systemPrompt = "You are an expert educational content creator. Generate high-quality, accurate, and engaging educational content.",
  } = options;

  try {
    const result = await generateObject({
      model: groq(GROQ_MODELS[model]),
      schema,
      prompt,
      system: systemPrompt,
      temperature,
      maxTokens,
    });

    return {
      content: result.object,
      usage: result.usage,
    };
  } catch (error) {
    console.error("Groq structured generation error:", error);
    throw new Error(`Failed to generate structured content: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function generateTextContent(
  prompt: string,
  options: GroqGenerationOptions = {}
): Promise<{ content: string; usage?: any }> {
  const {
    model = "FAST",
    temperature = 0.7,
    maxTokens = 8000,
    systemPrompt = "You are an expert educational content creator. Generate high-quality, accurate, and engaging educational content use json for structured output.",
  } = options;

  try {
    const result = await generateText({
      model: groq(GROQ_MODELS[model]),
      prompt,
      system: systemPrompt,
      temperature,
      maxTokens,
    });

    return {
      content: result.text,
      usage: result.usage,
    };
  } catch (error) {
    console.error("Groq text generation error:", error);
    throw new Error(`Failed to generate text content: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export const courseGenerationPrompts = {
  courseStructure: (input: any) => `
Create a comprehensive course structure based on the following requirements:

Title: ${input.title}
Description: ${input.description || "No description provided"}
Goals: ${input.goals.join(", ")}
Duration: ${input.duration}
Difficulty: ${input.difficulty}
Preferred Format: ${input.format.join(", ")}
Learning Area: ${input.userProfileContext.learningArea}
Learning Style: ${input.userProfileContext.learningStyle}
Current Level: ${input.userProfileContext.currentLevel}

Structure Requirements:
- ${input.structure.modules} modules
- ${input.structure.lessonsPerModule} lessons per module
- Assessments: ${input.structure.assessments ? "Yes" : "No"}
- Projects: ${input.structure.projects ? "Yes" : "No"}

AI Preferences:
- Tone: ${input.aiPreferences.tone}
- Interactivity: ${input.aiPreferences.interactivity}
- Examples: ${input.aiPreferences.examples}
- Pacing: ${input.aiPreferences.pacing}

Additional Context:
- Time Available: ${input.userProfileContext.timeAvailable}
- Preferred Schedule: ${input.userProfileContext.preferredSchedule}
- Multiple Intelligences: ${input.userProfileContext.multipleIntelligences.join(", ")}

Generate a detailed course structure that includes:
1. Course overview with clear learning objectives
2. Module breakdown with descriptions
3. Lesson outline for each module
4. Estimated durations for each component
5. Content type recommendations for each lesson
6. Prerequisites and recommended background knowledge

Make sure the course is well-structured, progressive, and aligned with the user's goals and learning preferences.
`,

  moduleContent: (moduleInfo: any, context: string) => `
Generate detailed content for the following module:

Module: ${moduleInfo.title}
Description: ${moduleInfo.description}
Order: ${moduleInfo.orderIndex}
Course Context: ${context}

Create comprehensive content including:
1. Module introduction and objectives
2. Detailed lesson plans
3. Key concepts and topics to cover
4. Practical examples and exercises
5. Assessment strategies
6. Resources and references

Ensure the content is engaging, educational, and appropriate for the target audience.
`,

  lessonContent: (lessonInfo: any, moduleContext: string, materials: any[]) => `
Generate detailed content for this lesson:

Lesson: ${lessonInfo.title}
Description: ${lessonInfo.description}
Module Context: ${moduleContext}
Available Materials: ${materials.map(m => `${m.title}: ${m.content?.substring(0, 200)}...`).join("\n")}

Create comprehensive lesson content including:
1. Learning objectives
2. Detailed content with explanations
3. Practical examples
4. Interactive elements
5. Assessment questions
6. Additional resources

Focus on making the content clear, engaging, and actionable.
`,

  quizGeneration: (topic: string, difficulty: string, context: string) => `
Generate a comprehensive quiz for the following topic:

Topic: ${topic}
Difficulty: ${difficulty}
Context: ${context}

Create a quiz with:
1. Multiple choice questions (4-6 questions)
2. True/false questions (2-3 questions)
3. Short answer questions (1-2 questions)
4. One practical/application question

Ensure questions test understanding, application, and critical thinking.
Include clear explanations for correct answers.
`,
};

export type CourseGenerationPromptType = keyof typeof courseGenerationPrompts; 
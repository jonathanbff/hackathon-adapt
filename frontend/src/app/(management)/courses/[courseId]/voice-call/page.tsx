"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ConversationViewer } from "~/components/video-agent";

import { presetAgents } from "~/components/video-agent/presets";
import { useUser } from "~/hooks/use-user";
import { api } from "~/trpc/react";
import { TavusAPI } from "~/components/video-agent/tavus";
import type { ConversationResponse, ConversationRequest } from "~/types/tavus";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const VideoChat = () => {
  const params = useParams<{ courseId: string }>();
  const { courseId: course } = params;
  const { id: userId } = useUser();

  const [conversation, setConversation] = useState<ConversationResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const { data: courseStructure, isLoading: isLoadingCourseStructure } =
    api.courses.getCourseWithProgress.useQuery({
      userId,
      courseId: course,
    });

  const { data: courseInfo, isLoading } =
    api.courseGeneration.getCourse.useQuery({
      courseId: course,
    });

  const apiKey = process.env.NEXT_PUBLIC_TAVUS_API_KEY;

  const createConversation = async (retried = 0) => {
    if (!apiKey) {
      setError("API key not configured");
      return;
    }

    // Create fallback conversation if course data is not available
    const useFallback = !courseStructure && !courseInfo;

    setLoading(true);
    setError("");

    try {
      const tavusAPI = new TavusAPI(apiKey);

      // Use the first preset agent as default (educational tutor)
      const defaultAgent =
        presetAgents.find((agent) => agent.category === "education") ||
        presetAgents[0];

      let request: ConversationRequest;

      if (useFallback) {
        // Fallback conversation when course data is not available
        request = {
          conversation_name: `AI Tutor - General Support`,
          conversational_context: `You are a friendly and knowledgeable AI tutor ready to help with any learning topic.

SITUATION:
- The student is accessing the tutoring system but specific course data is not available
- You should provide general educational support and guidance

INSTRUCTIONS:
- Be friendly, helpful, and encouraging
- Ask the student what subject or topic they'd like help with
- Provide explanations, answer questions, and offer learning guidance
- Suggest study strategies and learning techniques
- Always respond in English
- Be patient and adapt to the student's learning pace`,
          custom_greeting: `Hello! I'm your AI tutor and I'm here to help you learn.

I notice we don't have specific course information loaded right now, but that's perfectly fine! I can help you with:

📚 **Any subject or topic** - just tell me what you're studying
🎯 **Study strategies** - effective learning techniques
❓ **Questions & explanations** - break down complex concepts
📝 **Practice problems** - work through examples together
🚀 **Learning guidance** - help you stay motivated and organized

What would you like to learn about today?`,
          replica_id: defaultAgent?.replica_id || "rb17cf590e15",
          persona_id: defaultAgent?.persona_id || "p40ce966fd74",
          audio_only: false,
          properties: {
            max_call_duration: 1800, // 30 minutes
            language: "english",
            enable_closed_captions: true,
            apply_greenscreen: false,
          },
        };
      } else {
        // Course-specific conversation when data is available
        const totalItems = courseStructure.modules.reduce(
          (total: number, module) =>
            total +
            module.lessons.reduce(
              (lessonTotal: number, lesson) =>
                lessonTotal + lesson.contentItems.length,
              0,
            ),
          0,
        );

        const completedItems = courseStructure.modules.reduce(
          (total: number, module) =>
            total +
            module.lessons.reduce(
              (lessonTotal: number, lesson) =>
                lessonTotal +
                lesson.contentItems.filter(
                  (item) => item.progress?.status === "completed",
                ).length,
              0,
            ),
          0,
        );

        const progressPercentage =
          totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        // Build roadmap context
        const roadmapContext = courseStructure.modules
          .map((module, moduleIndex: number) => {
            const moduleProgress = module.lessons.reduce(
              (total: number, lesson) => {
                const lessonCompleted = lesson.contentItems.filter(
                  (item) => item.progress?.status === "completed",
                ).length;
                return total + lessonCompleted;
              },
              0,
            );
            const moduleTotalItems = module.lessons.reduce(
              (total: number, lesson) => total + lesson.contentItems.length,
              0,
            );

            return `Module ${moduleIndex + 1}: ${module.title} (${moduleProgress}/${moduleTotalItems} items completed)
  Description: ${module.description || "N/A"}
  Lessons: ${module.lessons
    .map((lesson, lessonIndex: number) => {
      const lessonProgress = lesson.contentItems.filter(
        (item) => item.progress?.status === "completed",
      ).length;
      return `
    ${lessonIndex + 1}. ${lesson.title} (${lessonProgress}/${lesson.contentItems.length} items completed)
       Content: ${lesson.contentItems
         .map(
           (item) =>
             `${item.title} (${item.progress?.status || "not started"})`,
         )
         .join(", ")}`;
    })
    .join("")}`;
          })
          .join("\n\n");

        request = {
          conversation_name: `Tutoring - ${courseInfo.title || course}`,
          conversational_context: `You are a specialized educational tutor helping a student with the course "${courseInfo.title || course}".

STUDENT PROGRESS:
- Overall progress: ${progressPercentage}% (${completedItems}/${totalItems} items completed)

COURSE ROADMAP:
${roadmapContext}

INSTRUCTIONS:
- Be friendly, educational, and focused on helping the student
- Use the roadmap to understand where the student is and what comes next
- Suggest next steps based on current progress
- Always respond in English
- Help with specific questions about module and lesson content`,
          custom_greeting: `Hello! I'm your virtual tutor for the course "${courseInfo.title || course}".

I can see that you've already completed ${progressPercentage}% of the course (${completedItems} out of ${totalItems} items).

Based on your progress, I can help you with:
- Reviewing content you've already studied
- Clarifying questions about specific topics
- Guiding you through the next steps in the course
- Explaining concepts in more detail

How can I help you today?`,
          replica_id: defaultAgent?.replica_id || "rb17cf590e15",
          persona_id: defaultAgent?.persona_id || "p40ce966fd74",
          audio_only: false,
          properties: {
            max_call_duration: 1800, // 30 minutes
            language: "english",
            enable_closed_captions: true,
            apply_greenscreen: false,
          },
        };
      }

      const promises =
        (await tavusAPI.listConversations()).conversations?.map(
          ({ conversation_id }) => tavusAPI.endConversation(conversation_id),
        ) || [];
      for await (const promise of promises) {
        await promise;
        await sleep(100);
      }
      console.log(request);
      const newConversation = await tavusAPI.createConversation(request);
      setConversation(newConversation);
    } catch (err) {
      if (retried < 3) {
        await sleep(1000);
        await createConversation(retried + 1);
      } else {
        setError(
          err instanceof Error ? err.message : "Error creating conversation",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      apiKey &&
      !conversation &&
      !loading &&
      !isLoading &&
      !isLoadingCourseStructure
    ) {
      createConversation();
    }
  }, [courseStructure, courseInfo, apiKey]);

  const handleBack = () => {
    setConversation(null);
  };

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-card">
        <div className="text-center max-w-md mx-auto p-8 rounded-xl bg-card border border-border shadow-lg">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Configuration Required
          </h1>
          <p className="text-muted-foreground">
            The Tavus API key is not configured. Please contact your
            administrator to enable video tutoring.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-card">
        <div className="text-center max-w-md mx-auto p-8 rounded-xl bg-card border border-border shadow-lg">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-border"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-primary/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Preparing your virtual tutor...
          </h1>
          <p className="text-muted-foreground">
            Setting up conversation for personalized learning
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-card">
        <div className="text-center max-w-md mx-auto p-8 rounded-xl bg-card border border-border shadow-lg">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Connection Error
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={createConversation}
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground rounded-lg hover:shadow-glow transition-all duration-300 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-card">
        <div className="text-center max-w-md mx-auto p-8 rounded-xl bg-card border border-border shadow-lg">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-4">
            Ready to start learning?
          </h1>
          <p className="text-muted-foreground mb-6">
            Your AI tutor is ready to help you with personalized learning
            support.
          </p>
          <button
            onClick={createConversation}
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground rounded-lg hover:shadow-glow transition-all duration-300 font-medium"
          >
            Start Conversation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card">
      <div className="container mx-auto px-4 py-8">
        <ConversationViewer conversation={conversation} onBack={handleBack} />
      </div>
    </div>
  );
};
export default VideoChat;

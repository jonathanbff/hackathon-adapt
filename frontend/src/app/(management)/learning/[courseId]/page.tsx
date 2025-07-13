import { AITeacherChat } from "~/components/ai-teacher-chat/ai-teacher-chat";
import { LearningSpace } from "./learning-space";

interface CoursePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function LearningPage({ params }: CoursePageProps) {
  const { courseId } = await params;

  return (
    <>
      <LearningSpace courseId={courseId} />

      <AITeacherChat />
    </>
  );
}

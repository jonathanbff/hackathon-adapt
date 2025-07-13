import { QuizzesCardsContainer } from "./quizzes-cards-container";
import { AITeacherChat } from "~/components/ai-teacher-chat";

interface CoursePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function QuizzesPage({ params }: CoursePageProps) {
  const { courseId } = await params;

  return (
    <>
      <QuizzesCardsContainer courseId={courseId} />
      <AITeacherChat courseId={courseId} />
    </>
  );
}

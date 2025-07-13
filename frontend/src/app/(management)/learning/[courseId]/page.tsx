import { LearningSpace } from "./learning-space";

interface CoursePageProps {
  params: {
    courseId: string;
  };
}

export default function LearningPage({ params }: CoursePageProps) {
  return <LearningSpace courseId={params.courseId} />;
}

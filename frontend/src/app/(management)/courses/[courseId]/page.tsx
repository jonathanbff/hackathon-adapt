import { CourseOverview } from "./course-overview";

interface CoursePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params;
  return <CourseOverview courseId={courseId} />;
}

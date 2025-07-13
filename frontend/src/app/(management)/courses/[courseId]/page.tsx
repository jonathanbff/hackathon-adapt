import { CourseOverview } from "./course-overview";

interface CoursePageProps {
  params: {
    courseId: string;
  };
}

export default function CoursePage({ params }: CoursePageProps) {
  return <CourseOverview courseId={params.courseId} />;
}

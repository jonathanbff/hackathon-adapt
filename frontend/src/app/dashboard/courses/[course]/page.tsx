"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { RealTimeCourseViewer } from "~/components/courses/real-time-course-viewer";
import { notFound } from "next/navigation";

export default function CoursePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useUser();

  const courseId = params.courseId as string;
  const runId = searchParams.get("runId");

  if (!courseId || !user?.id) {
    notFound();
  }

  return (
    <RealTimeCourseViewer 
      courseId={courseId}
      userId={user.id}
      runId={runId || undefined}
    />
  );
} 
"use client";

import { RiGitRepositoryLine, RiLoader2Line } from "@remixicon/react";
import { api } from "~/trpc/react";

export function QuizzesCardsContainer({ courseId }: { courseId: string }) {
  const { data: course, isLoading: isLoadingCourse } =
    api.courses.getCourseById.useQuery({
      courseId,
    });

  const { data: quizzes, isLoading } = api.courses.getCourseQuizzes.useQuery({
    courseId,
  });

  if (isLoading || isLoadingCourse) {
    return (
      <div className="relative z-50 mx-auto flex w-full flex-1 flex-col self-stretch ">
        <div className="border-b border-dashed border-b-muted">
          <header className="flex min-h-[90px] max-w-5xl mx-auto flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:gap-3 lg:px-8">
            <div className="flex flex-1 gap-4 lg:gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-transparent shadow-xs ring-1 ring-inset ring-muted text-muted-foreground">
                <RiGitRepositoryLine className="size-6" />
              </div>

              <div className="space-y-1">
                <h1 className="text-base font-medium text-foreground">
                  Quiz Interativo
                </h1>
                <p className="text-sm text-muted-foreground">
                  Teste seus conhecimentos em...
                </p>
              </div>
            </div>
          </header>
        </div>

        <div className="flex items-center gap-2 h-[300px] w-full justify-center">
          <RiLoader2Line className="size-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-50 mx-auto flex w-full flex-1 flex-col self-stretch ">
      <div className="border-b border-dashed border-b-muted">
        <header className="flex min-h-[90px] max-w-5xl mx-auto flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:gap-3 lg:px-8">
          <div className="flex flex-1 gap-4 lg:gap-3.5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-transparent shadow-xs ring-1 ring-inset ring-muted text-muted-foreground">
              <RiGitRepositoryLine className="size-6" />
            </div>

            <div className="space-y-1">
              <h1 className="text-base font-medium text-foreground">
                Quiz Interativo
              </h1>
              <p className="text-sm text-muted-foreground">
                Teste seus conhecimentos em...
              </p>
            </div>
          </div>
        </header>
      </div>

      <div className="flex items-center gap-2 h-[300px] w-full justify-center">
        <RiLoader2Line className="size-8 animate-spin text-primary" />
      </div>
    </div>
  );
}

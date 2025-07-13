"use client";

import { useState } from "react";
import { RiBookOpenLine, RiGitRepositoryLine } from "@remixicon/react";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

export function LearningSpace({ courseId }: { courseId: string }) {
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const { data: courseAndRelations, isLoading } =
    api.courses.getCourseWithModulesAndLessons.useQuery({
      courseId,
    });

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col gap-4">
        <div className="border-b border-dashed border-b-muted">
          <header className="flex min-h-[90px] flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:gap-3 lg:px-8">
            <div className="flex flex-1 gap-4 lg:gap-3.5 items-center">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-transparent shadow-xs ring-1 ring-inset ring-muted text-muted-foreground">
                <RiGitRepositoryLine className="size-6" />
              </div>

              <div className="space-y-1">
                <Skeleton className="h-4 w-[200px]" />

                <Skeleton className="h-4 w-[350px]" />
              </div>
            </div>
          </header>
        </div>

        <section className="flex-1 px-4 py-5 w-full grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-4">
          <Skeleton className="h-full rounded-xl" />
          <Skeleton className="h-full aspect-video rounded-xl" />
        </section>
      </div>
    );
  }

  return (
    <div className="relative z-50 mx-auto flex w-full flex-1 flex-col self-stretch ">
      <div className="border-b border-dashed border-b-muted">
        <header className="flex min-h-[90px] flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:gap-3 lg:px-8">
          <div className="flex flex-1 gap-4 lg:gap-3.5 items-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-transparent shadow-xs ring-1 ring-inset ring-muted text-muted-foreground">
              <RiGitRepositoryLine className="size-6" />
            </div>

            <div className="space-y-1">
              <h1 className="text-base font-medium text-foreground">
                {courseAndRelations?.course?.title}
              </h1>
              <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                {courseAndRelations?.course?.description}
              </p>
            </div>
          </div>
        </header>
      </div>

      <section className="flex-1 px-4 py-5 w-full grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-4">
        <div className="rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <RiBookOpenLine className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Módulos do Curso
              </span>
            </div>
          </div>

          <ul className="divide-y divide-border">
            {courseAndRelations?.modules.map((module) => (
              <li
                key={module.id}
                className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                {module.title}

                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span>{module.title}</span>
                </div>

                {module.lessons.map((lesson: Leasson) => (
                  <button
                    key={lesson.id}
                    className={`w-full text-left text-sm p-2 rounded-lg transition-colors flex items-center gap-2 ${
                      selectedLesson === lesson.id
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        lesson.completed ? "bg-green-500" : "bg-muted"
                      }`}
                    />
                    {lesson.title}

                    {selectedLesson === lesson.id && (
                      <div className="ml-auto">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </li>
            ))}
          </ul>
        </div>

        <Skeleton className="h-full aspect-video rounded-xl" />
      </section>
    </div>
  );
}

"use client";

import { RiGitRepositoryLine } from "@remixicon/react";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

export function LearningSpace({ courseId }: { courseId: string }) {
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

        <section className="flex-1 px-4 py-5 w-full grid grid-cols-1 lg:grid-cols-4">
          fsdf
        </section>
      </div>
    );
  }

  return (
    <div className="relative z-50 mx-auto flex w-full flex-1 flex-col self-stretch ">
      <div className="border-b border-dashed border-b-muted">
        <header className="flex min-h-[90px] max-w-5xl mx-auto flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:gap-3 lg:px-8">
          <div className="flex flex-1 gap-4 lg:gap-3.5 items-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-transparent shadow-xs ring-1 ring-inset ring-muted text-muted-foreground">
              <RiGitRepositoryLine className="size-6" />
            </div>

            <div className="space-y-1">
              <h1 className="text-base font-medium text-foreground">
                {course?.title}
              </h1>
              <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                {course?.description}
              </p>
            </div>
          </div>
        </header>
      </div>

      <section className="flex-1 px-4 py-5 max-w-5xl w-full mx-auto">
        fsdf
      </section>
    </div>
  );
}

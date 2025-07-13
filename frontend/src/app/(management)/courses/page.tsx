"use client";

import { RiAddLine, RiGitRepositoryLine } from "@remixicon/react";
import { useRouter } from "next/navigation";

import { CoursesCatalog } from "~/components/courses/courses-catalog";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export default function CoursesPage() {
  const router = useRouter();

  const {
    data: courses,
    isLoading,
    error,
  } = api.courses.getAllCourses.useQuery();

  if (isLoading) {
    return (
      <div className="relative z-50 mx-auto flex w-full flex-1 flex-col self-stretch">
        <div className="border-b border-dashed border-b-muted">
          <header className="flex min-h-[90px] max-w-5xl mx-auto flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:gap-3 lg:px-8">
            <div className="flex flex-1 gap-4 lg:gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-transparent shadow-xs ring-1 ring-inset ring-muted text-muted-foreground">
                <RiGitRepositoryLine className="size-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-base font-medium text-foreground">
                  Catálogo de Cursos
                </h1>
                <p className="text-sm text-muted-foreground">
                  Descubra novos conhecimentos e desenvolva suas habilidades
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => router.push("/courses/new")}>
                Criar novo curso
                <RiAddLine className="ml-2 size-5" />
              </Button>
            </div>
          </header>
        </div>
        <section className="flex-1 px-4 py-5 max-w-5xl w-full mx-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando cursos...</p>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative z-50 mx-auto flex w-full flex-1 flex-col self-stretch">
        <div className="border-b border-dashed border-b-muted">
          <header className="flex min-h-[90px] max-w-5xl mx-auto flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:gap-3 lg:px-8">
            <div className="flex flex-1 gap-4 lg:gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-transparent shadow-xs ring-1 ring-inset ring-muted text-muted-foreground">
                <RiGitRepositoryLine className="size-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-base font-medium text-foreground">
                  Catálogo de Cursos
                </h1>
                <p className="text-sm text-muted-foreground">
                  Descubra novos conhecimentos e desenvolva suas habilidades
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => router.push("/courses/new")}>
                Criar novo curso
                <RiAddLine className="ml-2 size-5" />
              </Button>
            </div>
          </header>
        </div>
        <section className="flex-1 px-4 py-5 max-w-5xl w-full mx-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-red-500">
              Erro ao carregar cursos: {error.message}
            </p>
          </div>
        </section>
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
                Catálogo de Cursos
              </h1>
              <p className="text-sm text-muted-foreground">
                Descubra novos conhecimentos e desenvolva suas habilidades
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => router.push("/courses/new")}>
              Criar novo curso
              <RiAddLine className="ml-2 size-5" />
            </Button>
          </div>
        </header>
      </div>

      <section className="flex-1 px-4 py-5 max-w-5xl w-full mx-auto">
        <CoursesCatalog courses={courses || []} />
      </section>
    </div>
  );
}

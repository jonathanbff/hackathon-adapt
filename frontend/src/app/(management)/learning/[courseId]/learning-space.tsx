"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RiBookOpenLine,
  RiGitRepositoryLine,
  RiMicLine,
  RiLoader2Line,
} from "@remixicon/react";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import { Lesson } from "./lesson";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { AudioPlayer } from "~/components/ui/audio-player";
import { ScrollArea } from "~/components/ui/scroll-area";

export function LearningSpace({ courseId }: { courseId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedLesson = searchParams.get("lesson");
  const { data: courseAndRelations, isLoading } =
    api.courses.getCourseWithModulesAndLessons.useQuery({
      courseId,
    });

  // Podcast generation state
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [podcastData, setPodcastData] = useState<{
    audioUrl: string;
    title: string;
  } | null>(null);

  const generatePodcast = async () => {
    if (
      !courseAndRelations?.course?.title ||
      !courseAndRelations?.course?.description
    ) {
      alert("Dados do curso não disponíveis");
      return;
    }

    setPodcastLoading(true);
    try {
      const response = await fetch(
        "https://davisuga-chief--edu-one-generate-podcast.modal.run",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: courseAndRelations.course.description,
            title: courseAndRelations.course.title,
            target_audience: "estudantes interessados no curso",
            format_style: "Conversa educacional entre especialista e mediador",
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Erro ao gerar podcast: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      setPodcastData({
        audioUrl,
        title: courseAndRelations.course.title,
      });
    } catch (error) {
      console.error("Erro ao gerar podcast:", error);
      alert("Erro ao gerar podcast. Tente novamente.");
    } finally {
      setPodcastLoading(false);
    }
  };

  useEffect(() => {
    if (
      !isLoading &&
      !selectedLesson &&
      courseAndRelations &&
      courseAndRelations.modules &&
      courseAndRelations.modules.length > 0
    ) {
      const firstModule = courseAndRelations.modules[0];
      if (firstModule?.lessons?.length > 0) {
        const firstLesson = firstModule.lessons[0];
        const params = new URLSearchParams(searchParams.toString());
        params.set("lesson", firstLesson.id);
        router.replace(`?${params.toString()}`);
      }
    }
  }, [
    isLoading,
    selectedLesson,
    courseAndRelations?.modules,
    router,
    searchParams,
  ]);

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

      <section className="flex-1 px-4 py-5 w-full">
        {/* Podcast Generation Section */}
        <div className="mb-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RiMicLine className="size-5" />
                Podcast do Módulo
              </CardTitle>
              <CardDescription>
                Gere um podcast baseado no conteúdo do curso
              </CardDescription>
            </CardHeader>
            <div className="p-6 pt-0 space-y-4">
              <Button
                onClick={generatePodcast}
                disabled={podcastLoading}
                className="flex items-center gap-2"
              >
                {podcastLoading ? (
                  <>
                    <RiLoader2Line className="size-4 animate-spin" />
                    Gerando Podcast...
                  </>
                ) : (
                  <>
                    <RiMicLine className="size-4" />
                    Gerar Podcast
                  </>
                )}
              </Button>

              {podcastData && (
                <div className="mt-4">
                  <AudioPlayer
                    src={podcastData.audioUrl}
                    title={podcastData.title}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-4">
          <div className="rounded-xl border border-border">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <RiBookOpenLine className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Módulos
                </span>
              </div>
            </div>

            <ScrollArea>
              <ul className="divide-y divide-border">
                {courseAndRelations?.modules.map((module) => (
                  <li
                    key={module.id}
                    className="px-4 py-2 hover:text-accent-foreground"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <span>
                        {module.orderIndex} - {module.title}
                      </span>
                    </div>

                    <div className="space-y-1 mt-2">
                      {module.lessons.map((lesson: Leasson) => (
                        <button
                          key={lesson.id}
                          className={`w-full text-left text-sm p-2 rounded-lg transition-colors flex items-center gap-2 ${
                            selectedLesson === lesson.id
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          }`}
                          onClick={() => {
                            const params = new URLSearchParams(
                              searchParams.toString(),
                            );
                            params.set("lesson", lesson.id);
                            router.push(`?${params.toString()}`);
                          }}
                        >
                          <div className="w-2 h-2 rounded-full bg-muted" />
                          {lesson.title}

                          {selectedLesson === lesson.id && (
                            <div className="ml-auto">
                              <div className="w-1 h-1 rounded-full bg-primary" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>

          <div className="h-full aspect-video rounded-xl">
            {selectedLesson ? (
              <Lesson lessonId={selectedLesson} courseId={courseId} />
            ) : (
              <Skeleton className="h-full w-full aspect-video rounded-xl" />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

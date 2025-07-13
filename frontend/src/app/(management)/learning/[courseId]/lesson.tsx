"use client";

import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { VideoPlayer } from "~/components/vide-player";
import { api } from "~/trpc/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Card, CardContent } from "~/components/ui/card";
import { RiBrainLine } from "@remixicon/react";
import { Button } from "~/components/ui/button";
import Link from "next/link";

export function Lesson({
  lessonId,
  courseId,
}: {
  lessonId: string;
  courseId: string;
}) {
  const { data: lessonData, isLoading } =
    api.courses.getContentItemsByLessonId.useQuery({
      lessonId,
    });

  if (isLoading || !lessonData) {
    return <Skeleton className="h-full w-full aspect-video rounded-xl" />;
  }

  const textContents = lessonData.filter(
    (content) =>
      content.contentType === "text/markdown" || content.contentType === "text"
  );
  const videoContents = lessonData.filter(
    (content) => content.contentType === "video"
  );
  const quizContents = lessonData.filter(
    (content) => content.contentType === "quiz"
  );
  const flashcardContents = lessonData.filter(
    (content) => content.contentType === "flashcards"
  );

  console.log("quizzes", quizContents);

  return (
    <div className="h-full w-full aspect-video rounded-xl bg-background border border-border border-b-0">
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-muted/30">
          {!!textContents.length && (
            <TabsTrigger value="text">Conteúdo</TabsTrigger>
          )}

          {!!videoContents.length && (
            <TabsTrigger value="video">Vídeo</TabsTrigger>
          )}

          {!!quizContents.length && (
            <TabsTrigger value="quiz">Quizzes</TabsTrigger>
          )}

          {!!flashcardContents.length && (
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="video" className="mt-0">
          {!!videoContents.length && (
            <div className="space-y-4">
              <VideoPlayer
                videoUrl={videoContents[0]?.content || ""}
                title={videoContents[0]?.title || "Vídeo da Lição"}
                thumbnail="/placeholder.svg"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="text" className="mt-0 p-5 space-y-3">
          {textContents.map((content) => (
            <Collapsible
              key={content.id}
              className="border border-border rounded-lg bg-background"
            >
              <CollapsibleTrigger className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors">
                {content.title}
              </CollapsibleTrigger>

              <CollapsibleContent className="px-4 py-4">
                <div className="prose prose-invert max-w-none ">
                  <p className="text-muted-foreground leading-relaxed">
                    {content.content}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </TabsContent>

        <TabsContent value="quiz" className="mt-0">
          {!!quizContents.length && (
            <Card className="bg-card/50 backdrop-blur-sm border-none">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <RiBrainLine className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Quiz Rápido
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-primary/10 via-primary-glow/5 to-transparent rounded-lg border border-border">
                    <h3 className="font-medium text-foreground mb-3">
                      {quizContents?.[0]?.title}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      Treine seus conhecimentos respondendo perguntas referente
                      a esse conteúdo.
                    </p>
                  </div>

                  <Button className="w-full" asChild>
                    <Link href="/quizzes">Fazer Quizz</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="flashcards" className="mt-0"></TabsContent>
      </Tabs>
    </div>
  );
}

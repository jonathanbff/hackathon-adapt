"use client";

import { useState } from "react";
import {
  RiGitRepositoryLine,
  RiLoader2Line,
  RiTrophyLine,
} from "@remixicon/react";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";
import { QuizCard } from "./quiz-card";

export function QuizzesCardsContainer({ courseId }: { courseId: string }) {
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const { data: course, isLoading: isLoadingCourse } =
    api.courses.getCourseById.useQuery({
      courseId,
    });

  const { data: quizzes, isLoading } = api.courses.getCourseQuizzes.useQuery({
    courseId,
  });

  const handleQuizComplete = () => {
    if (quizzes && currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuizIndex(0);
    setIsCompleted(false);
  };

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

  console.log("quizzes", quizzes);

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
                Teste seus conhecimentos em {course?.title}
              </p>
            </div>
          </div>
        </header>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {!quizzes || quizzes.length === 0 ? (
          <div className="text-center py-12">
            <RiGitRepositoryLine className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum quiz encontrado
            </h3>
            <p className="text-sm text-muted-foreground">
              Este curso ainda não possui quizzes disponíveis.
            </p>
          </div>
        ) : isCompleted ? (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <RiTrophyLine className="size-8" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Parabéns! 🎉
              </h2>
              <p className="text-muted-foreground">
                Você completou todos os quizzes de {course?.title}
              </p>
            </CardHeader>
            <div className="px-6 pb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">
                    Quizzes Completados
                  </span>
                  <Badge variant="secondary">
                    {quizzes.length} de {quizzes.length}
                  </Badge>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleRestart}
                    variant="outline"
                    className="flex-1"
                  >
                    Refazer Quizzes
                  </Button>
                  <Button className="flex-1">Continuar Aprendendo</Button>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <QuizCard
            quiz={quizzes[currentQuizIndex]!}
            onComplete={handleQuizComplete}
            currentQuizIndex={currentQuizIndex}
            totalQuizzes={quizzes.length}
          />
        )}
      </div>
    </div>
  );
}

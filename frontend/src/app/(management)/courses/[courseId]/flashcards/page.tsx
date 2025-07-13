"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Brain,
  CheckCircle,
  XCircle,
  Star,
  Loader2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { api } from "~/trpc/react";
import { toast } from "sonner";

interface FlashcardData {
  id: string;
  frontContent: string;
  backContent: string;
  contentItemId: string;
  contentItem?: {
    id: string;
    title: string;
    lessonId: string;
  };
  lesson?: {
    id: string;
    title: string;
    moduleId: string;
  };
  module?: {
    id: string;
    title: string;
  };
  progress?: {
    id: string;
    status: string;
    attempts: number;
    score: number;
    nextReviewAt: Date;
    spacedRepetitionInterval: number;
  } | null;
}

export default function Flashcards() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { user } = useUser();

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [responseStartTime, setResponseStartTime] = useState<number | null>(
    null,
  );
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    incorrect: 0,
    averageResponseTime: 0,
  });

  // Get user profile to get internal database user ID
  const { data: userProfile, isLoading: isLoadingProfile } =
    api.user.getProfile.useQuery(undefined, {
      enabled: !!user,
    });

  // Fetch flashcards for the course
  const {
    data: flashcards,
    isLoading,
    error,
    refetch,
  } = api.flashcards.getFlashcardsForCourse.useQuery(
    {
      userId: userProfile?.id || "",
      courseId,
    },
    {
      enabled: !!userProfile?.id,
    },
  );

  // Mutation for submitting flashcard answers
  const submitAnswerMutation = api.flashcards.submitFlashcardAnswer.useMutation(
    {
      onSuccess: (data) => {
        toast.success("Answer submitted", {
          description: `Next review scheduled for ${new Date(data.nextReviewAt).toLocaleDateString()}`,
        });
        // Optionally refetch data to update progress
        refetch();
      },
      onError: (error) => {
        toast.error("Error submitting answer", {
          description: error.message,
        });
      },
    },
  );

  // Initialize spaced repetition for the module
  const initializeSpacedRepetition =
    api.flashcards.initializeSpacedRepetition.useMutation();

  useEffect(() => {
    if (flashcards && flashcards.length > 0 && userProfile?.id) {
      // Initialize spaced repetition for new flashcards for each module in the course
      const uniqueModuleIds = [
        ...new Set(
          flashcards.map((card) => card.lesson?.moduleId).filter(Boolean),
        ),
      ];
      uniqueModuleIds.forEach((moduleId) => {
        if (moduleId) {
          initializeSpacedRepetition.mutate({
            userId: userProfile.id,
            moduleId: moduleId,
          });
        }
      });
    }
  }, [flashcards, courseId, userProfile?.id]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Please sign in to access flashcards.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingProfile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading user profile...</span>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">
              Could not load user profile. Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading flashcards...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">
              Error loading flashcards: {error.message}
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Flashcards</h1>
            <p className="text-muted-foreground">
              Course Flashcards - Revisão Ativa
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                No Flashcards Available
              </h3>
              <p className="text-muted-foreground mb-4">
                This course doesn't have any flashcards yet. Flashcards are
                automatically generated from course content.
              </p>
              <Button onClick={() => refetch()}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Check Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / flashcards.length) * 100;

  const handleCardFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      // Starting to view the answer - record the time
      setResponseStartTime(Date.now());
    }
  };

  const calculateDifficultyFromTime = (
    timeMs: number,
  ): "easy" | "medium" | "hard" => {
    // Thresholds in milliseconds
    const EASY_THRESHOLD = 3000; // 3 seconds
    const MEDIUM_THRESHOLD = 8000; // 8 seconds

    if (timeMs <= EASY_THRESHOLD) return "easy";
    if (timeMs <= MEDIUM_THRESHOLD) return "medium";
    return "hard";
  };

  const getDifficultyLabel = (timeMs: number): string => {
    const difficulty = calculateDifficultyFromTime(timeMs);
    switch (difficulty) {
      case "easy":
        return "Rápido";
      case "medium":
        return "Médio";
      case "hard":
        return "Lento";
    }
  };

  const getDifficultyColor = (timeMs: number): string => {
    const difficulty = calculateDifficultyFromTime(timeMs);
    switch (difficulty) {
      case "easy":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "hard":
        return "bg-red-500/20 text-red-400 border-red-500/30";
    }
  };

  const handleResponse = async (isCorrect: boolean) => {
    if (!isFlipped || !currentCard || !userProfile?.id) {
      toast.error("Unable to submit answer", {
        description: "Please ensure you're logged in and try again.",
      });
      return;
    }

    // Calculate response time
    const currentTime = Date.now();
    const timeTaken = responseStartTime ? currentTime - responseStartTime : 0;
    setResponseTime(timeTaken);

    // Determine performance based on correctness and response time
    let performance: "easy" | "medium" | "hard" | "failed";

    if (!isCorrect) {
      performance = "failed";
    } else {
      performance = calculateDifficultyFromTime(timeTaken);
    }

    try {
      await submitAnswerMutation.mutateAsync({
        userId: userProfile.id,
        contentItemId: currentCard.contentItemId,
        flashcardId: currentCard.id,
        performance,
      });

      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        incorrect: !isCorrect ? prev.incorrect + 1 : prev.incorrect,
        averageResponseTime:
          prev.reviewed > 0
            ? (prev.averageResponseTime * prev.reviewed + timeTaken) /
              (prev.reviewed + 1)
            : timeTaken,
      }));

      // Move to next card
      if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setIsFlipped(false);
        setResponseStartTime(null);
        setResponseTime(null);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to submit answer", {
        description: `Error: ${errorMessage}. Please try again.`,
      });
    }
  };

  const resetSession = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setResponseStartTime(null);
    setResponseTime(null);
    setSessionStats({
      reviewed: 0,
      correct: 0,
      incorrect: 0,
      averageResponseTime: 0,
    });
  };

  const goToPrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
      setResponseStartTime(null);
      setResponseTime(null);
    }
  };

  const goToNext = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      setResponseStartTime(null);
      setResponseTime(null);
    }
  };

  const getAttemptsDifficultyColor = (attempts: number) => {
    if (attempts === 0)
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (attempts <= 2)
      return "bg-green-500/20 text-green-400 border-green-500/30";
    if (attempts <= 4)
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const getAttemptsDifficultyLabel = (attempts: number) => {
    if (attempts === 0) return "Nova";
    if (attempts <= 2) return "Fácil";
    if (attempts <= 4) return "Médio";
    return "Difícil";
  };

  if (currentCardIndex >= flashcards.length) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
            <Star className="w-10 h-10 text-primary-foreground" />
          </div>

          <h1 className="text-3xl font-bold text-foreground">
            Sessão Concluída! 🎉
          </h1>

          <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {sessionStats.reviewed}
                </div>
                <div className="text-sm text-muted-foreground">Revisadas</div>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 backdrop-blur-sm border-green-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {sessionStats.correct}
                </div>
                <div className="text-sm text-green-300">Corretas</div>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 backdrop-blur-sm border-red-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-400">
                  {sessionStats.incorrect}
                </div>
                <div className="text-sm text-red-300">Incorretas</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 backdrop-blur-sm border-blue-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {sessionStats.averageResponseTime > 0
                    ? `${(sessionStats.averageResponseTime / 1000).toFixed(1)}s`
                    : "0s"}
                </div>
                <div className="text-sm text-blue-300">Tempo Médio</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={resetSession} size="lg">
              <RotateCcw className="mr-2 h-5 w-5" />
              Nova Sessão
            </Button>
            <Button variant="outline" size="lg">
              Ver Estatísticas Detalhadas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Flashcards</h1>
          <p className="text-muted-foreground">
            {currentCard?.module?.title || "Course"} - Revisão Ativa
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-primary/20 text-primary border-primary/30">
            <Brain className="w-4 h-4 mr-1" />
            Sessão Ativa
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progresso da Sessão</span>
          <span className="text-foreground font-medium">
            {currentCardIndex + 1} / {flashcards.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/30 backdrop-blur-sm border-border">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-semibold text-foreground">
              {sessionStats.reviewed}
            </div>
            <div className="text-sm text-muted-foreground">Revisadas</div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 backdrop-blur-sm border-green-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-semibold text-green-400">
              {sessionStats.correct}
            </div>
            <div className="text-sm text-green-300">Corretas</div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 backdrop-blur-sm border-red-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-semibold text-red-400">
              {sessionStats.incorrect}
            </div>
            <div className="text-sm text-red-300">Incorretas</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 backdrop-blur-sm border-blue-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-semibold text-blue-400">
              {sessionStats.averageResponseTime > 0
                ? `${(sessionStats.averageResponseTime / 1000).toFixed(1)}s`
                : "0s"}
            </div>
            <div className="text-sm text-blue-300">Tempo Médio</div>
          </CardContent>
        </Card>
      </div>

      {/* Flashcard */}
      <div className="flex justify-center">
        <div
          className="relative w-full max-w-2xl h-80 perspective-1000 cursor-pointer"
          onClick={handleCardFlip}
        >
          <div
            className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}
          >
            {/* Front of card */}
            <Card className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-primary/10 via-primary-glow/5 to-transparent border-border shadow-lg hover:shadow-glow/20 transition-all duration-300">
              <CardContent className="p-8 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge
                      className={getAttemptsDifficultyColor(
                        currentCard?.progress?.attempts || 0,
                      )}
                    >
                      {getAttemptsDifficultyLabel(
                        currentCard?.progress?.attempts || 0,
                      )}
                    </Badge>
                    <Badge variant="outline">
                      {currentCard?.module?.title ||
                        currentCard?.contentItem?.title ||
                        "Flashcard"}
                    </Badge>
                  </div>

                  <div className="flex-1 flex items-center justify-center">
                    <h2 className="text-xl font-semibold text-foreground text-center leading-relaxed">
                      {currentCard?.frontContent}
                    </h2>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Clique para ver a resposta
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Back of card */}
            <Card className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-border shadow-lg">
              <CardContent className="p-8 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-accent/20 text-accent-foreground border-accent/30">
                      Resposta
                    </Badge>
                    <div className="flex items-center gap-2">
                      {responseTime && (
                        <Badge className={getDifficultyColor(responseTime)}>
                          {(responseTime / 1000).toFixed(1)}s -{" "}
                          {getDifficultyLabel(responseTime)}
                        </Badge>
                      )}
                      {currentCard?.progress &&
                        currentCard.progress.attempts > 0 && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            Tentativas: {currentCard.progress.attempts}
                          </Badge>
                        )}
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-foreground text-center leading-relaxed">
                      {currentCard?.backContent}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Você acertou esta pergunta?
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResponse(false);
                      }}
                      className="border-red-500/30 hover:bg-red-500/10 text-red-400"
                      disabled={submitAnswerMutation.isPending}
                    >
                      {submitAnswerMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Não, errei
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResponse(true);
                      }}
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
                      disabled={submitAnswerMutation.isPending}
                    >
                      {submitAnswerMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Sim, acertei
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={currentCardIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <Button onClick={resetSession} variant="ghost">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reiniciar
        </Button>

        <Button
          variant="outline"
          onClick={goToNext}
          disabled={currentCardIndex === flashcards.length - 1}
        >
          Próximo
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

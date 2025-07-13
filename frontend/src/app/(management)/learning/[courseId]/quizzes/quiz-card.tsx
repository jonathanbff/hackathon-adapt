"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { RiCheckLine, RiCloseLine, RiArrowRightLine } from "@remixicon/react";
import { cn } from "~/lib/utils";

interface QuizQuestion {
  type: "multiple_choice" | "true_false" | "short_answer";
  question: string;
  options?: string[];
  correct: number | boolean;
  explanation: string;
  points: number;
  sampleAnswer?: string;
}

interface QuizContent {
  title: string;
  description: string;
  questions: QuizQuestion[];
}

interface Quiz {
  id: string;
  title: string;
  content: string | null;
  contentType: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  lesson: {
    id: string;
    title: string;
    orderIndex: number;
  };
  module: {
    id: string;
    title: string;
    orderIndex: number;
  };
}

interface QuizCardProps {
  quiz: Quiz;
  onComplete: () => void;
  currentQuizIndex: number;
  totalQuizzes: number;
}

export function QuizCard({
  quiz,
  onComplete,
  currentQuizIndex,
  totalQuizzes,
}: QuizCardProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  // Parse quiz content
  let quizContent: QuizContent;
  try {
    if (quiz.content) {
      quizContent = JSON.parse(quiz.content);
    } else {
      throw new Error("No content available");
    }
  } catch (error) {
    // If content is not valid JSON or null, create a simple structure
    quizContent = {
      title: quiz.title,
      description: "Quiz content",
      questions: [],
    };
  }

  const currentQuestion = quizContent.questions[currentQuestionIndex];
  const isLastQuestion =
    currentQuestionIndex === quizContent.questions.length - 1;
  const isCorrect = selectedAnswer === currentQuestion?.correct;

  const handleAnswerSelect = (answerIndex: number) => {
    if (showFeedback) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    setShowFeedback(true);
    if (isCorrect) {
      setScore((prev) => prev + (currentQuestion?.points || 0));
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      onComplete();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  if (!currentQuestion) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">
              Quiz {currentQuizIndex + 1} de {totalQuizzes}
            </Badge>
            <Badge variant="secondary">{quiz.module.title}</Badge>
          </div>
          <CardTitle className="text-xl">{quiz.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Este quiz não possui questões estruturadas disponíveis.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {typeof quiz.content === "string" && quiz.content.length > 100
                ? quiz.content
                : "Conteúdo do quiz não disponível."}
            </p>
            <Button onClick={onComplete} className="w-full">
              Próximo Quiz
              <RiArrowRightLine className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            Quiz {currentQuizIndex + 1} de {totalQuizzes}
          </Badge>
          <Badge variant="secondary">{quiz.module.title}</Badge>
        </div>
        <CardTitle className="text-xl">{quizContent.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {quizContent.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Questão {currentQuestionIndex + 1} de {quizContent.questions.length}
          </span>
          <span>Pontuação: {score} pontos</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{
              width: `${
                ((currentQuestionIndex + 1) / quizContent.questions.length) *
                100
              }%`,
            }}
          />
        </div>

        {/* Question */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{currentQuestion.question}</h3>

          {/* Multiple choice options */}
          {currentQuestion.type === "multiple_choice" &&
            currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showFeedback}
                    className={cn(
                      "w-full p-4 text-left rounded-lg border-2 transition-all duration-200",
                      "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                      selectedAnswer === index &&
                        !showFeedback &&
                        "border-primary bg-primary/5",
                      showFeedback &&
                        selectedAnswer === index &&
                        isCorrect &&
                        "border-green-500 text-green-500 bg-green-50",
                      showFeedback &&
                        selectedAnswer === index &&
                        !isCorrect &&
                        "border-red-500 text-red-500 bg-red-50",
                      showFeedback &&
                        index === currentQuestion.correct &&
                        "border-green-500 text-green-500 bg-green-50",
                      showFeedback ? "cursor-not-allowed" : "cursor-pointer",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {showFeedback && index === currentQuestion.correct && (
                        <RiCheckLine className="h-5 w-5 text-green-600" />
                      )}
                      {showFeedback &&
                        selectedAnswer === index &&
                        !isCorrect && (
                          <RiCloseLine className="h-5 w-5 text-red-600" />
                        )}
                    </div>
                  </button>
                ))}
              </div>
            )}

          {/* True/False options */}
          {currentQuestion.type === "true_false" && (
            <div className="space-y-3">
              {[
                { label: "Verdadeiro", value: true },
                { label: "Falso", value: false },
              ].map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option.value ? 1 : 0)}
                  disabled={showFeedback}
                  className={cn(
                    "w-full p-4 text-left rounded-lg border-2 transition-all duration-200",
                    "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                    selectedAnswer === (option.value ? 1 : 0) &&
                      !showFeedback &&
                      "border-primary bg-primary/5",
                    showFeedback &&
                      selectedAnswer === (option.value ? 1 : 0) &&
                      option.value === currentQuestion.correct &&
                      "border-green-500 bg-green-50",
                    showFeedback &&
                      selectedAnswer === (option.value ? 1 : 0) &&
                      option.value !== currentQuestion.correct &&
                      "border-red-500 bg-red-50",
                    showFeedback &&
                      option.value === currentQuestion.correct &&
                      "border-green-500 bg-green-50",
                    showFeedback ? "cursor-not-allowed" : "cursor-pointer",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {showFeedback &&
                      option.value === currentQuestion.correct && (
                        <RiCheckLine className="h-5 w-5 text-green-600" />
                      )}
                    {showFeedback &&
                      selectedAnswer === (option.value ? 1 : 0) &&
                      option.value !== currentQuestion.correct && (
                        <RiCloseLine className="h-5 w-5 text-red-600" />
                      )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div
            className={cn(
              "p-4 rounded-lg border-l-4",
              isCorrect
                ? "bg-green-50 border-green-500"
                : "bg-red-50 border-red-500",
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <RiCheckLine className="h-5 w-5 text-green-600" />
              ) : (
                <RiCloseLine className="h-5 w-5 text-red-600" />
              )}
              <span
                className={cn(
                  "font-medium",
                  isCorrect ? "text-green-800" : "text-red-800",
                )}
              >
                {isCorrect ? "Correto!" : "Incorreto!"}
              </span>
              <Badge variant={isCorrect ? "default" : "destructive"}>
                {isCorrect ? `+${currentQuestion.points}` : "0"} pontos
              </Badge>
            </div>
            <p
              className={cn(
                "text-sm",
                isCorrect ? "text-green-700" : "text-red-700",
              )}
            >
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          {!showFeedback ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="min-w-[120px]"
            >
              Responder
            </Button>
          ) : (
            <Button onClick={handleNextQuestion} className="min-w-[120px]">
              {isLastQuestion ? "Finalizar Quiz" : "Próxima Questão"}
              <RiArrowRightLine className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

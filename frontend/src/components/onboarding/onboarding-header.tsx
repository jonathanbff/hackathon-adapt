"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  onPrev: () => void;
}

export function OnboardingHeader({
  currentStep,
  totalSteps,
  stepTitle,
  onPrev,
}: OnboardingHeaderProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="bg-card border-b px-6 py-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentStep === 1 ? "Sair" : "Voltar"}</span>
          </Button>
          <div className="text-sm text-muted-foreground">
            {currentStep} de {totalSteps}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">{stepTitle}</h1>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>
    </div>
  );
}

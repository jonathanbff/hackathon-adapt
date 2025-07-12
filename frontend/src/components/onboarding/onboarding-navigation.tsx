"use client";

import { ArrowLeft, Target } from "lucide-react";
import { Button } from "~/components/ui/button";

interface OnboardingNavigationProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function OnboardingNavigation({
  currentStep,
  totalSteps,
  canProceed,
  onPrev,
  onNext,
}: OnboardingNavigationProps) {
  return (
    <div className="flex justify-between mt-8 pt-6 border-t">
      <Button
        variant="outline"
        onClick={onPrev}
        className="flex items-center space-x-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{currentStep === 1 ? "Sair" : "Anterior"}</span>
      </Button>

      <Button
        onClick={onNext}
        disabled={!canProceed}
        className="flex items-center space-x-2"
      >
        <span>{currentStep === totalSteps ? "Finalizar" : "Próximo"}</span>
        {currentStep !== totalSteps && <Target className="w-4 h-4" />}
      </Button>
    </div>
  );
}

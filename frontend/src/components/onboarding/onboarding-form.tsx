"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingHeader } from "./onboarding-header";
import { OnboardingNavigation } from "./onboarding-navigation";
import {
  WelcomeStep,
  LearningAreaStep,
  GoalsStep,
  CurrentLevelStep,
  LearningStyleStep,
  MultipleIntelligencesStep,
} from "./steps";
import type { UserProfile } from "./types";

const TOTAL_STEPS = 6;

const STEP_TITLES = [
  "Bem-vindo ao EDUONE!",
  "Área de Interesse",
  "Seus Objetivos",
  "Nível Atual",
  "Estilo de Aprendizado",
  "Múltiplas Inteligências",
];

export function OnboardingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    learningArea: "",
    goals: [],
    currentLevel: "",
    studyTime: "",
    learningStyle: "",
    multipleIntelligences: [],
  });
  const router = useRouter();

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push("/");
    }
  };

  const handleSubmit = () => {
    // Mock submit - print form data to console
    console.log("=== ONBOARDING FORM SUBMISSION ===");
    console.log("User Profile Data:", JSON.stringify(profile, null, 2));
    console.log("=====================================");

    // In a real app, you would send this data to your API
    // For now, we'll redirect to a success page or dashboard
    alert("Onboarding concluído! Dados salvos no console.");
    router.push("/dashboard"); // or wherever you want to redirect
  };

  const selectOption = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleArrayOption = (
    field: keyof Pick<UserProfile, "goals" | "multipleIntelligences">,
    value: string
  ) => {
    setProfile((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter((item) => item !== value)
        : [...(prev[field] as string[]), value],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return profile.learningArea !== "";
      case 3:
        return profile.goals.length > 0;
      case 4:
        return profile.currentLevel !== "";
      case 5:
        return profile.learningStyle !== "";
      case 6:
        return profile.multipleIntelligences.length > 0;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep />;
      case 2:
        return (
          <LearningAreaStep
            profile={profile}
            onSelect={(value) => selectOption("learningArea", value)}
          />
        );
      case 3:
        return (
          <GoalsStep
            profile={profile}
            onToggle={(value) => toggleArrayOption("goals", value)}
          />
        );
      case 4:
        return (
          <CurrentLevelStep
            profile={profile}
            onSelect={(value) => selectOption("currentLevel", value)}
          />
        );
      case 5:
        return (
          <LearningStyleStep
            profile={profile}
            onSelect={(value) => selectOption("learningStyle", value)}
          />
        );
      case 6:
        return (
          <MultipleIntelligencesStep
            profile={profile}
            onToggle={(value) =>
              toggleArrayOption("multipleIntelligences", value)
            }
          />
        );
      default:
        return null;
    }
  };

  const getHelpText = () => {
    if (currentStep <= 2) {
      return "🧠 Vamos descobrir seu perfil baseado em teorias de aprendizagem validadas cientificamente";
    }
    if (currentStep <= 4) {
      return "📊 Mapeando suas preferências de aprendizado para personalizar o conteúdo";
    }
    return "✨ Aplicando teoria VARK e Múltiplas Inteligências para criar sua experiência única";
  };

  return (
    <div className="min-h-screen bg-background">
      <OnboardingHeader
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        stepTitle={STEP_TITLES[currentStep - 1] || ""}
        onPrev={prevStep}
      />

      <div className="px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-lg border p-8 shadow-sm">
            {renderStep()}

            <OnboardingNavigation
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
              canProceed={canProceed()}
              onPrev={prevStep}
              onNext={nextStep}
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">{getHelpText()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

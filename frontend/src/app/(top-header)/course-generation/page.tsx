"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { StepIndicator } from "./_components/step-indicator";
import { TopicStep } from "./_components/topic-step";
import { GoalsStep } from "./_components/goals-step";
import { FormatStep } from "./_components/format-step";
import { MaterialsStep } from "./_components/materials-step";
import { AiPreferencesStep } from "./_components/ai-preferences-step";
import { ReviewStep } from "./_components/review-step";
import { GenerationProgress } from "./_components/generation-progress";
import type { CourseGenerationInput } from "~/server/db/schemas";

const TOTAL_STEPS = 6;

const initialState: CourseGenerationInput = {
  title: "",
  description: "",
  goals: [],
  duration: "1-month",
  difficulty: "beginner",
  format: [],
  structure: {
    modules: 5,
    lessonsPerModule: 3,
    assessments: true,
    projects: true,
  },
  materials: {
    documents: [],
    videos: [],
    audios: [],
    images: [],
  },
  aiPreferences: {
    tone: "professional",
    interactivity: "medium",
    examples: "",
    pacing: "",
  },
  userProfileContext: {
    learningArea: "technology",
    learningStyle: "visual",
    currentLevel: "beginner",
    multipleIntelligences: [],
    timeAvailable: "",
    preferredSchedule: "",
  },
};

export default function CourseGenerationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [courseData, setCourseData] = useState<CourseGenerationInput>(initialState);

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      handleStartGeneration();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartGeneration = async () => {
    setIsGenerating(true);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return courseData.title.length > 0;
      case 2: return courseData.goals.length > 0;
      case 3: return courseData.duration && courseData.format.length > 0;
      case 4: return true;
      case 5: return Object.values(courseData.aiPreferences).some(val => val !== "");
      case 6: return true;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <TopicStep data={courseData} onChange={setCourseData} />;
      case 2:
        return <GoalsStep data={courseData} onChange={setCourseData} />;
      case 3:
        return <FormatStep data={courseData} onChange={setCourseData} />;
      case 4:
        return <MaterialsStep data={courseData} onChange={setCourseData} />;
      case 5:
        return <AiPreferencesStep data={courseData} onChange={setCourseData} />;
      case 6:
        return <ReviewStep data={courseData} />;
      default:
        return null;
    }
  };

  if (isGenerating) {
    return <GenerationProgress courseData={courseData} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Create Your Course</h1>
              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {TOTAL_STEPS}
              </div>
            </div>
            <Progress value={(currentStep / TOTAL_STEPS) * 100} className="mb-4" />
            <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
          </div>

          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            {renderStep()}
          </motion.div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button
              onClick={nextStep}
              disabled={!canProceed()}
            >
              {currentStep === TOTAL_STEPS ? "Generate Course" : "Next"}
              {currentStep < TOTAL_STEPS && <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
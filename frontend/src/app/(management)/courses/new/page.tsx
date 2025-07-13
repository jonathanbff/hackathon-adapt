"use client";

import { useState, Fragment } from "react";
import { RiArrowLeftSLine, RiCloseLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { CourseForm } from "~/components/courses/new/course-form";
import { Button } from "~/components/ui/button";

import * as Stepper from "~/components/ui/horizontal-stepper";
import { Progress } from "~/components/ui/progress";
import { courseGenerationInputSchema } from "~/server/db/schemas";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Wand2 } from "lucide-react";
import { GeneratingCourse } from "~/components/courses/new/generating-course";

const STEPS = [
  { id: 1, name: "Informações Basicas", indicator: "1" },
  { id: 2, name: "Objetivos", indicator: "2" },
  { id: 3, name: "Duração", indicator: "3" },
  { id: 4, name: "Conteúdo", indicator: "4" },
  { id: 5, name: "Revisar", indicator: "5" },
];

type FormValues = z.infer<typeof courseGenerationInputSchema>;
type ScopedFormValues = Pick<
  FormValues,
  "title" | "description" | "goals" | "duration" | "aiPreferences"
> & {
  sources: File[];
  generateAllContent: boolean;
};

export default function NewCoursePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [formValues, setFormValues] = useState<GenerateCourseFormSchema>({
    title: "",
    description: "",
    goals: "",
    duration: "",
    sources: [],
  });

  const router = useRouter();

  const getState = (index: number) => {
    if (activeStep > index) return "completed";
    if (activeStep === index) return "active";
    return "default";
  };

  // progress value 1 to 100 based on activeStep
  const progressValue = ((activeStep + 1) / STEPS.length) * 100;

  const currentStep = STEPS[activeStep];

  const nextStep = () => {
    if (activeStep < STEPS.length - 1) {
      setActiveStep((prev) => prev + 1);
    }

    if (activeStep === STEPS.length - 1) {
      handleCreateCourse();
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return (
          formValues.title.trim() !== "" && formValues.description.trim() !== ""
        );
      case 1:
        return formValues.goals !== "";
      case 2:
        return formValues.duration !== "";
      case 3:
        return true; // Materials optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleCreateCourse = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate AI agents working
    const agentSequence = [
      "content-creator",
      "structure-architect",
      "personalization-expert",
      "assessment-designer",
    ];

    for (let i = 0; i < agentSequence.length; i++) {
      setActiveAgents([agentSequence[i] as string]);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setGenerationProgress((i + 1) * 25);
    }

    setActiveAgents([]);
    setGenerationProgress(100);

    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  if (isGenerating) {
    return (
      <GeneratingCourse
        generationProgress={generationProgress}
        activeAgents={activeAgents}
      />
    );
  }

  return (
    <div className="relative z-50 mx-auto flex w-full flex-1 flex-col self-stretch">
      <div className="border-b border-dashed border-b-muted space-y-0.5">
        <header className="lg:hidden">
          <div className="px-2.5 pb-3.5 pt-2.5">
            <div className="relative flex h-9 items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                disabled={activeStep === 0}
                onClick={() => setActiveStep(activeStep - 1)}
              >
                <RiArrowLeftSLine className="size-5" />
                Voltar
              </Button>

              <div className="h-9 w-9 bg-gradient-primary rounded-full" />

              <Button
                size="icon"
                variant="ghost"
                onClick={() => router.replace("/courses")}
              >
                <RiCloseLine className="size-5" />
              </Button>
            </div>
          </div>

          <div className="px-2.5 pb-2">
            <Progress value={progressValue} />
          </div>

          <div className="px-2.5 pb-3.5">
            <Stepper.Item state="active">
              <Stepper.ItemIndicator>
                {currentStep?.indicator}
              </Stepper.ItemIndicator>
              {currentStep?.name}
            </Stepper.Item>
          </div>
        </header>

        <header className="hidden lg:flex min-h-[90px] max-w-5xl mx-auto flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:gap-3 lg:px-8">
          <div className="h-9 w-9 bg-gradient-primary rounded-full" />

          <div>
            <Stepper.Root>
              {STEPS.map((step, index) => (
                <Fragment key={index}>
                  <Stepper.Item
                    state={getState(index)}
                    onClick={() => setActiveStep(index)}
                  >
                    <Stepper.ItemIndicator>
                      {step.indicator}
                    </Stepper.ItemIndicator>
                    {step.name}
                  </Stepper.Item>
                  {index < STEPS.length - 1 && <Stepper.SeparatorIcon />}
                </Fragment>
              ))}
            </Stepper.Root>
          </div>

          <div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.replace("/courses")}
            >
              <RiCloseLine className="size-5" />
            </Button>
          </div>
        </header>
      </div>

      <section className="flex-1 px-4 py-5 max-w-5xl w-full mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CourseForm
              formValues={formValues}
              setFormValues={setFormValues}
              currentStep={activeStep}
              onNext={() => {}}
            />
          </motion.div>
        </AnimatePresence>

        <motion.div
          className="mt-8 flex justify-between items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={activeStep === 0}
          >
            Voltar
          </Button>

          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            size="lg"
            className="px-8"
          >
            {activeStep === STEPS.length - 1 ? (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Criar Curso com IA
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      </section>
    </div>
  );
}

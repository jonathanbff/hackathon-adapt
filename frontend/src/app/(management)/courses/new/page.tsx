"use client";

import { useState, Fragment } from "react";
import { RiArrowLeftSLine, RiCloseLine } from "@remixicon/react";
import { useRouter } from "next/navigation";

import { CourseForm } from "~/components/courses/new/course-form";
import { Button } from "~/components/ui/button";

import * as Stepper from "~/components/ui/horizontal-stepper";
import { Progress } from "~/components/ui/progress";

const STEPS = [
  { id: 1, name: "Informações Basicas", indicator: "1" },
  { id: 3, name: "Conteúdo", indicator: "2" },
  { id: 3, name: "Revisar", indicator: "3" },
];

export default function NewCoursePage() {
  const [activeStep, setActiveStep] = useState(0);

  const router = useRouter();

  const getState = (index: number) => {
    if (activeStep > index) return "completed";
    if (activeStep === index) return "active";
    return "default";
  };

  // progress value 1 to 100 based on activeStep
  const progressValue = ((activeStep + 1) / STEPS.length) * 100;

  const currentStep = STEPS[activeStep];

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
        <CourseForm />
      </section>
    </div>
  );
}

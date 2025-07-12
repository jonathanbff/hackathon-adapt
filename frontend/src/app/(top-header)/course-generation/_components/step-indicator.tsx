import { motion } from "framer-motion";
import { Check, Lightbulb, Target, Clock, Upload, Palette, CheckCircle } from "lucide-react";
import { cn } from "~/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const stepIcons = [
  Lightbulb,
  Target,
  Clock,
  Upload,
  Palette,
  CheckCircle,
];

const stepLabels = [
  "Topic",
  "Goals",
  "Format",
  "Materials",
  "AI Settings",
  "Review",
];

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        const Icon = stepIcons[index];

        return (
          <div key={stepNumber} className="flex flex-col items-center">
            <div className="relative">
              <motion.div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors",
                  {
                    "border-primary bg-primary text-primary-foreground": isActive,
                    "border-primary bg-primary/10 text-primary": isCompleted,
                    "border-muted-foreground/30 bg-background text-muted-foreground": !isActive && !isCompleted,
                  }
                )}
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </motion.div>
              
              {stepNumber < totalSteps && (
                <div
                  className={cn(
                    "absolute top-6 left-12 w-16 h-0.5 transition-colors",
                    {
                      "bg-primary": isCompleted,
                      "bg-muted-foreground/30": !isCompleted,
                    }
                  )}
                />
              )}
            </div>
            
            <span
              className={cn(
                "text-xs mt-2 text-center transition-colors",
                {
                  "text-primary font-medium": isActive,
                  "text-foreground": isCompleted,
                  "text-muted-foreground": !isActive && !isCompleted,
                }
              )}
            >
              {stepLabels[index]}
            </span>
          </div>
        );
      })}
    </div>
  );
} 
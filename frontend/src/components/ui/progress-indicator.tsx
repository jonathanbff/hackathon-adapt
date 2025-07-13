import { cn } from "~/lib/utils";
import { CheckCircle, Clock, Loader2 } from "lucide-react";

interface ProgressIndicatorProps {
  steps: {
    id: string;
    title: string;
    description: string;
    status: "pending" | "in_progress" | "completed" | "failed";
  }[];
  currentStep: number;
  className?: string;
}

export function ProgressIndicator({ steps, currentStep, className }: ProgressIndicatorProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = step.status === "completed";
        const isFailed = step.status === "failed";
        const isInProgress = step.status === "in_progress";
        
        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-4 p-4 rounded-lg border transition-all duration-300",
              isCompleted && "bg-emerald-50 border-emerald-200",
              isInProgress && "bg-blue-50 border-blue-200",
              isFailed && "bg-red-50 border-red-200",
              !isCompleted && !isInProgress && !isFailed && "bg-slate-50 border-slate-200"
            )}
          >
            <div className="flex-shrink-0">
              {isCompleted && (
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              )}
              {isInProgress && (
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              )}
              {!isCompleted && !isInProgress && !isFailed && (
                <Clock className="w-6 h-6 text-slate-400" />
              )}
              {isFailed && (
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h4 className={cn(
                "font-medium",
                isCompleted && "text-green-800",
                isInProgress && "text-blue-800",
                isFailed && "text-red-800",
                !isCompleted && !isInProgress && !isFailed && "text-muted-foreground"
              )}>
                {step.title}
              </h4>
              <p className={cn(
                "text-sm mt-1",
                isCompleted && "text-green-600",
                isInProgress && "text-blue-600",
                isFailed && "text-red-600",
                !isCompleted && !isInProgress && !isFailed && "text-muted-foreground"
              )}>
                {step.description}
              </p>
            </div>
            
            {isActive && (
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 
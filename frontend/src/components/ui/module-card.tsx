import { cn } from "~/lib/utils";
import { BookOpen, CheckCircle, Clock, Loader2, LockIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Progress } from "./progress";

interface ModuleCardProps {
  module: {
    id: string;
    title: string;
    description: string;
    lessons: number;
    estimatedDuration: string;
    status: "generating" | "completed" | "pending" | "failed";
    progress?: number;
  };
  className?: string;
  onClick?: () => void;
}

export function ModuleCard({ module, className, onClick }: ModuleCardProps) {
  const isClickable = module.status === "completed" && onClick;
  const isGenerating = module.status === "generating";
  const isCompleted = module.status === "completed";
  const isFailed = module.status === "failed";
  const isPending = module.status === "pending";

  return (
    <Card
      className={cn(
        "relative transition-all duration-300 group",
        isClickable && "cursor-pointer hover:shadow-lg hover:-translate-y-1",
        isGenerating && "border-blue-200 bg-blue-50",
        isCompleted && "border-emerald-200 bg-emerald-50",
        isFailed && "border-red-200 bg-red-50",
        isPending && "border-slate-200 bg-slate-50",
        className
      )}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="absolute top-4 right-4">
        {isGenerating && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Generating
          </Badge>
        )}
        {isCompleted && (
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
        )}
        {isFailed && (
          <Badge variant="destructive">
            Failed
          </Badge>
        )}
        {isPending && (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <LockIcon className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg transition-all duration-300",
            isCompleted && "bg-green-100 text-green-700",
            isGenerating && "bg-blue-100 text-blue-700",
            isFailed && "bg-red-100 text-red-700",
            isPending && "bg-muted text-muted-foreground"
          )}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <CardTitle className={cn(
              "text-base font-semibold leading-tight",
              isCompleted && "text-green-800",
              isGenerating && "text-blue-800",
              isFailed && "text-red-800",
              isPending && "text-muted-foreground"
            )}>
              {module.title}
            </CardTitle>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {module.estimatedDuration}
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {module.lessons} lessons
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className={cn(
          "text-sm leading-relaxed mb-4",
          isCompleted && "text-green-700",
          isGenerating && "text-blue-700",
          isFailed && "text-red-700",
          isPending && "text-muted-foreground"
        )}>
          {module.description}
        </p>

        {isGenerating && typeof module.progress === 'number' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-blue-600">Generation Progress</span>
              <span className="text-blue-600 font-medium">{module.progress}%</span>
            </div>
            <Progress value={module.progress} className="h-2" />
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>Ready for learning</span>
          </div>
        )}

        {isFailed && (
          <div className="flex items-center gap-2 text-sm text-red-700">
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            <span>Generation failed</span>
          </div>
        )}

        {isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LockIcon className="w-4 h-4" />
            <span>Waiting for prerequisites</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
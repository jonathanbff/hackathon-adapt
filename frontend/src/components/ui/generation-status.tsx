import { cn } from "~/lib/utils";
import { CheckCircle, Clock, Loader2, BookOpen, FileText, Target, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Progress } from "./progress";

interface GenerationStatusProps {
  status: "pending" | "generating" | "completed" | "failed";
  progress: number;
  currentStep: string;
  stats: {
    totalModules: number;
    completedModules: number;
    totalLessons: number;
    completedLessons: number;
    totalAssessments: number;
    completedAssessments: number;
  };
  estimatedTimeRemaining?: string;
  className?: string;
}

export function GenerationStatus({ 
  status, 
  progress, 
  currentStep, 
  stats, 
  estimatedTimeRemaining, 
  className 
}: GenerationStatusProps) {
  const isGenerating = status === "generating";
  const isCompleted = status === "completed";
  const isFailed = status === "failed";
  const isPending = status === "pending";

  const getStatusColor = () => {
    if (isCompleted) return "text-emerald-600";
    if (isFailed) return "text-red-600";
    if (isGenerating) return "text-blue-600";
    return "text-slate-600";
  };

  const getStatusBg = () => {
    if (isCompleted) return "bg-emerald-50 border-emerald-200";
    if (isFailed) return "bg-red-50 border-red-200";
    if (isGenerating) return "bg-blue-50 border-blue-200";
    return "bg-slate-50 border-slate-200";
  };

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (isFailed) return <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"><span className="text-white text-xs">!</span></div>;
    if (isGenerating) return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    return <Clock className="w-5 h-5 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (isCompleted) return "Generation Complete";
    if (isFailed) return "Generation Failed";
    if (isGenerating) return "Generating Course";
    return "Pending";
  };

  return (
    <Card className={cn("relative", getStatusBg(), className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className={cn("text-lg", getStatusColor())}>
                {getStatusText()}
              </CardTitle>
              <p className={cn("text-sm", getStatusColor())}>
                {currentStep}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{progress}%</div>
            {estimatedTimeRemaining && (
              <div className="text-xs text-muted-foreground">
                {estimatedTimeRemaining} remaining
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Modules</span>
            </div>
            <div className="text-lg font-bold">
              {stats.completedModules}/{stats.totalModules}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.totalModules > 0 ? Math.round((stats.completedModules / stats.totalModules) * 100) : 0}%
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Lessons</span>
            </div>
            <div className="text-lg font-bold">
              {stats.completedLessons}/{stats.totalLessons}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0}%
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">Assessments</span>
            </div>
            <div className="text-lg font-bold">
              {stats.completedAssessments}/{stats.totalAssessments}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.totalAssessments > 0 ? Math.round((stats.completedAssessments / stats.totalAssessments) * 100) : 0}%
            </div>
          </div>
        </div>

        {isGenerating && (
          <div className="flex items-center gap-2 p-3 bg-blue-100 rounded-lg">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700">
              AI agents are working on your personalized course
            </span>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center gap-2 p-3 bg-green-100 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">
              Your course is ready for learning!
            </span>
          </div>
        )}

        {isFailed && (
          <div className="flex items-center gap-2 p-3 bg-red-100 rounded-lg">
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            <span className="text-sm text-red-700">
              Course generation encountered an error
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { Trophy, Star, Zap, Target, Award } from "lucide-react";
import { cn } from "~/lib/utils";

interface XPBadgeProps {
  xp: number;
  maxXp?: number;
  level?: number;
  className?: string;
}

export function XPBadge({
  xp,
  maxXp = 1000,
  level = 1,
  className,
}: XPBadgeProps) {
  const percentage = (xp / maxXp) * 100;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge className="xp-badge px-3 py-1">
        <Star className="w-3 h-3 mr-1" />
        {xp} XP
      </Badge>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Nível {level}</span>
        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full progress-bar-fill animate-progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

interface StreakBadgeProps {
  streak: number;
  isActive?: boolean;
  className?: string;
}

export function StreakBadge({
  streak,
  isActive = false,
  className,
}: StreakBadgeProps) {
  return (
    <Badge
      className={cn(
        "streak-indicator px-3 py-1",
        isActive && "animate-success-pulse",
        className
      )}
    >
      <Zap className="w-3 h-3 mr-1" />
      {streak} Dias
    </Badge>
  );
}

interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: "trophy" | "star" | "target" | "award";
  isNew?: boolean;
  className?: string;
}

export function AchievementBadge({
  title,
  description,
  icon,
  isNew = false,
  className,
}: AchievementBadgeProps) {
  const IconComponent = {
    trophy: Trophy,
    star: Star,
    target: Target,
    award: Award,
  }[icon];

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50",
        isNew && "animate-bounce-in border-primary/50 bg-primary/5",
        className
      )}
    >
      <div
        className={cn(
          "p-2 rounded-full",
          isNew
            ? "bg-primary/20 text-primary"
            : "bg-muted/50 text-muted-foreground"
        )}
      >
        <IconComponent className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <h4
          className={cn(
            "font-semibold text-sm",
            isNew ? "text-primary" : "text-foreground"
          )}
        >
          {title}
          {isNew && (
            <Badge className="ml-2 text-xs bg-primary/20 text-primary border-primary/30">
              Novo!
            </Badge>
          )}
        </h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

interface AccuracyMeterProps {
  accuracy: number;
  total: number;
  correct: number;
  className?: string;
}

export function AccuracyMeter({
  accuracy,
  total,
  correct,
  className,
}: AccuracyMeterProps) {
  const getAccuracyColor = (acc: number) => {
    if (acc >= 80) return "from-green-500 to-green-600";
    if (acc >= 60) return "from-yellow-500 to-yellow-600";
    return "from-red-500 to-red-600";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Precisão</span>
        <span className="font-semibold text-foreground">{accuracy}%</span>
      </div>
      <div className="relative">
        <Progress value={accuracy} className="h-3" />
        <div
          className={cn(
            "absolute inset-0 h-3 rounded-full bg-gradient-to-r opacity-90",
            getAccuracyColor(accuracy)
          )}
          style={{ width: `${accuracy}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{correct} corretas</span>
        <span>{total} total</span>
      </div>
    </div>
  );
}

interface FeedbackToastProps {
  type: "success" | "error";
  message: string;
  isVisible: boolean;
  onClose?: () => void;
}

export function FeedbackToast({
  type,
  message,
  isVisible,
  onClose,
}: FeedbackToastProps) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm",
        type === "success" ? "success-feedback" : "error-feedback"
      )}
    >
      <div className="flex items-center gap-2">
        {type === "success" ? (
          <Trophy className="w-5 h-5" />
        ) : (
          <Target className="w-5 h-5" />
        )}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}

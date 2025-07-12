import { motion } from "framer-motion";
import { Target, Award, Zap, Star, Lightbulb, Users } from "lucide-react";
import { Card } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import type { CourseGenerationInput } from "~/server/db/schemas";

interface GoalsStepProps {
  data: CourseGenerationInput;
  onChange: (data: CourseGenerationInput) => void;
}

const goalOptions = [
  {
    id: "career" as const,
    label: "Advance Career",
    icon: Award,
    description: "Get a promotion or new opportunity",
  },
  {
    id: "skill" as const,
    label: "Develop Skill",
    icon: Zap,
    description: "Master a new technical competency",
  },
  {
    id: "hobby" as const,
    label: "Personal Hobby",
    icon: Star,
    description: "Learn something for pleasure and interest",
  },
  {
    id: "certification" as const,
    label: "Certification",
    icon: Award,
    description: "Get a professional certification",
  },
  {
    id: "business" as const,
    label: "Start Business",
    icon: Lightbulb,
    description: "Launch your own venture",
  },
  {
    id: "teaching" as const,
    label: "Teach Others",
    icon: Users,
    description: "Share knowledge with others",
  },
];

export function GoalsStep({ data, onChange }: GoalsStepProps) {
  const toggleGoal = (goalId: string) => {
    const newGoals = data.goals.includes(goalId)
      ? data.goals.filter(g => g !== goalId)
      : [...data.goals, goalId];
    
    onChange({ ...data, goals: newGoals });
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="w-24 h-24 mx-auto bg-primary rounded-full flex items-center justify-center"
        >
          <Target className="w-12 h-12 text-primary-foreground" />
        </motion.div>
        <h2 className="text-3xl font-bold">What are your goals?</h2>
        <p className="text-muted-foreground">
          Select what you want to achieve with this course
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
        {goalOptions.map((goal) => {
          const Icon = goal.icon;
          const isSelected = data.goals.includes(goal.id);

          return (
            <motion.div
              key={goal.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card 
                className={cn(
                  "p-6 cursor-pointer transition-all duration-300",
                  {
                    "border-primary bg-primary/10 shadow-lg": isSelected,
                    "border-border hover:border-primary/50 hover:shadow-md": !isSelected,
                  }
                )}
                onClick={() => toggleGoal(goal.id)}
              >
                <div className="text-center space-y-3">
                  <div className="text-primary">
                    <Icon className="w-6 h-6 mx-auto" />
                  </div>
                  <div>
                    <p className="font-medium">{goal.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {goal.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
} 
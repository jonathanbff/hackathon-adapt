"use client";

import { Target, Briefcase, GraduationCap, Heart, Users } from "lucide-react";
import { Card } from "~/components/ui/card";
import type { UserProfile } from "../types";

interface GoalsStepProps {
  profile: UserProfile;
  onToggle: (value: string) => void;
}

export function GoalsStep({ profile, onToggle }: GoalsStepProps) {
  const goals = [
    {
      id: "carreira",
      label: "Progredir na carreira",
      icon: <Briefcase className="w-5 h-5" />,
    },
    {
      id: "educacao",
      label: "Avançar na educação",
      icon: <GraduationCap className="w-5 h-5" />,
    },
    {
      id: "hobbie",
      label: "Hobbie pessoal",
      icon: <Heart className="w-5 h-5" />,
    },
    {
      id: "networking",
      label: "Fazer networking",
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center">
          <Target className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-xl font-bold">Quais são seus objetivos?</h2>
        <p className="text-muted-foreground">Selecione todos que se aplicam</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {goals.map((goal) => (
          <Card
            key={goal.id}
            className={`p-4 cursor-pointer transition-colors border-2 ${
              profile.goals.includes(goal.id)
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onToggle(goal.id)}
          >
            <div className="flex items-center space-x-3">
              {goal.icon}
              <span className="font-medium">{goal.label}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

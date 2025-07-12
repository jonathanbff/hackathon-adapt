"use client";

import { Brain } from "lucide-react";
import { Card } from "~/components/ui/card";
import type { UserProfile } from "../types";

interface LearningAreaStepProps {
  profile: UserProfile;
  onSelect: (value: string) => void;
}

export function LearningAreaStep({ profile, onSelect }: LearningAreaStepProps) {
  const areas = [
    { id: "tecnologia", label: "Tecnologia", icon: "💻" },
    { id: "negocios", label: "Negócios", icon: "💼" },
    { id: "ciencias", label: "Ciências", icon: "🔬" },
    { id: "artes", label: "Artes", icon: "🎨" },
    { id: "idiomas", label: "Idiomas", icon: "🌍" },
    { id: "saude", label: "Saúde", icon: "🏥" },
    { id: "educacao", label: "Educação", icon: "📚" },
    { id: "outros", label: "Outros", icon: "✨" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center">
          <Brain className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-xl font-bold">O que você quer aprender?</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {areas.map((area) => (
          <Card
            key={area.id}
            className={`p-4 cursor-pointer transition-colors border-2 ${
              profile.learningArea === area.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onSelect(area.id)}
          >
            <div className="text-center space-y-2">
              <div className="text-2xl">{area.icon}</div>
              <p className="font-medium">{area.label}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

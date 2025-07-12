"use client";

import { Brain } from "lucide-react";
import { Card } from "~/components/ui/card";
import type { UserProfile } from "../types";

interface CurrentLevelStepProps {
  profile: UserProfile;
  onSelect: (value: string) => void;
}

export function CurrentLevelStep({ profile, onSelect }: CurrentLevelStepProps) {
  const levels = [
    {
      id: "iniciante",
      label: "Não sei nada sobre o assunto",
      bars: 1,
    },
    {
      id: "basico",
      label: "Conheço algumas coisas básicas",
      bars: 2,
    },
    {
      id: "intermediario",
      label: "Tenho conhecimento intermediário",
      bars: 3,
    },
    {
      id: "avancado",
      label: "Tenho conhecimento avançado",
      bars: 4,
    },
    {
      id: "especialista",
      label: "Sou especialista no assunto",
      bars: 5,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center">
          <Brain className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-xl font-bold">
          Qual seu nível atual de conhecimento?
        </h2>
      </div>
      <div className="space-y-3">
        {levels.map((level) => (
          <Card
            key={level.id}
            className={`p-4 cursor-pointer transition-colors border-2 ${
              profile.currentLevel === level.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onSelect(level.id)}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{level.label}</span>
              <div className="flex space-x-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-6 rounded ${
                      i < level.bars ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

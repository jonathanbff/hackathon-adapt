"use client";

import { Brain } from "lucide-react";
import { Card } from "~/components/ui/card";
import type { UserProfile } from "../types";

interface MultipleIntelligencesStepProps {
  profile: UserProfile;
  onToggle: (value: string) => void;
}

export function MultipleIntelligencesStep({
  profile,
  onToggle,
}: MultipleIntelligencesStepProps) {
  const intelligences = [
    {
      id: "linguistica",
      label: "Linguística",
      desc: "Palavras e linguagem",
    },
    {
      id: "logica",
      label: "Lógico-Matemática",
      desc: "Números e lógica",
    },
    { id: "espacial", label: "Espacial", desc: "Imagens e espaço" },
    {
      id: "corporal",
      label: "Corporal-Cinestésica",
      desc: "Movimento e prática",
    },
    {
      id: "interpessoal",
      label: "Interpessoal",
      desc: "Relacionamentos",
    },
    {
      id: "intrapessoal",
      label: "Intrapessoal",
      desc: "Autoconhecimento",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center">
          <Brain className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-xl font-bold">Múltiplas Inteligências</h2>
        <p className="text-muted-foreground text-sm">
          Baseado na teoria de Gardner - selecione suas principais formas de
          inteligência
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {intelligences.map((intelligence) => (
          <Card
            key={intelligence.id}
            className={`p-3 cursor-pointer transition-colors border-2 ${
              profile.multipleIntelligences.includes(intelligence.id)
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onToggle(intelligence.id)}
          >
            <div className="space-y-1">
              <p className="font-medium text-sm">{intelligence.label}</p>
              <p className="text-xs text-muted-foreground">
                {intelligence.desc}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

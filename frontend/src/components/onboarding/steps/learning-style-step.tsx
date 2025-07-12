"use client";

import { Brain, Eye, Users, PenTool, Activity } from "lucide-react";
import { Card } from "~/components/ui/card";
import type { UserProfile } from "../types";

interface LearningStyleStepProps {
  profile: UserProfile;
  onSelect: (value: string) => void;
}

export function LearningStyleStep({
  profile,
  onSelect,
}: LearningStyleStepProps) {
  const styles = [
    {
      id: "visual",
      label: "Visual",
      desc: "Aprendo melhor vendo diagramas, gráficos e imagens",
      icon: <Eye className="w-5 h-5" />,
    },
    {
      id: "auditivo",
      label: "Auditivo",
      desc: "Aprendo melhor ouvindo explicações e discussões",
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: "leitura",
      label: "Leitura/Escrita",
      desc: "Aprendo melhor lendo textos e fazendo anotações",
      icon: <PenTool className="w-5 h-5" />,
    },
    {
      id: "cinestesico",
      label: "Cinestésico",
      desc: "Aprendo melhor fazendo e praticando",
      icon: <Activity className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center">
          <Brain className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-xl font-bold">Como você prefere aprender?</h2>
        <p className="text-muted-foreground text-sm">
          Baseado no modelo VARK - teoria clássica de estilos de aprendizagem
        </p>
      </div>
      <div className="space-y-3">
        {styles.map((style) => (
          <Card
            key={style.id}
            className={`p-4 cursor-pointer transition-colors border-2 ${
              profile.learningStyle === style.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onSelect(style.id)}
          >
            <div className="flex items-start space-x-3">
              {style.icon}
              <div className="space-y-1">
                <p className="font-medium">{style.label}</p>
                <p className="text-sm text-muted-foreground">{style.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

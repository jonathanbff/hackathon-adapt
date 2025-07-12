"use client";

import { Brain } from "lucide-react";

export function WelcomeStep() {
  return (
    <div className="text-center space-y-8">
      <div className="w-32 h-32 mx-auto bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <Brain className="w-16 h-16 text-white" />
      </div>
      <div className="space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Bem-vindo ao eduONE!
        </h2>
        <p className="text-muted-foreground text-lg">
          A plataforma de aprendizado que se molda para você. Vamos descobrir
          seu perfil de aprendizagem em algumas perguntas rápidas.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-sm font-medium">Personalizado</p>
          </div>
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <div className="text-2xl mb-2">🧠</div>
            <p className="text-sm font-medium">Científico</p>
          </div>
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-sm font-medium">Eficiente</p>
          </div>
        </div>
      </div>
    </div>
  );
}

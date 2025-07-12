"use client";

import { motion } from "framer-motion";
import { BookOpen, Brain, Target } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "IA Personalizada",
    description:
      "Algoritmos adaptativos que se ajustam ao seu estilo de aprendizagem",
  },
  {
    icon: BookOpen,
    title: "Conteúdo Inteligente",
    description:
      "Material didático criado dinamicamente baseado em teorias científicas",
  },
  {
    icon: Target,
    title: "Objetivos Claros",
    description:
      "Metas personalizadas que evoluem com seu progresso de aprendizado",
  },
];

export function FeaturesSection() {
  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 + index * 0.2 }}
          className="group p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
        >
          <div className="mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <feature.icon className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            {feature.title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {feature.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

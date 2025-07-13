"use client";

import { motion } from "framer-motion";
import { GraduationCap, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { TextRotate } from "~/components/ui/text-rotate";

export function Hero() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto text-center mb-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/[0.1] border border-primary/[0.2] mb-8 md:mb-12"
      >
        <GraduationCap className="h-4 w-4 text-primary" />
        <span className="text-sm text-foreground/80 tracking-wide font-medium">
          Plataforma de Aprendizado Inteligente
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 md:mb-8 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/80">
            Aprenda de forma{" "}
          </span>
          <br />
          <p
            // texts={[
            //   "Personalizada",
            //   "Inteligente",
            //   "Eficiente",
            //   "Científica",
            //   "Adaptativa",
            // ]}
            className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
            // rotationInterval={3000}
          >
            Personalizada
          </p>
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed font-light tracking-wide max-w-2xl mx-auto">
          O eduONE utiliza inteligência artificial e teorias científicas de
          aprendizagem para criar uma experiência educacional única, adaptada ao
          seu perfil cognitivo.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
      >
        <Button
          size="lg"
          className="group bg-gradient-primary"
          onClick={() => router.push("/onboarding")}
        >
          Comece Agora
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push("/cursos")}
        >
          Explorar Cursos
        </Button>
      </motion.div>
    </div>
  );
}

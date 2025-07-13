import { RiBrainLine, RiCheckboxCircleLine } from "@remixicon/react";
import { motion } from "framer-motion";
import { Progress } from "~/components/ui/progress";

const aiAgents = [
  {
    id: "content-creator",
    name: "Professor AI",
    avatar: "🎓",
    specialty: "Criação de Conteúdo",
    isActive: false,
    message: "Vou criar o conteúdo perfeito baseado no seu perfil!",
  },
  {
    id: "structure-architect",
    name: "Arquiteto AI",
    avatar: "🏗️",
    specialty: "Estrutura do Curso",
    isActive: false,
    message: "Organizando a melhor estrutura pedagógica para você!",
  },
  {
    id: "personalization-expert",
    name: "Personalizer AI",
    avatar: "🎨",
    specialty: "Personalização",
    isActive: false,
    message: "Adaptando tudo ao seu estilo de aprendizado!",
  },
  {
    id: "assessment-designer",
    name: "Avaliador AI",
    avatar: "📊",
    specialty: "Avaliações",
    isActive: false,
    message: "Criando avaliações que realmente testam seu conhecimento!",
  },
];

export function GeneratingCourse({
  generationProgress,
  activeAgents,
}: {
  generationProgress: number;
  activeAgents: string[];
}) {
  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center space-y-8"
      >
        {/* Main Progress */}
        <div className="space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 mx-auto bg-gradient-primary rounded-full flex items-center justify-center shadow-glow"
          >
            <RiBrainLine className="w-12 h-12 text-white" />
          </motion.div>

          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Criando seu curso personalizado...
            </h2>
            <p className="text-muted-foreground mb-6">
              Nossos AI agents estão trabalhando para você
            </p>
            <Progress value={generationProgress} className="h-3 mb-4" />
            <p className="text-sm text-muted-foreground">
              {generationProgress}% concluído
            </p>
          </div>
        </div>

        {/* Active AI Agents */}
        <div className="grid grid-cols-2 gap-4">
          {aiAgents.map((agent) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0.3, scale: 0.95 }}
              animate={{
                opacity: activeAgents.includes(agent.id) ? 1 : 0.3,
                scale: activeAgents.includes(agent.id) ? 1 : 0.95,
              }}
              className={`p-4 rounded-xl border-2 transition-all ${
                activeAgents.includes(agent.id)
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-border bg-card/50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{agent.avatar}</div>
                <div className="text-left">
                  <p className="font-medium text-sm">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {agent.specialty}
                  </p>
                </div>
              </div>
              {activeAgents.includes(agent.id) && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-primary mt-2"
                >
                  {agent.message}
                </motion.p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Generation Steps */}
        <div className="text-left space-y-2 max-w-md mx-auto">
          {[
            "Analisando seu perfil de aprendizado...",
            "Estruturando conteúdo personalizado...",
            "Adaptando ao seu estilo VARK...",
            "Criando avaliações inteligentes...",
            "Finalizando seu curso...",
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: generationProgress > index * 20 ? 1 : 0.3,
                x: 0,
              }}
              className="flex items-center space-x-3"
            >
              {generationProgress > index * 20 ? (
                <RiCheckboxCircleLine className="w-4 h-4 text-primary" />
              ) : (
                <div className="w-4 h-4 border-2 border-muted rounded-full" />
              )}
              <span className="text-sm text-foreground">{step}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

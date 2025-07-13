import { FeaturesSection } from "~/components/site/featuress-section";
import { Hero } from "~/components/site/hero-section";
import { ElegantShape } from "~/components/ui/elegant-shape";
import { TestimonialsSection } from "~/components/ui/testimonials-with-marquee";
import { AuthGuard } from "~/components/auth";

export default function Home() {
  return (
    <>
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-background">
        <div className="absolute top-4 right-4 z-50">
          <AuthGuard />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-accent/[0.05] blur-3xl" />

        <div className="absolute inset-0 overflow-hidden">
          <ElegantShape
            delay={0.3}
            width={600}
            height={140}
            rotate={12}
            gradient="from-primary/[0.15]"
            className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
          />

          <ElegantShape
            delay={0.5}
            width={500}
            height={120}
            rotate={-15}
            gradient="from-accent/[0.15]"
            className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
          />

          <ElegantShape
            delay={0.4}
            width={300}
            height={80}
            rotate={-8}
            gradient="from-secondary/[0.15]"
            className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
          />

          <ElegantShape
            delay={0.6}
            width={200}
            height={60}
            rotate={20}
            gradient="from-primary/[0.15]"
            className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
          />

          <ElegantShape
            delay={0.7}
            width={150}
            height={40}
            rotate={-25}
            gradient="from-accent/[0.15]"
            className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <Hero />

          <FeaturesSection />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/80 pointer-events-none" />
      </div>

      <TestimonialsSection
        title="Transformando a educação no Brasil"
        description="Milhares de estudantes já estão alcançando seus objetivos com nossa plataforma de ensino personalizado"
        testimonials={[
          {
            author: {
              name: "Marina Silva",
              handle: "@marina_estudos",
              avatar:
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
            },
            text: "O eduONE revolucionou minha forma de estudar! A IA personalizada me ajudou a focar nas áreas que mais precisava melhorar.",
          },
          {
            author: {
              name: "Carlos Oliveira",
              handle: "@carlos_enem",
              avatar:
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
            },
            text: "Consegui aumentar minha nota do ENEM em 200 pontos usando os mapas mentais e quizzes adaptativos da plataforma.",
          },
          {
            author: {
              name: "Ana Beatriz",
              handle: "@ana_vestibular",
              avatar:
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
            },
            text: "A gamificação tornou o estudo muito mais divertido! Agora estudo todos os dias sem nem perceber o tempo passar.",
          },
          {
            author: {
              name: "Pedro Santos",
              handle: "@pedro_med",
              avatar:
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
            },
            text: "Passei em Medicina na primeira tentativa! O sistema de flashcards personalizados foi fundamental para minha aprovação.",
          },
          {
            author: {
              name: "Juliana Costa",
              handle: "@ju_engenharia",
              avatar:
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
            },
            text: "O chat com IA me ajuda a tirar dúvidas instantaneamente. É como ter um professor particular 24/7!",
          },
        ]}
      />
    </>
  );
}

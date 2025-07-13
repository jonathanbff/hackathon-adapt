"use client";

import {
  RiBookletLine,
  RiBrainLine,
  RiFolder3Line,
  RiGitRepositoryLine,
  RiInfoCardLine,
  RiLoader2Line,
  RiMindMap,
  RiVideoChatLine,
} from "@remixicon/react";
import { desc } from "drizzle-orm";
import { useRouter } from "next/navigation";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { api } from "~/trpc/react";

const FEATURES = [
  {
    title: "Aulas",
    description:
      "Acesse as aulas do curso, com materiais adaptados para seu estilo de aprendizagem.",
    icon: RiBookletLine,
    href: "/learning/{id}",
  },
  {
    title: "Quizzes",
    description:
      "Teste o que aprendeu com quizzes interativos e receba feedback imediato.",
    icon: RiBrainLine,
    href: "/courses/{id}/quizzes",
  },
  // {
  //   title: "Mindmap",
  //   description:
  //     "Veja o roadmap do curso e acompanhe seu progresso em cada módulo.",
  //   icon: RiMindMap,
  //   href: "/courses/{id}/mindmap",
  // },
  {
    title: "Flashcards",
    description:
      "Utilize flashcards para revisar o conteúdo aprendido e fixar o conhecimento.",
    icon: RiInfoCardLine,
    href: "/courses/{id}/flashcards",
  },
  {
    title: "Converse com Professor AI",
    description:
      "Converse com o Professor AI para tirar dúvidas e obter explicações detalhadas sobre o conteúdo do curso",
    icon: RiVideoChatLine,
    href: "/courses/{id}/voice-call",
  },
  // {
  //   title: "Materiais de Apoio",
  //   description:
  //     "Acesse os materiais de apoio do curso, como PDFs e links úteis.",
  //   icon: RiFolder3Line,
  //   href: "/courses/{id}/resources",
  // },
];

export function CourseOverview({ courseId }: { courseId: string }) {
  const router = useRouter();

  const { data: course, isLoading } = api.courses.getCourseById.useQuery({
    courseId,
  });

  if (isLoading) {
    return (
      <div className="relative z-50 mx-auto flex w-full flex-1 flex-col self-stretch ">
        <div className="border-b border-dashed border-b-muted">
          <header className="flex min-h-[90px] max-w-5xl mx-auto flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:gap-3 lg:px-8">
            <div className="flex flex-1 gap-4 lg:gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-transparent shadow-xs ring-1 ring-inset ring-muted text-muted-foreground">
                <RiGitRepositoryLine className="size-6" />
              </div>

              <div className="space-y-1">
                <h1 className="text-base font-medium text-foreground">
                  Carregando nome...
                </h1>
                <p className="text-sm text-muted-foreground">
                  carregando descrição...
                </p>
              </div>
            </div>
          </header>
        </div>

        <div className="flex items-center gap-2 h-[300px] w-full justify-center">
          <RiLoader2Line className="size-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-50 mx-auto flex w-full flex-1 flex-col self-stretch ">
      <div className="border-b border-dashed border-b-muted">
        <header className="flex min-h-[90px] max-w-5xl mx-auto flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:gap-3 lg:px-8">
          <div className="flex flex-1 gap-4 lg:gap-3.5 items-center">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-transparent shadow-xs ring-1 ring-inset ring-muted text-muted-foreground">
              <RiGitRepositoryLine className="size-6" />
            </div>

            <div className="space-y-1">
              <h1 className="text-base font-medium text-foreground">
                {course?.title}
              </h1>
              <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                {course?.description}
              </p>
            </div>
          </div>
        </header>
      </div>

      <section className="flex-1 px-4 py-5 max-w-5xl w-full mx-auto">
        <div className="bg-gradient-to-br from-primary/10 via-primary-glow/5 to-transparent rounded-2xl p-8 border border-border/50 animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {course?.title}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mb-6">
            {course?.description}
          </p>

          <div className="space-y-2 mt-5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso Geral</span>
              <span className="text-foreground font-medium">
                {10}% completo
              </span>
            </div>
            <div className="relative">
              <Progress value={10} className="h-3" />
              <div
                className="absolute inset-0 h-3 bg-gradient-to-r from-primary to-primary-glow rounded-full opacity-90 progress-bar-fill"
                style={{ width: `${10}%` }}
              />
            </div>
          </div>
        </div>

        <h2 className="text-base font-semibold text-foreground mt-8">
          Recursos para esse curso:
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
          {FEATURES.map((feature) => {
            const IconComponent = feature.icon;

            return (
              <Card
                key={`feature_${feature.title}`}
                className="module-card cursor-pointer relative bg-card/50 backdrop-blur-sm border-border transition-all duration-300 group overflow-hidden hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5"
                onClick={() => {
                  router.push(feature.href.replace("{id}", courseId));
                }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl transition-all duration-300 module-icon">
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold transition-colors leading-tight text-muted-foreground">
                        {feature.title}
                      </CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

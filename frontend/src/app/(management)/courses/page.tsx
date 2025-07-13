import { RiAddLine, RiGitRepositoryLine } from "@remixicon/react";

import { CoursesCatalog } from "./courses-catalog";
import { Button } from "~/components/ui/button";

const MOCKED_COURSES: Course[] = [
  {
    id: 0,
    title: "Prompt Engineering",
    description: "Domine a arte de criar prompts eficazes para IA generativa",
    instructor: "EDUONE IA",
    rating: 4.9,
    students: 0,
    duration: "3 semanas",
    level: "Intermediário",
    category: "IA",
    tags: ["Prompt", "IA", "ChatGPT"],
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    startedAt: new Date().toISOString(),
    progress: 45,
  },
  {
    id: 1,
    title: "Introdução ao Machine Learning",
    description: "Aprenda os fundamentos de ML com Python e scikit-learn",
    instructor: "Dr. Ana Silva",
    rating: 4.8,
    students: 1250,
    duration: "8 semanas",
    level: "Iniciante",
    category: "Tecnologia",
    tags: ["Python", "IA", "Dados"],
    image:
      "https://images.unsplash.com/photo-1555255707-c07966088b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 2,
    title: "Design Thinking na Prática",
    description: "Metodologia completa para inovação e resolução de problemas",
    instructor: "Carlos Mendes",
    rating: 4.6,
    students: 890,
    duration: "6 semanas",
    level: "Intermediário",
    category: "Design",
    tags: ["Criatividade", "UX", "Inovação"],
    image:
      "https://images.unsplash.com/photo-1542744094-3a31f272c490?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 3,
    title: "Marketing Digital Estratégico",
    description: "Estratégias avançadas para o mundo digital",
    instructor: "Maria Santos",
    rating: 4.9,
    students: 2100,
    duration: "10 semanas",
    level: "Avançado",
    category: "Marketing",
    tags: ["SEO", "Redes Sociais", "Análise"],
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 4,
    title: "Finanças Pessoais",
    description: "Planejamento financeiro e investimentos inteligentes",
    instructor: "João Oliveira",
    rating: 4.7,
    students: 1600,
    duration: "4 semanas",
    level: "Iniciante",
    category: "Finanças",
    tags: ["Investimentos", "Planejamento", "Economia"],
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 5,
    title: "Liderança e Gestão de Equipes",
    description: "Desenvolva habilidades de liderança eficaz",
    instructor: "Patricia Lima",
    rating: 4.8,
    students: 950,
    duration: "12 semanas",
    level: "Intermediário",
    category: "Gestão",
    tags: ["Liderança", "Comunicação", "RH"],
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 6,
    title: "Fotografia Digital",
    description: "Técnicas profissionais de fotografia e edição",
    instructor: "Roberto Ferreira",
    rating: 4.5,
    students: 730,
    duration: "6 semanas",
    level: "Iniciante",
    category: "Arte",
    tags: ["Fotografia", "Edição", "Criatividade"],
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
  },
];

export default function ManagementPage() {
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
                Catálogo de Cursos
              </h1>
              <p className="text-sm text-muted-foreground">
                Descubra novos conhecimentos e desenvolva suas habilidades
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button>
              Criar novo curso
              <RiAddLine className="ml-2 size-5" />
            </Button>
          </div>
        </header>
      </div>

      <section className="flex-1 px-4 py-5 max-w-5xl w-full mx-auto">
        <CoursesCatalog courses={MOCKED_COURSES} />
      </section>
    </div>
  );
}

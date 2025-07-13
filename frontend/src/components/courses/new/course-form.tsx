"use client";
import {
  RiBookLine,
  RiCheckDoubleLine,
  RiFocus3Line,
  RiGroupLine,
  RiLightbulbLine,
  RiTimeLine,
  RiUploadLine,
} from "@remixicon/react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

import { CourseFormStepHeader } from "./course-form-step-header";
import { Award, FileText, Star, Upload, Zap } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

export function CourseForm({
  currentStep,
  formValues,
  setFormValues,
}: {
  currentStep?: number;
  onNext: () => void;
  formValues: GenerateCourseFormSchema;
  setFormValues: React.Dispatch<React.SetStateAction<GenerateCourseFormSchema>>;
}) {
  switch (currentStep) {
    case 0:
      return (
        <div className="space-y-8">
          <CourseFormStepHeader
            title="Quais são seus objetivos?"
            description="Digite o tópico e nossa IA criará um curso personalizado para
                você"
            icon={RiLightbulbLine}
          />

          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <Label className="text-lg font-medium">Tópico do Curso</Label>
                <Input
                  placeholder="Ex: Python para Iniciantes, Marketing Digital, Design UX..."
                  value={formValues.title}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="text-lg p-4 h-14"
                />
              </div>
              <div className="space-y-4">
                <Label className="text-lg font-medium">Descrição</Label>
                <Textarea
                  placeholder="Descreva o que você gostaria de aprender especificamente..."
                  value={formValues.description}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    case 1:
      return (
        <div className="space-y-8">
          <CourseFormStepHeader
            title="Quais são seus objetivos?"
            description="Selecione o que você quer alcançar com este curso"
            icon={RiFocus3Line}
          />

          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                id: "career",
                label: "Avançar na Carreira",
                icon: <Award className="w-6 h-6" />,
                desc: "Conseguir uma promoção ou nova oportunidade",
              },
              {
                id: "skill",
                label: "Desenvolver Habilidade",
                icon: <Zap className="w-6 h-6" />,
                desc: "Dominar uma nova competência técnica",
              },
              {
                id: "hobby",
                label: "Hobbie Pessoal",
                icon: <Star className="w-6 h-6" />,
                desc: "Aprender algo por prazer e interesse",
              },
              {
                id: "certification",
                label: "Certificação",
                icon: <Award className="w-6 h-6" />,
                desc: "Obter uma certificação profissional",
              },
              {
                id: "business",
                label: "Empreender",
                icon: <RiLightbulbLine className="w-6 h-6" />,
                desc: "Iniciar seu próprio negócio",
              },
              {
                id: "teaching",
                label: "Ensinar Outros",
                icon: <RiGroupLine className="w-6 h-6" />,
                desc: "Compartilhar conhecimento",
              },
            ].map((goal) => (
              <motion.div
                key={goal.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card
                  className={`p-6 cursor-pointer transition-all duration-300 ${
                    formValues.goals.includes(goal.id)
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-border hover:border-primary/50 hover:shadow-md"
                  }`}
                  onClick={() => {
                    setFormValues((prev) => ({
                      ...prev,
                      goals: prev.goals.includes(goal.id)
                        ? prev.goals.filter(g => g !== goal.id)
                        : [...prev.goals, goal.id],
                    }));
                  }}
                >
                  <div className="text-center space-y-3">
                    <div className="text-primary">{goal.icon}</div>
                    <div>
                      <p className="font-medium">{goal.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {goal.desc}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      );
    case 2:
      return (
        <div className="space-y-8">
          <CourseFormStepHeader
            title="Duração e Formato"
            description="Escolha a duração e o formato ideal para o curso"
            icon={RiTimeLine}
          />

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Duration */}
            <Card>
              <CardContent className="p-6">
                <Label className="text-lg font-medium mb-4 block">
                  Duração do Curso
                </Label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      id: "1-week",
                      label: "1 Semana",
                      desc: "Curso intensivo",
                    },
                    { id: "1-month", label: "1 Mês", desc: "Ritmo acelerado" },
                    { id: "3-months", label: "3 Meses", desc: "Ritmo normal" },
                    { id: "6-months", label: "6+ Meses", desc: "Ritmo calmo" },
                  ].map((duration) => (
                    <motion.div
                      key={duration.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`p-4 cursor-pointer transition-all ${
                          formValues.duration === duration.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() =>
                          setFormValues((prev) => ({
                            ...prev,
                            duration: duration.id as any,
                          }))
                        }
                      >
                        <div className="text-center space-y-1">
                          <p className="font-medium">{duration.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {duration.desc}
                          </p>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Difficulty */}
            <Card>
              <CardContent className="p-6">
                <Label className="text-lg font-medium mb-4 block">
                  Nível de Dificuldade
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "beginner", label: "Iniciante", desc: "Sem experiência prévia" },
                    { id: "intermediate", label: "Intermediário", desc: "Alguma experiência" },
                    { id: "advanced", label: "Avançado", desc: "Muita experiência" },
                  ].map((level) => (
                    <Card
                      key={level.id}
                      className={`p-4 cursor-pointer transition-all ${
                        formValues.difficulty === level.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() =>
                        setFormValues((prev) => ({
                          ...prev,
                          difficulty: level.id as any,
                        }))
                      }
                    >
                      <div className="text-center space-y-1">
                        <p className="font-medium">{level.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {level.desc}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    case 3:
      return (
        <div className="space-y-8">
          <CourseFormStepHeader
            title="Materiais do Curso"
            description="Adicione seus próprios materiais ou deixe a IA criar tudo para você"
            icon={RiUploadLine}
          />

          <div className="max-w-4xl mx-auto grid grid-cols-1">
            {/* Documents */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-4 hover:border-primary/50 transition-colors"
            >
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Documentos e PDFs</p>
                <p className="text-sm text-muted-foreground">
                  Materiais de referência e conteúdo
                </p>
              </div>
              <Button variant="outline" asChild>
                <label>
                  <RiUploadLine className="mr-2 h-4 w-4" />
                  Fazer Upload
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      setFormValues((prev) => ({
                        ...prev,
                        sources: Array.from(e.target.files ?? []),
                      }))
                    }
                  />
                </label>
              </Button>
              {formValues.sources.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    {formValues.sources.length} arquivo(s) selecionado(s)
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      );
    case 4:
      return (
        <div className="space-y-8">
          <CourseFormStepHeader
            title="Revisão Final"
            description="Confirme os detalhes do seu curso antes da criação"
            icon={RiCheckDoubleLine}
          />

          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Curso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Tópico
                  </Label>
                  <p className="font-medium">{formValues.title}</p>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">
                    Descrição
                  </Label>
                  <p className="font-medium">{formValues.description}</p>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">
                    Objetivos
                  </Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formValues.goals.map((goal) => (
                      <Badge key={goal} variant="secondary">{goal}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Duração
                  </Label>
                  <p className="font-medium">{formValues.duration}</p>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">
                    Nível de Dificuldade
                  </Label>
                  <p className="font-medium">{formValues.difficulty}</p>
                </div>

                {formValues.sources.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Materiais
                    </Label>
                    <p className="font-medium">{formValues.sources.length} arquivo(s)</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      );
    default:
      return <div>Unknown step</div>;
  }
}

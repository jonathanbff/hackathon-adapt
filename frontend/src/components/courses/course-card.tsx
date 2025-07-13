"use client";

import { RiArrowRightLine, RiPlayLine, RiTimeLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export function CourseCard({ course }: { course: Course }) {
  const router = useRouter();

  return (
    <Card
      key={course.id}
      className={`group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${
        course.startedAt ? "ring-2 ring-primary" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary">{course.category}</Badge>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <RiTimeLine className="size-5" />
            <span>{course.duration}</span>
          </div>
        </div>

        <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {course.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {course.progress && (
          <div className="space-y-2">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${course.progress}%` }}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {course.progress}% concluído
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        {course.startedAt ? (
          <div className="w-full space-y-2.5">
            <Button className="w-full">
              <RiPlayLine className="size-5 mr-2" />
              Acessar Curso
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/courses/${course.id}`)}
            >
              <RiArrowRightLine className="size-5 mr-2" />
              Ver Visão Geral
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/courses/${course.id}`)}
          >
            <RiArrowRightLine className="size-5 mr-2" />
            Iniciar curso
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

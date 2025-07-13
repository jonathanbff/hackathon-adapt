"use client";

import {
  RiArrowRightLine,
  RiGroupLine,
  RiPlayLine,
  RiStarLine,
  RiTimeLine,
} from "@remixicon/react";
import { useState } from "react";
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
  const getLevelColor = (level: string) => {
    switch (level) {
      case "Iniciante":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Intermediário":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Avançado":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

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
            <Button variant="outline" className="w-full">
              <RiArrowRightLine className="size-5 mr-2" />
              Ver Visão Geral
            </Button>
          </div>
        ) : (
          <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <RiPlayLine className="size-5 mr-2" />
            Iniciar Curso
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

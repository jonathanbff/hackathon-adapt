"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ChatContainer } from "~/components/chat-container";
import {
  RiRobot2Line,
  RiCloseLine,
  RiSubtractLine,
  RiExpandUpDownLine,
  RiBookOpenLine,
  RiQuestionLine,
} from "@remixicon/react";

type AITeacherChatProps = React.HTMLAttributes<HTMLDivElement> & {
  courseId?: string;
  lessonId?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  defaultExpanded?: boolean;
};

export function AITeacherChat({
  className,
  courseId,
  lessonId,
  position = "bottom-right",
  defaultExpanded = false,
  ...props
}: AITeacherChatProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    setIsMinimized(false);
  };

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  const toggleMaximized = () => {
    setIsMaximized(!isMaximized);
    setIsMinimized(false);
  };

  const closeChat = () => {
    setIsExpanded(false);
    setIsMinimized(false);
    setIsMaximized(false);
  };

  const widgetSize = isMaximized
    ? "w-[90vw] h-[90vh]"
    : isMinimized
    ? "w-80 h-14"
    : "w-96 h-[32rem]";

  // Floating button when chat is closed
  if (!isExpanded) {
    return (
      <div
        className={cn(`fixed ${positionClasses[position]} z-50`, className)}
        {...props}
      >
        <div className="relative">
          <Button
            onClick={toggleExpanded}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90 group"
          >
            <RiRobot2Line className="h-6 w-6 transition-transform group-hover:scale-110" />
            <span className="sr-only">Abrir Professor IA</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(`fixed ${positionClasses[position]} z-50`, className)}
      {...props}
    >
      <Card
        className={cn(
          "shadow-2xl border-0 transition-all duration-300 ease-in-out",
          widgetSize
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-foreground/20">
              <RiRobot2Line className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <CardTitle className="text-sm font-medium">
                Professor IA
              </CardTitle>
              {!isMinimized && (
                <span className="text-xs opacity-80">
                  {courseId ? "Assistente do Curso" : "Assistente Geral"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isMinimized && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMaximized}
                  className="h-6 w-6 p-0 hover:bg-primary-foreground/20 text-primary-foreground"
                  title={isMaximized ? "Restaurar" : "Maximizar"}
                >
                  <RiExpandUpDownLine className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMinimized}
                  className="h-6 w-6 p-0 hover:bg-primary-foreground/20 text-primary-foreground"
                  title="Minimizar"
                >
                  <RiSubtractLine className="h-3 w-3" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={isMinimized ? toggleMinimized : closeChat}
              className="h-6 w-6 p-0 hover:bg-primary-foreground/20 text-primary-foreground"
              title={isMinimized ? "Restaurar" : "Fechar"}
            >
              {isMinimized ? (
                <RiExpandUpDownLine className="h-3 w-3" />
              ) : (
                <RiCloseLine className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="p-0 h-[calc(100%-8rem)]">
              <div className="h-full">
                <ChatContainer
                  showSidebar={false}
                  fullHeight={false}
                  className="h-full"
                />
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

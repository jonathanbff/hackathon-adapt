"use client";

import * as React from "react";
import { useState } from "react";
import { MessageCircle, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ChatContainer } from "~/components/chat-container";

interface ChatWidgetProps {
  className?: string;
  defaultExpanded?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export function ChatWidget({ 
  className = "", 
  defaultExpanded = false, 
  position = "bottom-right" 
}: ChatWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isMaximized, setIsMaximized] = useState(false);

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  const widgetSize = isMaximized 
    ? "w-[90vw] h-[90vh]" 
    : "w-96 h-[32rem]";

  if (!isExpanded) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
        <Button
          onClick={() => setIsExpanded(true)}
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <Card className={`${widgetSize} shadow-xl transition-all duration-300`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AI Assistant</CardTitle>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMaximized(!isMaximized)}
              className="h-6 w-6 p-0"
            >
              {isMaximized ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-4rem)]">
          <div className="h-full">
            <ChatContainer 
              showSidebar={false}
              fullHeight={false}
              className="h-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function EmbeddedChat({ 
  className = "", 
  showSidebar = false, 
  height = "h-96" 
}: {
  className?: string;
  showSidebar?: boolean;
  height?: string;
}) {
  return (
    <Card className={`${className} ${height}`}>
      <CardHeader>
        <CardTitle>AI Assistant</CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-4rem)]">
        <ChatContainer 
          showSidebar={showSidebar}
          fullHeight={false}
          className="h-full"
        />
      </CardContent>
    </Card>
  );
} 
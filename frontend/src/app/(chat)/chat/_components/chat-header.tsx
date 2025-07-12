import * as React from "react";
import { MessageSquare } from "lucide-react";
import { Badge } from "~/components/ui/badge";

interface ChatHeaderProps {
  title: string;
}

export function ChatHeader({ title }: ChatHeaderProps) {
  return (
    <div className="p-4 border-b bg-background">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex gap-2 mt-2">
        <Badge variant="outline" className="text-xs">
          <MessageSquare className="h-3 w-3 mr-1" />
          Document Search
        </Badge>
        <Badge variant="outline" className="text-xs">
          <MessageSquare className="h-3 w-3 mr-1" />
          Web Search
        </Badge>
      </div>
    </div>
  );
} 
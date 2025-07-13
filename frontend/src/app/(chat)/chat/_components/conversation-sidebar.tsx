import * as React from "react";
import { 
  MessageSquare,
  Plus,
  MoreVertical,
  Trash2,
  Sparkles
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Card } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface ConversationSidebarProps {
  conversations: any[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onGenerateTitle: (id: string) => void;
  isGeneratingTitle: boolean;
}

export function ConversationSidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onGenerateTitle,
  isGeneratingTitle,
}: ConversationSidebarProps) {
  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="font-medium text-xs">Conversations</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateConversation}
          className="h-6 w-6 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-1">
        {conversations?.map((conversation) => (
          <Card
            key={conversation.id}
            className={`p-2 mb-1 cursor-pointer transition-colors group ${
              selectedConversationId === conversation.id
                ? "bg-primary/10 border-primary"
                : "hover:bg-accent/50"
            }`}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate text-xs mb-0.5">{conversation.title}</h4>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(conversation.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerateTitle(conversation.id);
                    }}
                    disabled={isGeneratingTitle}
                  >
                    <Sparkles className="h-3 w-3 mr-2" />
                    <span className="text-xs">{isGeneratingTitle ? "Generating..." : "Generate Title"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conversation.id);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    <span className="text-xs">Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </ScrollArea>
    </div>
  );
} 
import * as React from "react";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";

interface EmptyStateProps {
  onCreateConversation: () => void;
}

export function EmptyState({ onCreateConversation }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Welcome to Chat</h2>
          <p className="text-muted-foreground">
            Select a conversation or create a new one to get started
          </p>
        </div>
        <Button onClick={onCreateConversation}>
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>
    </div>
  );
} 
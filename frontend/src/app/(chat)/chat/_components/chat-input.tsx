import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

interface ChatInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: (e: React.FormEvent) => void;
  isLoading: boolean;
  onStop: () => void;
  disabled?: boolean;
}

export function ChatInput({ 
  input, 
  onInputChange, 
  onSendMessage, 
  isLoading, 
  onStop, 
  disabled 
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage(e as any);
    }
  };

  return (
    <div className="p-4 border-t bg-background">
      <form onSubmit={onSendMessage} className="space-y-3">
        <Textarea
          placeholder="Ask about your documents or search the web..."
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          className="min-h-[80px] resize-none"
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {isLoading ? "Thinking..." : `${input.length} characters`}
          </span>
          <div className="flex gap-2">
            {isLoading ? (
              <Button
                type="button"
                variant="outline"
                onClick={onStop}
              >
                Stop
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!input.trim() || disabled}
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
} 
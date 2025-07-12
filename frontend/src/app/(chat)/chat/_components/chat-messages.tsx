import * as React from "react";
import { MessageSquare } from "lucide-react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Message } from "~/components/ui/message";

interface ChatMessagesProps {
  messages: any[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessages({ messages, isLoading, messagesEndRef }: ChatMessagesProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="space-y-4 p-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">Start the conversation</h3>
                <p className="text-sm text-muted-foreground">
                  Ask questions about your documents or search for information
                </p>
              </div>
            </div>
          </div>
        )}

        {messages
          .filter(message => message.role !== "data")
          .map((message) => (
            <Message
              key={message.id}
              role={message.role as "user" | "assistant" | "system"}
              content={message.content}
              timestamp={new Date(message.createdAt || Date.now())}
              toolCalls={message.toolInvocations?.map((inv: any) => ({
                toolName: inv.toolName,
                args: inv.args,
                result: (inv as any).result,
              }))}
            />
          ))}

        {isLoading && (
          <Message
            role="assistant"
            content=""
            isLoading={true}
          />
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
} 
"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import { PaperAirplaneIcon, DocumentMagnifyingGlassIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { 
  ChatContainer, 
  ChatHeader, 
  ChatMessages, 
  ChatFooter 
} from "~/components/ui/chat-container";
import { 
  PromptInput, 
  PromptInputTextarea, 
  PromptInputActions, 
  PromptInputAction 
} from "~/components/ui/prompt-input";
import { Message } from "~/components/ui/message";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

export default function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentToolCalls, setCurrentToolCalls] = useState<any[]>([]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat({
    api: "/api/chat",
    onToolCall: ({ toolCall }) => {
      setCurrentToolCalls(prev => [...prev, toolCall]);
    },
    onFinish: () => {
      setCurrentToolCalls([]);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="container mx-auto h-[calc(100vh-2rem)] max-w-4xl p-4">
      <ChatContainer>
        <ChatHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <DocumentMagnifyingGlassIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">AI Assistant</h1>
                <p className="text-sm text-muted-foreground">
                  Ask questions about your documents or search the web
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <DocumentMagnifyingGlassIcon className="h-3 w-3 mr-1" />
              Document Search
            </Badge>
            <Badge variant="outline" className="text-xs">
              <GlobeAltIcon className="h-3 w-3 mr-1" />
              Web Search
            </Badge>
          </div>
        </ChatHeader>

        <ChatMessages>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                    <DocumentMagnifyingGlassIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium">How can I help you today?</h3>
                    <p className="text-sm text-muted-foreground">
                      Ask questions about your documents or search for current information
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleInputChange({
                          target: { value: "What documents do you have access to?" }
                        } as any);
                      }}
                    >
                      What documents are available?
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleInputChange({
                          target: { value: "What's the latest news in AI?" }
                        } as any);
                      }}
                    >
                      Latest AI news
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <Message
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={new Date(message.createdAt || Date.now())}
                toolCalls={message.toolInvocations?.map(inv => ({
                  toolName: inv.toolName,
                  args: inv.args,
                  result: inv.result,
                }))}
              />
            ))}

            {isLoading && (
              <Message
                role="assistant"
                content=""
                isLoading={true}
                toolCalls={currentToolCalls}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        </ChatMessages>

        <ChatFooter>
          <form onSubmit={handleSubmit} className="space-y-3">
            <PromptInput>
              <PromptInputTextarea
                placeholder="Ask about your documents or search the web..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <PromptInputActions>
                {isLoading ? (
                  <PromptInputAction
                    type="button"
                    onClick={stop}
                    tooltip="Stop generating"
                    className="text-destructive hover:text-destructive"
                  >
                    <div className="h-3 w-3 rounded-full bg-current" />
                  </PromptInputAction>
                ) : (
                  <PromptInputAction
                    type="submit"
                    disabled={!input.trim()}
                    tooltip="Send message"
                    className="text-primary hover:text-primary disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </PromptInputAction>
                )}
              </PromptInputActions>
            </PromptInput>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>
                {isLoading ? "Thinking..." : `${input.length} characters`}
              </span>
            </div>
          </form>
        </ChatFooter>
      </ChatContainer>
    </div>
  );
} 
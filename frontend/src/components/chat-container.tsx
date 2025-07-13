"use client";

import * as React from "react";
import { useChatConversations } from "~/app/(chat)/chat/_components/use-chat-conversations";
import { useChatMessages } from "~/app/(chat)/chat/_components/use-chat-messages";
import { ConversationSidebar } from "~/app/(chat)/chat/_components/conversation-sidebar";
import { ChatMessages } from "~/app/(chat)/chat/_components/chat-messages";
import { ChatInput } from "~/app/(chat)/chat/_components/chat-input";
import { EmptyState } from "~/app/(chat)/chat/_components/empty-state";

interface ChatContainerProps {
  className?: string;
  showSidebar?: boolean;
  fullHeight?: boolean;
}

export function ChatContainer({
  className = "",
  showSidebar = true,
  fullHeight = false,
}: ChatContainerProps) {
  const {
    selectedConversationId,
    conversations,
    currentChat,
    createConversationMutation,
    generateTitleMutation,
    handleCreateConversation,
    handleDeleteConversation,
    handleSelectConversation,
    refetchConversations,
  } = useChatConversations();

  const {
    messages,
    input,
    handleInputChange,
    handleSendMessage,
    isLoading,
    stop,
    messagesEndRef,
  } = useChatMessages({
    selectedConversationId,
    currentChat,
    conversations: conversations || [],
    onMessageFinish: refetchConversations,
    onTitleGenerate: (conversationId) => {
      generateTitleMutation.mutate({ conversationId });
    },
  });

  const onSendMessage = (e: React.FormEvent) => {
    handleSendMessage(e, async () => {
      return await createConversationMutation.mutateAsync({
        title: "New Conversation",
      });
    });
  };

  const handleNewConversation = async () => {
    await handleCreateConversation();
  };

  const containerHeight = fullHeight ? "h-screen" : "h-[calc(100vh-8rem)]";

  return (
    <div className={`flex ${containerHeight} max-w-full ${className}`}>
      {showSidebar && (
        <div className="w-64 shrink-0">
          <ConversationSidebar
            conversations={conversations || []}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            onCreateConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            onGenerateTitle={(conversationId) => {
              generateTitleMutation.mutate({ conversationId });
            }}
            isGeneratingTitle={generateTitleMutation.isPending}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              messagesEndRef={messagesEndRef}
            />
            <ChatInput
              input={input}
              onInputChange={handleInputChange}
              onSendMessage={onSendMessage}
              isLoading={isLoading}
              onStop={stop}
            />
          </>
        ) : (
          <EmptyState onCreateConversation={handleNewConversation} />
        )}
      </div>
    </div>
  );
}

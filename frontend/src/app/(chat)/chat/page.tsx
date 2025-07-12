"use client";

import * as React from "react";
import { useChatConversations } from "./_components/use-chat-conversations";
import { useChatMessages } from "./_components/use-chat-messages";
import { ConversationSidebar } from "./_components/conversation-sidebar";
import { ChatHeader } from "./_components/chat-header";
import { ChatMessages } from "./_components/chat-messages";
import { ChatInput } from "./_components/chat-input";
import { EmptyState } from "./_components/empty-state";

export default function ChatPage() {
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

  return (
    <div className="flex h-screen max-w-full">
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

      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            <ChatHeader
              title={currentChat?.conversation?.title || "Loading..."}
            />
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
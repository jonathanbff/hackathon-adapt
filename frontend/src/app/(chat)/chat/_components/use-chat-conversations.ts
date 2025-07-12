import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

export function useChatConversations() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const utils = api.useUtils();

  const { data: conversations, refetch: refetchConversations } = api.chat.getConversations.useQuery();
  
  const { data: currentChat } = api.chat.getConversation.useQuery(
    { id: selectedConversationId! },
    { enabled: !!selectedConversationId }
  );

  const createConversationMutation = api.chat.createConversation.useMutation({
    onSuccess: (newConversation) => {
      if (newConversation) {
        setSelectedConversationId(newConversation.id);
        refetchConversations();
      }
    },
  });

  const deleteConversationMutation = api.chat.deleteConversation.useMutation({
    onSuccess: (_, variables) => {
      if (selectedConversationId === variables.id) {
        setSelectedConversationId(null);
      }
      refetchConversations();
    },
  });

  const generateTitleMutation = api.chat.generateConversationTitle.useMutation({
    onSuccess: () => {
      refetchConversations();
      if (selectedConversationId) {
        utils.chat.getConversation.invalidate({ id: selectedConversationId });
      }
    },
  });

  const handleCreateConversation = async () => {
    await createConversationMutation.mutateAsync({
      title: "New Conversation",
    });
  };

  const handleDeleteConversation = async (conversationId: string) => {
    await deleteConversationMutation.mutateAsync({ id: conversationId });
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0]?.id ?? null);
    }
  }, [conversations, selectedConversationId]);

  return {
    selectedConversationId,
    conversations,
    currentChat,
    createConversationMutation,
    deleteConversationMutation,
    generateTitleMutation,
    handleCreateConversation,
    handleDeleteConversation,
    handleSelectConversation,
    refetchConversations,
  };
} 
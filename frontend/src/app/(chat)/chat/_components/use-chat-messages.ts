import { useEffect, useRef } from "react";
import { useChat } from "ai/react";
import { api } from "~/trpc/react";

interface UseChatMessagesProps {
  selectedConversationId: string | null;
  currentChat: any;
  conversations: any[];
  onMessageFinish: () => void;
  onTitleGenerate: (conversationId: string) => void;
}

export function useChatMessages({ 
  selectedConversationId, 
  currentChat, 
  conversations, 
  onMessageFinish,
  onTitleGenerate 
}: UseChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = api.useUtils();

  const addMessageMutation = api.chat.addMessage.useMutation({
    onSuccess: () => {
      utils.chat.getConversation.invalidate();
      onMessageFinish();
    },
  });

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setMessages } = useChat({
    api: "/api/chat",
    body: {
      conversationId: selectedConversationId,
    },
    initialMessages: [],
    onFinish: async (message) => {
      if (selectedConversationId) {
        await addMessageMutation.mutateAsync({
          conversationId: selectedConversationId,
          role: message.role as "user" | "assistant" | "system",
          content: message.content,
        });

        const conversation = conversations?.find(c => c.id === selectedConversationId);
        const messageCount = messages.length + 1;
        
        if (conversation && messageCount >= 2 && message.role === 'assistant' && 
            (conversation.title.includes("...") || conversation.title === "New Conversation")) {
          try {
            onTitleGenerate(selectedConversationId);
          } catch (error) {
            console.error("Failed to generate title:", error);
          }
        }
      }
    },
  });

  useEffect(() => {
    if (currentChat?.messages) {
      const chatMessages = currentChat.messages
        .filter((msg: any) => msg.role !== "data")
        .map((msg: any) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          createdAt: msg.createdAt,
        }));
      
      setMessages(chatMessages);
    } else {
      setMessages([]);
    }
  }, [selectedConversationId, currentChat, setMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent, onConversationCreate: () => Promise<any>) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    if (!selectedConversationId) {
      const newConversation = await onConversationCreate();
      if (newConversation) {
        await addMessageMutation.mutateAsync({
          conversationId: newConversation.id,
          role: "user",
          content: input,
        });
      }
    } else {
      await addMessageMutation.mutateAsync({
        conversationId: selectedConversationId,
        role: "user",
        content: input,
      });
    }
    
    handleSubmit(e);
  };

  return {
    messages,
    input,
    handleInputChange,
    handleSendMessage,
    isLoading,
    stop,
    messagesEndRef,
  };
} 
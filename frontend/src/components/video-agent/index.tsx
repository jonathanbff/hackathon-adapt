import React, { useState, useEffect } from "react";
import {
  Video,
  ExternalLink,
  Phone,
  PhoneOff,
  Users,
  Clock,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Settings,
} from "lucide-react";
import type { ConversationResponse, Conversation } from "../../types/tavus";
import { TavusAPI } from "./tavus";
import { presetAgents } from "./presets";
interface ConversationViewerProps {
  conversation: ConversationResponse;

  onBack: () => void;
}
const apiKey = process.env.NEXT_PUBLIC_TAVUS_API_KEY;

export function ConversationViewer({
  conversation,

  onBack,
}: ConversationViewerProps) {
  const [conversationDetails, setConversationDetails] =
    useState<Conversation>(conversation);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    loadConversationDetails();
  }, [conversation.conversation_id]);

  if (!apiKey) {
    return;
  }
  const tavusAPI = new TavusAPI(apiKey);

  const loadConversationDetails = async () => {
    try {
      const details = await tavusAPI.getConversation(
        conversation.conversation_id,
      );
      setConversationDetails(details);
    } catch (error) {
      console.error("Failed to load conversation details:", error);
    }
  };

  const handleEndConversation = async () => {
    setLoading(true);
    try {
      await tavusAPI.endConversation(conversation.conversation_id);
      await loadConversationDetails();
    } catch (error) {
      console.error("Failed to end conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(conversation.conversation_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "ended":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}

      {/* Embedded Video Interface */}
      <div
        className={`bg-card rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${
          isFullscreen ? "fixed inset-4 z-50" : ""
        }`}
      >
        <div className="bg-card from-blue-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-white">
              <Video className="w-5 h-5 mr-2" />
              <h3 className="text-lg font-semibold">
                Conversa ao Vivo com Avatar IA
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-white text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                {conversationDetails.status === "active"
                  ? "Conectado"
                  : "Desconectado"}
              </div>
              {isFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-gray-200 p-1 rounded"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          className={`relative bg-card ${
            isFullscreen ? "h-[calc(100vh-8rem)]" : "aspect-video"
          }`}
        >
          {!videoError ? (
            <iframe
              src={conversation.conversation_url}
              className="w-full h-full border-0 "
              allow="camera *; microphone *; fullscreen *; display-capture *; autoplay *; clipboard-read *; clipboard-write *"
              allowFullScreen
              title="Conversa com Avatar Tavus"
              onError={handleVideoError}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation"
              style={{
                background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                minHeight: "400px",
              }}
              loading="eager"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="text-center text-white p-8">
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">
                  Erro ao Carregar Vídeo
                </h3>
                <p className="text-gray-300 mb-4">
                  Não foi possível carregar a interface de vídeo. Tente
                  recarregar a página ou use o link direto.
                </p>
                <a
                  href={conversation.conversation_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Link Direto
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Video Information */}
        <div className="p-6 bg-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-300">Qualidade: HD 1080p</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-300">Latência: Baixa</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-gray-300">Codec: WebRTC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {/* <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Como Usar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-white mb-2">Controles de Vídeo</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Permita acesso à câmera e microfone quando solicitado</li>
              <li>• Use o botão de tela cheia para uma experiência imersiva</li>
              <li>
                • Os controles de áudio/vídeo estão na interface incorporada
              </li>
              <li>• A conversa é processada em tempo real</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">Dicas de Conversa</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Fale claramente e aguarde a resposta do avatar</li>
              <li>• O avatar responde com base no contexto fornecido</li>
              <li>• Mantenha uma boa iluminação para melhor qualidade</li>
              <li>• Use fones de ouvido para evitar eco</li>
            </ul>
          </div>
        </div>
      </div> */}

      {/* Technical Details */}
      {/* <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Detalhes Técnicos
        </h3>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-300">
                URL da Conversa:
              </span>
              <code className="block mt-1 text-xs text-gray-400 break-all bg-gray-700 p-2 rounded border">
                {conversation.conversation_url}
              </code>
            </div>
            <div>
              <span className="font-medium text-gray-300">ID da Conversa:</span>
              <code className="block mt-1 text-xs text-gray-400 bg-gray-700 p-2 rounded border">
                {conversation.conversation_id}
              </code>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
}

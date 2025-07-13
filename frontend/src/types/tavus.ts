export interface TavusConfig {
  apiKey: string;
  replicaId?: string;
  personaId?: string;
}

export interface ConversationRequest {
  replica_id?: string;
  persona_id?: string;
  audio_only?: boolean;
  callback_url?: string;
  conversation_name?: string;
  conversational_context?: string;
  custom_greeting?: string;
  properties?: {
    max_call_duration?: number;
    participant_left_timeout?: number;
    participant_absent_timeout?: number;
    language?: string;
    enable_closed_captions?: boolean;
    apply_greenscreen?: boolean;
  };
}

export interface ConversationResponse {
  conversation_id: string;
  conversation_name: string;
  status: "active" | "ended";
  conversation_url: string;
  replica_id: string;
  persona_id: string;
  created_at: string;
}

export interface Conversation extends ConversationResponse {
  callback_url?: string;
  updated_at?: string;
}

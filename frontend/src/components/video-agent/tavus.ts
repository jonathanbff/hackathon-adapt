import {
  ConversationRequest,
  ConversationResponse,
  Conversation,
} from "../../types/tavus";

const TAVUS_API_BASE = "https://tavusapi.com/v2";

export class TavusAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      "x-api-key": this.apiKey,
      "Content-Type": "application/json",
    };
  }

  async createConversation(
    request: ConversationRequest,
  ): Promise<ConversationResponse> {
    const response = await fetch(`${TAVUS_API_BASE}/conversations`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create conversation: ${error}`);
    }

    return response.json();
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await fetch(
      `${TAVUS_API_BASE}/conversations/${conversationId}`,
      {
        method: "GET",
        headers: this.getHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get conversation: ${error}`);
    }

    return response.json();
  }

  async listConversations(): Promise<{ conversations: Conversation[] }> {
    const response = await fetch(`${TAVUS_API_BASE}/conversations`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list conversations: ${error}`);
    }

    return response.json();
  }

  async endConversation(conversationId: string): Promise<void> {
    const response = await fetch(
      `${TAVUS_API_BASE}/conversations/${conversationId}`,
      {
        method: "POST",
        headers: this.getHeaders(),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to end conversation: ${error}`);
    }
  }
}

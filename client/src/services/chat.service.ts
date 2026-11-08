import { api } from '../lib/api.js';

export interface IChatSource {
  source: string;
  header: string;
  score: number;
}

export interface IChatMessage {
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  ragSources?: IChatSource[];
  modelStatus?: string;
  latencyMs?: number;
  createdAt?: string;
}

export interface IChatConversationSummary {
  _id: string;
  title: string;
  userRole: string;
  updatedAt: string;
  createdAt: string;
  escalatedTicketId?: string | null;
  messages?: IChatMessage[];
}

export interface IChatResponseData {
  conversationId: string;
  title: string;
  response: string;
  modelStatus: string;
  hasLora: boolean;
  ragSources: IChatSource[];
  latencyMs: number;
  shouldEscalate: boolean;
  escalationMetadata?: {
    category: string;
    priority: string;
    suggested_subject: string;
  } | null;
  suggestedFollowups: string[];
  messages: IChatMessage[];
}

export const chatService = {
  async sendMessage(message: string, conversationId?: string): Promise<IChatResponseData> {
    const res = await api.post('/support/chat', { message, conversationId });
    return res.data.data;
  },

  async getConversations(): Promise<IChatConversationSummary[]> {
    const res = await api.get('/support/chat/conversations');
    return res.data.data || [];
  },

  async getConversationById(id: string): Promise<any> {
    const res = await api.get(`/support/chat/conversations/${id}`);
    return res.data.data;
  },

  async deleteConversation(id: string): Promise<boolean> {
    const res = await api.delete(`/support/chat/conversations/${id}`);
    return res.data.data?.deleted ?? true;
  },

  async escalateToTicket(params: {
    conversationId: string;
    subject: string;
    priority?: string;
    category?: string;
  }): Promise<any> {
    const res = await api.post('/support/chat/escalate', params);
    return res.data.data;
  },

  async getModelInfo(): Promise<any> {
    const res = await api.get('/support/chat/model-info');
    return res.data.data;
  },
};


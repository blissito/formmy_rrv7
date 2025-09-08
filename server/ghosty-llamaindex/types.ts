/**
 * Types for Ghosty LlamaIndex implementation
 */

// Use simplified types to avoid Prisma import issues
interface User {
  id: string;
  name?: string | null;
  email: string;
  plan: string;
  picture?: string | null;
}

interface Chatbot {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  userId: string;
  status: string;
  isActive: boolean;
  conversationCount: number;
  monthlyUsage: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Conversation {
  id: string;
  sessionId: string;
  chatbotId: string;
  status: string;
  messageCount: number;
  createdAt: Date;
}

interface Message {
  id: string;
  content: string;
  role: string;
  conversationId: string;
  createdAt: Date;
}

export interface GhostyConfig {
  mode: 'local' | 'remote';
  remoteEndpoint?: string;
  remoteApiKey?: string;
  llmProvider: 'openai' | 'anthropic';
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ChatbotWithStats extends Chatbot {
  conversations?: Conversation[];
  _count?: {
    conversations: number;
    messages: number;
  };
  stats?: {
    totalConversations: number;
    totalMessages: number;
    avgMessagesPerConversation: number;
    lastActivity?: Date;
    monthlyUsage: number;
  };
}

export interface ChatbotQueryFilters {
  status?: string;
  isActive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export interface StatsQuery {
  chatbotId?: string;
  period: 'day' | 'week' | 'month' | 'year';
  metric: 'conversations' | 'messages' | 'tokens' | 'users' | 'cost';
  groupBy?: 'day' | 'week' | 'month';
}

export interface StatsResult {
  metric: string;
  value: number;
  period: string;
  formattedValue: string;
  comparison?: {
    previousValue: number;
    changePercent: number;
    trend: 'up' | 'down' | 'stable';
  };
  breakdown?: Array<{
    date: string;
    value: number;
  }>;
}

export interface GhostyContext {
  userId: string;
  user: User;
  conversationHistory?: Array<{ role: string; content: string }>;
  sessionId?: string;
}

export interface GhostyResponse {
  content: string;
  toolsUsed: string[];
  sources?: Array<{
    type: 'chatbot' | 'stats' | 'web' | 'context';
    title: string;
    url?: string;
    data?: any;
  }>;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    model: string;
  };
}

export interface RemoteAgentRequest {
  message: string;
  context: GhostyContext;
  config: GhostyConfig;
}

export interface RemoteAgentResponse extends GhostyResponse {
  success: boolean;
  error?: string;
}
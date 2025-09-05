/**
 * Tipos centrales del Formmy Agent Framework
 */

export interface AgentConfig {
  model: string;
  temperature?: number;
  maxIterations?: number;
  retryConfig?: RetryConfig;
  tools?: any[];
  contextLimit?: number;
  callbacks?: AgentCallbacks;
}

export interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
  exponentialBackoff?: boolean;
}

export interface AgentCallbacks {
  onThought?: (thought: AgentThought) => void;
  onAction?: (action: AgentAction) => void;
  onError?: (error: Error, context: string) => void;
  onObservation?: (observation: AgentObservation) => void;
}

export interface ChatOptions {
  contexts?: ContextItem[];
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  model?: string;
  stream?: boolean;
  user?: any;
  sessionId?: string;
  chatbotId?: string;
}

export interface AgentResponse {
  content: string;
  stream?: ReadableStream;
  usage?: TokenUsage;
  toolsUsed?: string[];
  iterations?: number;
  error?: string;
}

export interface AgentThought {
  content: string;
  confidence: number;
  reasoning: string;
  needsTools: boolean;
  nextAction?: 'continue' | 'use_tool' | 'respond' | 'retry';
}

export interface AgentAction {
  type: 'tool_call' | 'response' | 'think' | 'retry';
  tool?: string;
  input?: any;
  content?: string;
  retryReason?: string;
}

export interface AgentObservation {
  success: boolean;
  content: string;
  isComplete: boolean;
  data?: any;
  error?: string;
}

export interface AgentDecision {
  action: 'use_tool' | 'respond' | 'retry';
  tool_name?: string;
  args?: any;
  response?: string;
  confidence: number;
}

export interface AgentContext {
  message: string;
  contexts: ContextItem[];
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  tools: any[];
  model: string;
  stream: boolean;
  user?: any;
  memory?: AgentMemory[];
  chatbotId?: string;
  sessionId?: string;
}

export interface AgentMemory {
  thought: AgentThought;
  action: AgentAction;
  observation: AgentObservation;
  iteration: number;
  timestamp: Date;
}

export interface ContextItem {
  id: string;
  type: 'TEXT' | 'FILE' | 'LINK' | 'QUESTION';
  title?: string | null;
  content?: string | null;
  sizeKB: number;
  keywords?: string[];
}

export interface ContextChunk {
  content: string;
  keywords: string[];
  relevanceScore?: number;
  source?: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedTokens?: number;
}
/**
 * Tipos de Ghosty - Extraídos de hooks legacy para mantener compatibilidad
 */

// Enhanced states that map to agent lifecycle
export type GhostyLlamaState =
  | 'idle'
  | 'thinking'           // Agent is planning
  | 'tool-analyzing'     // Deciding which tools to use
  | 'tool-chatbots'      // Querying chatbots
  | 'tool-stats'         // Getting statistics
  | 'tool-web-search'    // Web searching
  | 'tool-web-fetch'     // Fetching webpage
  | 'synthesizing'       // Combining tool results
  | 'streaming'          // Final response streaming
  | 'error';

// Enhanced progress tracking
export interface ToolProgress {
  toolName: string;
  status: 'queued' | 'running' | 'completed' | 'error';
  progress?: number; // 0-100
  message?: string;
  startTime?: Date;
  endTime?: Date;
}

// Rich source metadata
export interface LlamaSource {
  type: 'chatbot' | 'stats' | 'web' | 'context';
  title: string;
  url?: string;
  snippet?: string;
  favicon?: string;
  image?: string;
  data?: any;
  confidence?: number; // 0-1
  toolUsed?: string;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    queryType?: string;
  };
}

// Enhanced message with metadata
export interface GhostyLlamaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  sources?: LlamaSource[];
  toolsUsed?: string[];
  toolProgress?: ToolProgress[];
  confidence?: number;
  suggestedFollowUp?: string[];
  widgets?: Array<{
    type: 'chart' | 'table' | 'metric' | 'link';
    data: any;
    title?: string;
  }>;
  reasoning?: string;
  isTyping?: boolean;
  state?: GhostyLlamaState;
  thought?: string;
}

// Legacy type aliases for backwards compatibility
export type GhostyState = 'idle' | 'thinking' | 'searching' | 'streaming' | 'error';
export type GhostyMessage = GhostyLlamaMessage;

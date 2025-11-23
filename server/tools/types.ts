/**
 * Types for LlamaIndex Native Tools
 * Simplified types without registry abstraction
 */

export interface ToolContext {
  userId: string | null;
  userPlan: string;
  chatbotId: string | null;
  conversationId?: string; // Para rate limiting y tracking
  message: string;
  integrations: Record<string, any>;
  isGhosty?: boolean; // Flag para distinguir Ghosty de chatbots públicos
  onSourcesFound?: (sources: any[]) => void; // Callback para emitir fuentes al stream
  channel?: "whatsapp" | "web" | "voice"; // Canal de comunicación (para lógica específica de canal)
}

export interface ToolResponse {
  success: boolean;
  message: string;
  data?: any;
}

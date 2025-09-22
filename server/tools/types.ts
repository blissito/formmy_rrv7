/**
 * Types for LlamaIndex Native Tools
 * Simplified types without registry abstraction
 */

export interface ToolContext {
  userId: string;
  userPlan: string;
  chatbotId: string | null;
  message: string;
  integrations: Record<string, any>;
}

export interface ToolResponse {
  success: boolean;
  message: string;
  data?: any;
}
/**
 * Tipos compartidos para el sistema de herramientas
 * Separado para evitar importaciones circulares
 */

import type { Tool } from "../chatbot/providers/types";

export interface ToolDefinition {
  tool: Tool;
  handler: (input: any, context: ToolContext) => Promise<ToolResponse>;
  requiredIntegrations?: string[];
  requiredPlan?: string[];
  enabled?: boolean;
}

export interface ToolContext {
  chatbotId: string;
  userId: string;
  message?: string;
  integrations?: Record<string, any>;
}

export interface ToolResponse {
  success: boolean;
  message: string;
  data?: any;
}
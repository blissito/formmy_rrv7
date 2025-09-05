import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { IntegrationType } from "@prisma/client";
import {
  createChatbot,
  updateChatbot,
  getChatbotById,
  getChatbotBySlug,
  getChatbotsByUserId,
  removeContextItem,
} from "./chatbot/chatbotModel.server";
import {
  activateChatbot,
  deactivateChatbot,
  setToDraftMode,
  markChatbotAsDeleted,
  getChatbotState,
} from "./chatbot/chatbotStateManager.server";
import { validateChatbotCreationAccess } from "./chatbot/chatbotAccess.server";
import { getChatbotBrandingConfigById } from "./chatbot/brandingConfig.server";
import {
  getChatbotUsageStats,
  checkMonthlyUsageLimit,
} from "./chatbot/usageTracking.server";
import {
  addFileContext,
  addUrlContext,
  addTextContext,
  addQuestionContext,
  updateQuestionContext,
  updateTextContext,
  getChatbotContexts,
} from "./chatbot/contextManager.server";
import {
  createIntegration,
  upsertIntegration,
  getIntegrationsByChatbotId,
  updateIntegration,
  toggleIntegrationStatus,
  deleteIntegration,
  getActiveStripeIntegration,
} from "./chatbot/integrationModel.server";
import { createQuickPaymentLink } from "./integrations/stripe-payments";
import { ReminderService } from "./integrations/reminder-service";
import { getAvailableTools, executeToolCall, generateToolPrompts } from "./tools/registry";
import { SimpleAgentLoop } from "./chatbot/agent-loop";
import {
  validateUserAIModelAccess,
  getUserPlanFeatures,
  DEFAULT_CHATBOT_CONFIG,
  generateRandomChatbotName,
  getDefaultAIModelForUser,
} from "~/utils/chatbot.server";
import { getUserOrRedirect } from "./getUserUtils.server";
import { db } from "~/utils/db.server";
import { generateFallbackModels, isAnthropicDirectModel } from "~/utils/aiModels";
import { buildEnrichedSystemPrompt, estimateTokens } from "./chatbot/promptBuilder.server";
import { AIProviderManager } from "./chatbot/providers";
import { addUserMessage, addAssistantMessage } from "./chatbot/messageModel.server";
export { agentEngine } from "./chatbot/agent-decision-engine";
export { performanceMonitor } from "./chatbot/performance-monitor";

// Utility functions
export const truncateConversationHistory = (
  history: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens: number = 2000
): Array<{ role: "user" | "assistant"; content: string }> => {
  if (history.length === 0) return history;
  
  // Filtrar mensajes vacíos que causan errores en Anthropic
  const validHistory = history.filter(msg => msg.content && msg.content.trim().length > 0);
  
  if (validHistory.length === 0) return validHistory;
  
  // Siempre mantener los últimos 6 mensajes (3 intercambios)
  const minMessagesToKeep = Math.min(6, validHistory.length);
  let truncatedHistory = validHistory.slice(-minMessagesToKeep);
  
  // Calcular tokens del historial truncado
  let totalTokens = truncatedHistory.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  
  // Si aún excede el límite, remover mensajes más antiguos de a pares (user + assistant)
  while (totalTokens > maxTokens && truncatedHistory.length > 2) {
    // Remover los 2 mensajes más antiguos (un intercambio completo)
    const removedMessages = truncatedHistory.splice(0, 2);
    totalTokens -= removedMessages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  }
  
  return truncatedHistory;
};

export const createProviderManager = (anthropicApiKey?: string, openRouterApiKey?: string, openaiApiKey?: string) => {
  return new AIProviderManager({
    ...(anthropicApiKey && { 
      anthropic: { apiKey: anthropicApiKey } 
    }),
    ...(openRouterApiKey && { 
      openrouter: { apiKey: openRouterApiKey } 
    }),
    ...(openaiApiKey && { 
      openai: { apiKey: openaiApiKey } 
    })
  });
};

// Export all the server functions we need
export {
  createChatbot,
  updateChatbot,
  getChatbotById,
  getChatbotBySlug,
  getChatbotsByUserId,
  removeContextItem,
  activateChatbot,
  deactivateChatbot,
  setToDraftMode,
  markChatbotAsDeleted,
  getChatbotState,
  validateChatbotCreationAccess,
  getChatbotBrandingConfigById,
  getChatbotUsageStats,
  checkMonthlyUsageLimit,
  addFileContext,
  addUrlContext,
  addTextContext,
  addQuestionContext,
  updateQuestionContext,
  updateTextContext,
  getChatbotContexts,
  createIntegration,
  upsertIntegration,
  getIntegrationsByChatbotId,
  updateIntegration,
  toggleIntegrationStatus,
  deleteIntegration,
  getActiveStripeIntegration,
  createQuickPaymentLink,
  ReminderService,
  getAvailableTools,
  executeToolCall,
  generateToolPrompts,
  SimpleAgentLoop,
  validateUserAIModelAccess,
  getUserPlanFeatures,
  DEFAULT_CHATBOT_CONFIG,
  generateRandomChatbotName,
  getDefaultAIModelForUser,
  getUserOrRedirect,
  db,
  generateFallbackModels,
  isAnthropicDirectModel,
  buildEnrichedSystemPrompt,
  estimateTokens,
  AIProviderManager,
  mammoth,
  XLSX,
  IntegrationType,
  addUserMessage,
  addAssistantMessage
};
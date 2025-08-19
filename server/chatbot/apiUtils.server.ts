import { buildEnrichedSystemPrompt, estimateTokens } from "./promptBuilder.server";
import { AIProviderManager } from "./providers";

/**
 * Función para truncar historial manteniendo contexto importante
 */
export const truncateConversationHistory = (
  history: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens: number = 2000
): Array<{ role: "user" | "assistant"; content: string }> => {
  if (history.length === 0) return history;
  
  // Siempre mantener los últimos 6 mensajes (3 intercambios)
  const minMessagesToKeep = Math.min(6, history.length);
  let truncatedHistory = history.slice(-minMessagesToKeep);
  
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

/**
 * Crear y configurar el provider manager con las API keys disponibles
 */
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

/**
 * Re-export utilities from promptBuilder
 */
export { buildEnrichedSystemPrompt, estimateTokens };
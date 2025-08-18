import type { Chatbot } from "@prisma/client";

/**
 * Función para estimar tokens aproximadamente (4 caracteres = 1 token)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Función unificada para construir prompts inteligentes optimizados por costos
 * Filtra contextos por relevancia y gestiona límites de tokens
 */
export function buildEnrichedSystemPrompt(
  chatbot: Chatbot, 
  userMessage?: string,
  options: {
    maxContextTokens?: number;
    enableLogging?: boolean;
  } = {}
): string {
  const { 
    maxContextTokens = userMessage ? 800 : 300, 
    enableLogging = true 
  } = options;
  
  let enrichedSystemPrompt = chatbot.instructions || "Eres un asistente útil.";
  
  if (enableLogging) {
  }
  
  // Agregar instrucciones personalizadas si existen
  if (chatbot.customInstructions && chatbot.customInstructions.trim()) {
    enrichedSystemPrompt += "\n\n=== INSTRUCCIONES ESPECÍFICAS ===\n";
    enrichedSystemPrompt += chatbot.customInstructions;
    enrichedSystemPrompt += "\n=== FIN INSTRUCCIONES ESPECÍFICAS ===\n";
  }
  
  // CONTEXTO INTELIGENTE: Solo incluir contexto relevante según el mensaje del usuario
  if (chatbot.contexts && chatbot.contexts.length > 0) {
    let contextTokensUsed = 0;
    let contextContent = "\n\n=== CONTEXTO RELEVANTE ===\n";
    
    // FILTRADO INTELIGENTE: Solo contextos relevantes al mensaje del usuario
    let relevantContexts = chatbot.contexts;
    if (userMessage) {
      const userLower = userMessage.toLowerCase();
      relevantContexts = chatbot.contexts.filter(ctx => {
        if (ctx.type === 'question' && ctx.question) {
          return ctx.question.toLowerCase().includes(userLower) || 
                 userLower.includes(ctx.question.toLowerCase().substring(0, 20));
        }
        return ctx.content.toLowerCase().includes(userLower) || 
               userLower.includes(ctx.content.toLowerCase().substring(0, 30));
      });
      
      // Si no hay contextos relevantes, tomar solo los primeros 2 más importantes
      if (relevantContexts.length === 0) {
        relevantContexts = chatbot.contexts.slice(0, 2);
      }
      
      if (enableLogging) {
      }
    }
    
    // Priorizar por relevancia y tipo
    const prioritizedContexts = [...relevantContexts].sort((a, b) => {
      const priority = { question: 0, text: 1, file: 2, url: 3 };
      return (priority[a.type as keyof typeof priority] || 4) - (priority[b.type as keyof typeof priority] || 4);
    });
    
    for (const [index, context] of prioritizedContexts.entries()) {
      let contextText = "";
      switch (context.type) {
        case "text":
          contextText = `**Información ${index + 1}**:\n${context.content}\n\n`;
          break;
        case "file":
          contextText = `**Documento ${index + 1}** (${context.fileName}):\n${context.content}\n\n`;
          break;
        case "url":
          contextText = `**Contenido Web ${index + 1}** (${context.url}):\n${context.content}\n\n`;
          break;
        case "question":
          contextText = `**FAQ ${index + 1}**:\nPregunta: ${context.question}\nRespuesta: ${context.content}\n\n`;
          break;
      }
      
      const contextTokens = estimateTokens(contextText);
      if (contextTokensUsed + contextTokens <= maxContextTokens) {
        contextContent += contextText;
        contextTokensUsed += contextTokens;
      } else {
        // Si el contexto es demasiado largo, truncarlo pero mantener la información clave
        const remainingTokens = maxContextTokens - contextTokensUsed;
        if (remainingTokens > 100) { // Solo agregar si hay espacio mínimo
          const truncatedContent = context.content.substring(0, remainingTokens * 4 * 0.8);
          contextContent += `**${context.type === 'question' ? 'FAQ' : 'Información'} ${index + 1}** (truncado):\n${truncatedContent}...\n\n`;
        }
        break; // No agregar más contextos
      }
    }
    
    contextContent += "=== FIN DEL CONTEXTO ===\n\n";
    contextContent += "IMPORTANTE: Usa esta información para dar respuestas precisas, específicas y útiles. Si la pregunta se relaciona con el contexto proporcionado, prioriza esa información.";
    
    enrichedSystemPrompt += contextContent;
    
    if (enableLogging) {
    }
  }
  
  const finalTokens = estimateTokens(enrichedSystemPrompt);
  if (enableLogging) {
    if (finalTokens > 1500) {
      console.warn(`ALERTA COSTOS: Enviando ${finalTokens} tokens = ~$${(finalTokens * 0.015 / 1000).toFixed(3)} USD solo en INPUT`);
    }
  }
  
  return enrichedSystemPrompt;
}
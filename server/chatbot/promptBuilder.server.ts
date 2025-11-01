import type { Chatbot, Integration } from "@prisma/client";
import { getActiveStripeIntegration } from "./integrationModel.server";
import { getAgentPrompt, type AgentType } from "~/utils/agents/agentPrompts";

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
  
  // Usar el prompt del agente específico si está configurado, sino usar instructions
  let enrichedSystemPrompt: string;
  
  if (chatbot.personality && chatbot.personality !== "default") {
    // Usar prompt especializado del agente seleccionado
    enrichedSystemPrompt = getAgentPrompt(chatbot.personality as AgentType);
    if (enableLogging) {
    }
  } else {
    // Fallback a instructions genéricas
    enrichedSystemPrompt = chatbot.instructions || "Eres un asistente útil.";
    if (enableLogging) {
    }
  }
  
  // REGLAS UNIVERSALES ANTI-ALUCINACIÓN (solo para prompts genéricos, los agentes ya las incluyen)
  if (!chatbot.personality || chatbot.personality === "default") {
    enrichedSystemPrompt += "\n\n=== REGLAS CRÍTICAS OBLIGATORIAS ===\n";
    enrichedSystemPrompt += "- NUNCA inventes información específica como horarios, lugares, nombres, fechas o precios\n";
    enrichedSystemPrompt += "- NUNCA uses placeholders como [nombre del cliente], [fecha], [lugar], [precio], etc.\n";
    enrichedSystemPrompt += "- ÚNICAMENTE usa información que esté EXPLÍCITAMENTE en tu contexto\n";
    enrichedSystemPrompt += "- Si NO tienes información específica, di: 'No tengo esa información específica'\n";
    enrichedSystemPrompt += "- SIEMPRE pregunta por detalles exactos que necesites en lugar de inventarlos\n";
    enrichedSystemPrompt += "- PROHIBIDO asumir o crear información que no esté en tu contexto\n";
    enrichedSystemPrompt += "- Si el contexto está vacío, RECONÓCELO abiertamente\n";
    enrichedSystemPrompt += "=== FIN REGLAS CRÍTICAS ===\n";
  }
  
  if (enableLogging) {
  }
  
  // Agregar instrucciones personalizadas si existen
  if (chatbot.customInstructions && chatbot.customInstructions.trim()) {
    enrichedSystemPrompt += "\n\n=== INSTRUCCIONES ESPECÍFICAS ===\n";
    enrichedSystemPrompt += chatbot.customInstructions;
    enrichedSystemPrompt += "\n=== FIN INSTRUCCIONES ESPECÍFICAS ===\n";
    
    if (enableLogging) {
    }
  } else {
    if (enableLogging) {
    }
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
        return (ctx.content && ctx.content.toLowerCase().includes(userLower)) || 
               (ctx.content && userLower.includes(ctx.content.toLowerCase().substring(0, 30)));
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

/**
 * Función mejorada que incluye capacidades de integración (como Stripe)
 */
export async function buildEnrichedSystemPromptWithIntegrations(
  chatbot: Chatbot, 
  userMessage?: string,
  options: {
    maxContextTokens?: number;
    enableLogging?: boolean;
  } = {}
): Promise<string> {
  // Obtener el prompt base
  let enrichedSystemPrompt = buildEnrichedSystemPrompt(chatbot, userMessage, options);
  
  // Verificar si tiene integración de Stripe activa
  try {
    const stripeIntegration = await getActiveStripeIntegration(chatbot.id);
    
    if (stripeIntegration && stripeIntegration.stripeApiKey) {
      // Agregar capacidades de pago al prompt
      enrichedSystemPrompt += "\n\n=== CAPACIDADES ESPECIALES ===\n";
      enrichedSystemPrompt += "IMPORTANTE: Tienes acceso a generar links de pago de Stripe.\n\n";
      enrichedSystemPrompt += "**CONTEXTO IMPORTANTE DE ROLES:**\n";
      enrichedSystemPrompt += "- El usuario que te habla ES un CLIENTE potencial\n";
      enrichedSystemPrompt += "- Tú representas a la empresa/negocio dueño de este chatbot\n";
      enrichedSystemPrompt += "- Los links de pago son para que el cliente pague por NUESTROS servicios\n\n";
      enrichedSystemPrompt += "**Cuándo usar la generación de pagos:**\n";
      enrichedSystemPrompt += "- Cuando el cliente quiera pagar por nuestros servicios\n";
      enrichedSystemPrompt += "- Si mencionan interés en contratar o pagar algo\n";
      enrichedSystemPrompt += "- Cuando pregunten cómo pueden pagar\n\n";
      enrichedSystemPrompt += "**Cómo proceder:**\n";
      enrichedSystemPrompt += "1. Identifica qué servicio nuestro quiere contratar el cliente\n";
      enrichedSystemPrompt += "2. Determina el precio correspondiente\n";
      enrichedSystemPrompt += "3. Usa la función generate_payment_link con estos parámetros:\n";
      enrichedSystemPrompt += `   - stripe_api_key: "${stripeIntegration.stripeApiKey}"\n`;
      enrichedSystemPrompt += "   - amount: [monto en la moneda especificada]\n";
      enrichedSystemPrompt += "   - description: [descripción del servicio nuestro]\n";
      enrichedSystemPrompt += "   - currency: [mxn, usd, etc.]\n\n";
      enrichedSystemPrompt += "**Ejemplo de respuesta CORRECTO:**\n";
      enrichedSystemPrompt += "✅ Perfecto, genero el link de pago por $[monto] MXN para nuestros servicios de [descripción]:\n";
      enrichedSystemPrompt += "[LINK_DE_PAGO]\n\n";
      enrichedSystemPrompt += "Puedes proceder con el pago de forma segura usando este link.\n";
      enrichedSystemPrompt += "=== FIN CAPACIDADES ESPECIALES ===\n";
      
      if (options.enableLogging) {
      }
    }
  } catch (error) {
    if (options.enableLogging) {
      console.warn("⚠️ Error checking Stripe integration:", error);
    }
  }
  
  return enrichedSystemPrompt;
}
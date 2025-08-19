import type { Chatbot, Integration } from "@prisma/client";
import { getActiveStripeIntegration } from "./integrationModel.server";

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
    console.log("📝 [DEBUG] buildEnrichedSystemPrompt - Datos del chatbot:");
    console.log("   - instructions:", chatbot.instructions?.substring(0, 100) + "...");
    console.log("   - customInstructions:", chatbot.customInstructions?.substring(0, 100) + "...");
    console.log("   - customInstructions length:", chatbot.customInstructions?.length || 0);
  }
  
  // Agregar instrucciones personalizadas si existen
  if (chatbot.customInstructions && chatbot.customInstructions.trim()) {
    enrichedSystemPrompt += "\n\n=== INSTRUCCIONES ESPECÍFICAS ===\n";
    enrichedSystemPrompt += chatbot.customInstructions;
    enrichedSystemPrompt += "\n=== FIN INSTRUCCIONES ESPECÍFICAS ===\n";
    
    if (enableLogging) {
      console.log("✅ [DEBUG] customInstructions agregadas al prompt");
    }
  } else {
    if (enableLogging) {
      console.log("❌ [DEBUG] NO se agregaron customInstructions al prompt");
      console.log("   - customInstructions valor:", JSON.stringify(chatbot.customInstructions));
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
    console.log("🎯 [DEBUG] Prompt final generado (primeros 200 chars):");
    console.log(enrichedSystemPrompt.substring(0, 200) + "...");
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
      enrichedSystemPrompt += "**Cuándo usar la generación de pagos:**\n";
      enrichedSystemPrompt += "- Cuando el usuario solicite crear un cobro, factura, o link de pago\n";
      enrichedSystemPrompt += "- Si mencionan cantidades de dinero y quieren cobrar\n";
      enrichedSystemPrompt += "- Cuando pidan ayuda para recibir pagos\n\n";
      enrichedSystemPrompt += "**Cómo proceder:**\n";
      enrichedSystemPrompt += "1. Pregunta el monto y descripción del producto/servicio\n";
      enrichedSystemPrompt += "2. Usa la función generate_payment_link con estos parámetros:\n";
      enrichedSystemPrompt += `   - stripe_api_key: "${stripeIntegration.stripeApiKey}"\n`;
      enrichedSystemPrompt += "   - amount: [monto en la moneda especificada]\n";
      enrichedSystemPrompt += "   - description: [descripción del producto/servicio]\n";
      enrichedSystemPrompt += "   - currency: [mxn, usd, etc.]\n\n";
      enrichedSystemPrompt += "**Ejemplo de respuesta:**\n";
      enrichedSystemPrompt += "✅ He generado tu link de pago para [descripción] por $[monto]:\n";
      enrichedSystemPrompt += "[LINK_DE_PAGO]\n\n";
      enrichedSystemPrompt += "Puedes compartir este link directamente con tu cliente.\n";
      enrichedSystemPrompt += "=== FIN CAPACIDADES ESPECIALES ===\n";
      
      if (options.enableLogging) {
        console.log("✅ Stripe integration found - payment capabilities added to prompt");
      }
    }
  } catch (error) {
    if (options.enableLogging) {
      console.warn("⚠️ Error checking Stripe integration:", error);
    }
  }
  
  return enrichedSystemPrompt;
}
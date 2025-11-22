/**
 * 🔍 RAG Agent Tool - Agentic RAG con Closure de Seguridad
 *
 * Este tool permite al modelo AI buscar en la knowledge base del chatbot.
 *
 * 🔒 SEGURIDAD:
 * - El chatbotId se captura en CLOSURE al crear el tool
 * - El modelo NO puede modificar el chatbotId (solo puede pasar query)
 * - secureVectorSearch valida formato ObjectId y filtra por chatbotId en MongoDB
 *
 * 🤖 AGENTIC:
 * - El modelo DECIDE cuándo buscar (no se fuerza)
 * - Puede llamar MÚLTIPLES veces para preguntas complejas
 * - Instrucciones en la descripción guían el uso correcto
 */

import { tool } from "ai";
import { z } from "zod";
import { secureVectorSearch } from "@/server/context/vercel_embeddings.secure";

/**
 * Factory function que crea el tool con chatbotId en closure
 *
 * @param chatbotId - ID del chatbot (capturado en closure, NO modificable)
 * @returns Tool de Vercel AI SDK
 */
export const createSearchContextTool = (chatbotId: string) => {
  // 🔒 VALIDAR FORMATO AL CREAR EL TOOL
  if (!/^[0-9a-fA-F]{24}$/.test(chatbotId)) {
    throw new Error(`[RAG Tool] chatbotId inválido: ${chatbotId}`);
  }

  return tool({
    description: `Search the chatbot's knowledge base for relevant information.

🎯 USAGE GUIDELINES:
- Use SPECIFIC queries (e.g., "enterprise pricing", "return policy details")
- NOT generic queries (e.g., "information", "tell me about X")
- You can call this tool MULTIPLE times with different queries
- Break complex questions into multiple targeted searches
- Combine information from multiple searches to answer comprehensively

📊 WHEN TO USE:
- User asks about topics that might be in your knowledge base
- You need factual information to answer accurately
- You want to verify information before responding

❌ WHEN NOT TO USE:
- Greetings and casual conversation
- Questions about current date/time (use get_current_datetime)
- Questions requiring web search (use web_search_google)
- Math calculations (do them directly)

✅ EXAMPLES OF GOOD QUERIES:
- "pricing for enterprise plan"
- "shipping policy for international orders"
- "technical requirements for integration"
- "refund process steps"

❌ EXAMPLES OF BAD QUERIES:
- "tell me everything" (too generic)
- "information about the company" (too broad)
- "what can you do" (meta question)
`,

    parameters: z.object({
      query: z
        .string()
        .describe("Specific, targeted search query for the knowledge base"),
    }),

    execute: async ({ query }) => {
      try {
        // 🔒 secureVectorSearch valida ObjectId y filtra por chatbotId en MongoDB
        // El chatbotId viene del CLOSURE - modelo NO puede modificarlo
        const results = await secureVectorSearch({
          chatbotId, // ⭐ CLOSURE - No modificable
          query,
          topK: 5, // Top 5 más relevantes (optimizado para precision)
        });

        if (!results.results || results.results.length === 0) {
          return "No se encontró información relevante para esta consulta específica. Intenta reformular con términos más específicos o diferentes keywords.";
        }

        // Formatear resultados para el modelo
        const formatted = results.results
          .slice(0, 5)
          .map((r, i) => `[Resultado ${i + 1}]\n${r.content}\n`)
          .join("\n");

        return `Encontré ${results.results.length} resultados relevantes en la base de conocimiento:\n\n${formatted}\n\n⚠️ IMPORTANTE: Usa ESTA información para responder. NO inventes detalles que no están aquí.`;
      } catch (error) {
        console.error("[RAG Tool] Error en vectorSearch:", error);
        return `Error al buscar en la base de conocimiento: ${error instanceof Error ? error.message : "Error desconocido"}. Intenta con otra pregunta o informa al usuario que hubo un problema técnico.`;
      }
    },
  });
};

import { vectorSearch } from "@/server/context/vercel_embeddings";
import { tool } from "ai";
import z from "zod";

/**
 * 📚 Get Context Tool - Búsqueda RAG Semántica
 *
 * Permite al chatbot buscar información en su knowledge base entrenada
 * usando búsqueda vectorial semántica.
 *
 * 🔒 SEGURIDAD:
 * - chatbotId capturado en CLOSURE (no modificable por modelo)
 * - Solo busca en embeddings del chatbot específico
 *
 * 💡 USO:
 * - El modelo detecta cuando necesita información del knowledge base
 * - Llama este tool con la pregunta del usuario
 * - Retorna chunks relevantes del contenido entrenado
 */

/**
 * Factory function que crea el tool con chatbotId en closure
 *
 * @param chatbotId - ID del chatbot (capturado en closure)
 * @returns Tool de Vercel AI SDK
 */
export const createGetContextTool = (chatbotId: string) => {
  // 🔒 VALIDAR FORMATO AL CREAR EL TOOL
  if (!/^[0-9a-fA-F]{24}$/.test(chatbotId)) {
    throw new Error(`[Get Context Tool] chatbotId inválido: ${chatbotId}`);
  }

  return tool({
    description: `Search the chatbot's knowledge base for relevant information using semantic vector search.

🎯 WHEN TO USE:
- User asks about topics covered in the training data
- User wants specific information about products, services, or documentation
- You need to retrieve factual information before answering
- User references content from uploaded files, websites, or FAQs

📋 HOW IT WORKS:
1. Takes the user's question/query as input
2. Performs semantic search in vector database
3. Returns relevant text chunks from training materials

✅ EXAMPLES:

User: "¿Cuál es el precio del plan Enterprise?"
→ Search: "precio plan Enterprise"
→ Returns: Price information from training data

User: "What features are included?"
→ Search: "features included"
→ Returns: Feature list from knowledge base

User: "Tell me about Fly.io GPU costs"
→ Search: "Fly.io GPU costs"
→ Returns: GPU pricing information from uploaded documents

⚠️ CRITICAL:
- ALWAYS use this tool when the answer requires specific/factual information
- The query should be the user's question or key terms
- Use the returned information to answer accurately
- If no results found, tell the user you don't have that information
`,
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "The user's question or search query to find relevant information in the knowledge base"
        ),
    }),

    execute: async ({ query }) => {
      try {
        const res = await vectorSearch({
          chatbotId, // ⭐ CLOSURE - No modificable
          value: query,
        });

        if (!res.success || !res.results || res.results.length === 0) {
          console.log(`❌ [Get Context Tool] No results found`);
          return "No se encontró información relevante en la base de conocimiento para esta consulta.";
        }
        console.info("RAG EXITOSO LENGTH: ", res.results.length);
        // Concatenar contenido de todos los chunks
        const text = res.results.reduce(
          (acc: string, result: any) => acc + result.content + "\n\n",
          ""
        );

        return text;
      } catch (error) {
        console.error("[Get Context Tool] Error:", error);
        return `Error al buscar en la base de conocimiento: ${error instanceof Error ? error.message : "Error desconocido"}`;
      }
    },
  });
};

// Legacy export for backward compatibility (deprecated)
export const getContextTool = tool({
  description:
    "⚠️ DEPRECATED: Use createGetContextTool() instead. Retrieve text chunks related to the chatbotId training, via vector embeddings search by similarity",
  inputSchema: z.object({
    chatbotId: z.string().describe("The coresponding chatbotId"),
    value: z.string().describe("The user or agent question"),
  }),
  execute: async ({ chatbotId, value }) => {
    const res = await vectorSearch({
      chatbotId,
      value,
    });
    const text = res.results?.reduce((acc, result) => acc + result.content, ``);
    return text;
  },
});

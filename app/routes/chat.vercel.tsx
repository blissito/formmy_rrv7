import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import type { Route } from "./+types/chat.vercel";
import z from "zod";
import { getUserOrRedirect } from "@/server/getUserUtils.server";
import {
  upsert,
  updateContext,
  deleteContext,
  vectorSearch,
} from "@/server/context/vercel_embeddings";
import {
  secureUpsert,
  secureUpdateContext,
  secureDeleteContext,
} from "@/server/context/vercel_embeddings.secure";
import { getContextTool } from "@/server/tools/vercel/vectorSearch";
import { createQueryChatbotsTool } from "@/server/tools/vercel/chatbotQuery";
import { createGetChatbotStatsTool } from "@/server/tools/vercel/chatbotStats";
import { createGetUsageLimitsTool } from "@/server/tools/vercel/usageLimits";
import { createWebSearchTool } from "@/server/tools/vercel/webSearch";
import { createGetDateTimeTool } from "@/server/tools/vercel/datetime";
import { db } from "~/utils/db.server";

// 🔒 SECURITY: Admin emails autorizados para modificar Ghosty
const ADMINS = ["fixtergeek@gmail.com", "bremin11.20.93@gmail.com"];
const GHOSTY_CHATBOT_ID = "691e648afcfecb9dedc6b5de";

export const action = async ({ request }: Route.ActionArgs) => {
  const {
    messages,
    intent,
    content,
    chatbotId,
    title,
    value, // extract inside if @todo
    contextId,
  }: {
    value?: string;
    title: string;
    chatbotId: string;
    messages: UIMessage[];
    intent: string;
    content: string;
    contextId?: string;
  } = await request.json();
  const user = await getUserOrRedirect(request);

  // 🔒 SECURITY: Validar acceso a Ghosty
  const isAdmin = ADMINS.includes(user.email);
  const isGhosty = chatbotId === GHOSTY_CHATBOT_ID;

  // Solo admins pueden modificar Ghosty
  if (isGhosty && !isAdmin) {
    return { success: false, error: "Acceso denegado al chatbot de Ghosty" };
  }

  // ******** Chunking and embeddings ********
  if (intent === "upsert") {
    // Check if context with same title already exists
    const existingContext = await db.context.findFirst({
      where: {
        title,
        chatbotId,
      },
    });

    if (existingContext) {
      // Update existing context
      // 🔒 SECURITY: Si es admin en Ghosty, bypass ownership. Sino, validar.
      const result =
        isGhosty && isAdmin
          ? await updateContext({
              contextId: existingContext.id,
              chatbotId,
              title,
              content,
            })
          : await secureUpdateContext({
              contextId: existingContext.id,
              chatbotId,
              title,
              content,
              userId: user.id,
            });

      if (!result.success) {
        return { success: false, error: result.error.message };
      }

      return {
        success: true,
        contextId: result.contextId,
        chunksCreated: result.chunksCreated,
        updated: true,
      };
    } else {
      // Create new context
      // 🔒 SECURITY: Si es admin en Ghosty, bypass ownership. Sino, validar.
      const result =
        isGhosty && isAdmin
          ? await upsert({
              chatbotId,
              title,
              content,
            })
          : await secureUpsert({
              chatbotId,
              title,
              content,
              userId: user.id,
            });

      if (!result.success) {
        return { success: false, error: result.error.message };
      }

      return { success: true, contextId: result.contextId, updated: false };
    }
  }

  // ******** Delete context ********
  if (intent === "delete") {
    if (!contextId) {
      return { success: false, error: "contextId es requerido para eliminar" };
    }

    // 🔒 SECURITY: Si es admin en Ghosty, bypass ownership. Sino, validar.
    const result =
      isGhosty && isAdmin
        ? await deleteContext({
            contextId,
            chatbotId,
          })
        : await secureDeleteContext({
            contextId,
            chatbotId,
            userId: user.id,
          });

    if (!result.success) {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  }

  // ******** Semantic search ********
  if (intent === "retrieval") {
    console.log("INPUT::", value);
    const { success } = await vectorSearch({
      chatbotId,
      value: value!,
    });
    console.log("SUCCESS?", success);
    return null;
  }

  // @TODO: find chatbot for public/common use else:
  // Ghosty agent default flow
  // USERID: 000000000000000000000001
  // chatbotId: 691e648afcfecb9dedc6b5de

  const selfUserTool = tool({
    description: `Displays user profile information.`,
    inputSchema: z.object({}),
    execute: async () => user,
  });

  // @todo mover el system prompt a su propio archivo
  const result = streamText({
    model: openai("gpt-4.1-mini-2025-04-14"), // The best for tool calling
    // model: anthropic("claude-haiku-4-5-20251001"),
    messages: convertToModelMessages(messages),
    // @TODO: revisit using system here
    system: `Eres Ghosty, el agente general de Formmy, tu _id(id) asignado es: 691e648afcfecb9dedc6b5de.

# Herramientas disponibles:
- selfUserTool: Muestra información del perfil del usuario
- getContextTool: Búsqueda RAG en knowledge base (usa múltiples queries si es necesario)
- queryChatbotsTool: Lista y filtra los chatbots del usuario (retorna IDs + metadata)
- getChatbotStatsTool: Estadísticas detalladas de chatbots (conversaciones, engagement, performance)
- getUsageLimitsTool: Límites del plan y uso actual (conversaciones, créditos)
- webSearchTool: Búsqueda web actualizada con Google (caché 30min)
- getDateTimeTool: Fecha y hora actual en México (GMT-6)

# Reglas importantes:
- No respondas preguntas no relacionadas con Formmy
- Usa emojis moderadamente (algunos, no demasiados)
- Cuando el usuario pregunte por estadísticas, usa getChatbotStatsTool
- Para límites de plan o uso, usa getUsageLimitsTool
- Después de usar selfUserTool no muestres la información raw, úsala internamente

# CRÍTICO - Uso de IDs:
- queryChatbotsTool retorna datos estructurados con el campo "id" para cada chatbot
- SIEMPRE usa el ID (campo "id") cuando llames a getChatbotStatsTool
- NUNCA uses el nombre del chatbot como ID
- Ejemplo: Si queryChatbotsTool retorna {"id": "507f1f77bcf86cd799439011", "name": "Ghosty"}, usa "507f1f77bcf86cd799439011" para getChatbotStatsTool
      `,
    tools: {
      selfUserTool,
      getContextTool,
      queryChatbotsTool: createQueryChatbotsTool(user),
      getChatbotStatsTool: createGetChatbotStatsTool(user),
      getUsageLimitsTool: createGetUsageLimitsTool(user),
      webSearchTool: createWebSearchTool(),
      getDateTimeTool: createGetDateTimeTool(),
      dummyArtifactTool,
    },
    stopWhen: stepCountIs(5), // unless we need more power for tools, 12 maybe?
  });

  return result.toUIMessageStreamResponse();
};

const dummyArtifactTool = tool({
  inputSchema: z.object({}),
  description:
    "Esta herramienta detona la apertura del artefacto de edición de texto",
  execute: async () => null,
});

//   return new Response(result.toUIMessageStream, {
//     headers: {
//       'Content-Type': 'text/plain; charset=utf-8',
//       'X-Vercel-AI-Data-Stream': 'v1'
//     }
//   });

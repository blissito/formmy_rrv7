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
import { calculateCost } from "@/server/chatbot/pricing.server";

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
        return {
          success: false,
          error: result.error?.message || "Error al actualizar contexto",
        };
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
        return {
          success: false,
          error: result.error?.message || "Error al crear contexto",
        };
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
      return {
        success: false,
        error: result.error?.message || "Error al eliminar contexto",
      };
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

  // ⏱️ Start time para medir responseTime
  const startTime = Date.now();

  // @todo mover el system prompt a su propio archivo
  const result = streamText({
    model: openai("gpt-4.1-mini-2025-04-14"), // The best for tool calling
    // model: anthropic("claude-haiku-4-5-20251001"),
    messages: convertToModelMessages(messages),
    // @TODO: revisit using system here
    system: `Eres Ghosty, el agente general de Formmy, tu _id(id) asignado es: 691e648afcfecb9dedc6b5de.

# ⚠️ REGLA FUNDAMENTAL - TOOL-FIRST APPROACH:
NO PUEDES responder NINGUNA pregunta sobre datos del usuario sin PRIMERO usar las herramientas.
Si el usuario pregunta por chatbots, stats, conversaciones, límites - DEBES usar las tools ANTES de responder.
ESTÁ PROHIBIDO decir "no tienes chatbots" o "no hay datos" sin haber consultado las herramientas primero.

# Herramientas disponibles:
- queryChatbotsTool: ⚠️ USA ESTO PRIMERO para cualquier pregunta sobre chatbots del usuario
- getChatbotStatsTool: Estadísticas detalladas (SOLO usar DESPUÉS de queryChatbotsTool)
- getUsageLimitsTool: Límites del plan y uso actual
- getContextTool: Búsqueda RAG en knowledge base de Formmy
- selfUserTool: Información del perfil del usuario
- webSearchTool: Búsqueda web actualizada con Google (caché 30min)
- getDateTimeTool: Fecha y hora actual en México (GMT-6)

# 🚨 PROTOCOLO OBLIGATORIO para consultas de datos:

## Si usuario pregunta por CHATBOTS o STATS:
PASO 1: LLAMA queryChatbotsTool() INMEDIATAMENTE (SIN parámetros para ver todos)
PASO 2: ESPERA el resultado del tool
PASO 3: SOLO ENTONCES responde basándote en los datos retornados
- Si queryChatbotsTool retorna lista vacía → "No tienes chatbots creados aún"
- Si queryChatbotsTool retorna chatbots → Presenta la lista y opcionalmente llama getChatbotStatsTool para más detalles

## Si usuario pregunta por LÍMITES o CONVERSACIONES:
PASO 1: LLAMA getUsageLimitsTool() INMEDIATAMENTE
PASO 2: Responde con los datos retornados

## Si usuario pregunta sobre FORMMY (features, docs, cómo hacer algo):
PASO 1: LLAMA getContextTool() con la query del usuario
PASO 2: Responde basándote en los resultados del RAG

# Ejemplos CORRECTOS:
Usuario: "cuáles son mis chatbots?"
Ghosty: [LLAMA queryChatbotsTool()] → [ESPERA resultado] → [RESPONDE con datos]

Usuario: "mis stats"
Ghosty: [LLAMA queryChatbotsTool()] → [LLAMA getChatbotStatsTool()] → [RESPONDE con ambos resultados]

# Ejemplos INCORRECTOS (PROHIBIDOS):
Usuario: "cuáles son mis chatbots?"
Ghosty: "No tienes chatbots" ❌ NUNCA - Debes llamar queryChatbotsTool primero

# Reglas adicionales:
- No respondas preguntas no relacionadas con Formmy
- Usa emojis moderadamente
- queryChatbotsTool retorna campo "id" (24 chars hex) - úsalo para getChatbotStatsTool
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
    stopWhen: stepCountIs(5), // Límite de pasos (tool calls + respuestas)
    // 📊 TRACKING: onFinish de streamText (recibe totalUsage)
    onFinish: async ({ text, totalUsage, finishReason }) => {
      try {
        // 📊 TRACKING: Métricas de Ghosty (para observabilidad)
        const inputTokens = totalUsage?.promptTokens || 0;
        const outputTokens = totalUsage?.completionTokens || 0;
        const totalTokens =
          totalUsage?.totalTokens || inputTokens + outputTokens;

        // 🔍 Modelo hardcodeado (GPT-4.1-mini)
        const provider = "openai";
        const model = "gpt-4.1-mini-2025-04-14";

        // 💰 Calcular costo
        const costResult = calculateCost(provider, model, {
          inputTokens,
          outputTokens,
          cachedTokens: 0,
        });

        // ⏱️ Calcular tiempo de respuesta
        const responseTime = Date.now() - startTime;

        console.log(
          `[Ghosty] ✅ Response tracked: ${totalTokens} tokens, $${costResult.totalCost.toFixed(6)} (${provider}/${model}), ${responseTime}ms`
        );

        // TODO: Opcional - Crear Trace para observabilidad
        // await createTrace({
        //   userId: user.id,
        //   chatbotId: GHOSTY_CHATBOT_ID,
        //   input: messages[messages.length - 1].content,
        //   model,
        //   totalTokens,
        //   totalCost: costResult.totalCost,
        // });
      } catch (error) {
        console.error("[Ghosty] ❌ Error tracking metrics:", error);
      }
    },
  });

  return result.toUIMessageStreamResponse();
};

// @TODO: revisit
const dummyArtifactTool = tool({
  inputSchema: z.object({}),
  description: "Esta herramienta detona la apertura del artefacto contenedor",
  execute: async () => null,
});

//   return new Response(result.toUIMessageStream, {
//     headers: {
//       'Content-Type': 'text/plain; charset=utf-8',
//       'X-Vercel-AI-Data-Stream': 'v1'
//     }
//   });

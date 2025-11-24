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

# REGLA CRÍTICA - OBLIGATORIO LLAMAR TOOLS ANTES DE RESPONDER:

Cuando el usuario mencione CUALQUIERA de estas palabras clave, DEBES llamar la tool INMEDIATAMENTE:
- "chatbots", "bots", "agentes", "mis chatbots", "cuántos chatbots", "enlista", "lista de bots"
- "stats", "estadísticas", "conversaciones", "métricas", "uso"
- "límites", "plan", "créditos", "cuota"

PROHIBIDO ABSOLUTO: Responder sin llamar tools primero
OBLIGATORIO: Llamar tool primero, ver resultado, responder basado en resultado

# Herramientas (tools) disponibles:

1. queryChatbotsTool - Para CUALQUIER pregunta sobre chatbots del usuario
   - Úsala cuando: "mis chatbots", "cuáles son", "cuántos tengo", "enlista", "bots activos"
   - Retorna: Lista completa con stats (conversaciones, contextos, integraciones)
   - SIEMPRE llámala ANTES de decir "no tienes chatbots"

2. getChatbotStatsTool - Estadísticas detalladas de UN chatbot específico
   - Úsala DESPUÉS de queryChatbotsTool para drill-down
   - Requiere: chatbotId (obtenido de queryChatbotsTool)

3. getUsageLimitsTool - Límites del plan y uso actual
   - Úsala cuando: "límites", "plan", "cuota", "cuántas conversaciones me quedan"

4. getContextTool - RAG search en knowledge base de Formmy
   - Úsala cuando: "cómo hacer X en Formmy", "qué es X", "docs de X"

5. selfUserTool - Perfil del usuario (email, plan, etc.)
6. webSearchTool - Google search (caché 30min)
7. getDateTimeTool - Fecha/hora México (GMT-6)

# FLUJO OBLIGATORIO para preguntas sobre CHATBOTS:

PASO 1: LLAMAR queryChatbotsTool() SIN parámetros (usa defaults)
PASO 2: ESPERAR resultado del tool
PASO 3: LEER el resultado completo que retorna
PASO 4: RESPONDER basándote ÚNICAMENTE en lo que el tool retornó

EJEMPLO CORRECTO:
Usuario: "enlista mis chatbots"
Ghosty: [Llama queryChatbotsTool]
Tool retorna: "Encontré 3 chatbots (3 activos)..."
Ghosty: "Tienes 3 chatbots activos: [lista]"

EJEMPLO INCORRECTO (PROHIBIDO):
Usuario: "enlista mis chatbots"
Ghosty: "No tienes chatbots creados aún" <- NUNCA HACER ESTO SIN LLAMAR TOOL PRIMERO

# FLUJO para STATS/LÍMITES:
- Si pregunta por stats generales: queryChatbotsTool()
- Si pregunta por stats de un bot específico: getChatbotStatsTool(chatbotId)
- Si pregunta por límites/plan: getUsageLimitsTool()

# FLUJO para preguntas sobre FORMMY:
- getContextTool(query) para buscar en docs
- Responder basándote en resultados del RAG

# Reglas adicionales:
- Usa emojis moderadamente (máx 2-3 por mensaje)
- No respondas preguntas no relacionadas con Formmy
- Si el resultado del tool dice "0 chatbots" -> ENTONCES sí puedes decir "No tienes chatbots creados aún"
- queryChatbotsTool retorna campo "id" (24 hex chars) - úsalo para getChatbotStatsTool si necesitas drill-down
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

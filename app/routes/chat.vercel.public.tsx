import type { Route } from "./+types/chat.vercel.public";
import { validateMonthlyConversationLimit } from "@/server/chatbot/planLimits.server";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { db } from "~/utils/db.server";
import { mapModel, getModelInfo, getModelTemperature } from "@/server/config/vercel.model.providers";
import { nanoid } from "nanoid";
import { getConversationBySessionId } from "@/server/chatbot/conversationModel.server";
import {
  addAssistantMessage,
  addUserMessage,
  getMessagesByConversationId,
} from "@/server/chatbot/messageModel.server";
import { createGetContextTool } from "@/server/tools/vercel/vectorSearch";
import { createSaveLeadTool } from "@/server/tools/vercel/saveLead";
import {
  createOpenArtifactTool,
  getInstalledArtifactsForPrompt,
} from "@/server/tools/vercel/artifactTool";
import { loadCustomToolsForChatbot } from "@/server/tools/vercel/customHttpTool";
import { calculateCost } from "@/server/chatbot/pricing.server";
import { validateDomainAccess } from "@/server/utils/domain-validator.server";
import { getRequestOrigin } from "@/server/utils/request-origin.server";
import {
  startTrace,
  endTrace,
  failTrace,
  startSpan,
  endSpan,
  type TraceContext,
} from "@/server/tracing/instrumentation";

/**
 * ✅ Loader para cargar mensajes históricos (GET request)
 * El cliente usa esto para restaurar conversaciones al recargar
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const chatbotId = url.searchParams.get("chatbotId");

  if (!sessionId || !chatbotId) {
    return Response.json({ messages: [] });
  }

  // 🔒 VALIDACIÓN DE DOMINIO - Cargar chatbot para obtener allowedDomains
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { settings: true },
  });

  if (chatbot) {
    const allowedDomains = chatbot.settings?.security?.allowedDomains || [];
    const origin = getRequestOrigin(request);
    const validation = validateDomainAccess(origin, allowedDomains);

    if (!validation.allowed) {
      console.warn(
        `[Chat Loader] ❌ Domain blocked: ${origin || "no-origin"} -> ${chatbotId}`
      );
      return Response.json({ error: "Dominio no autorizado" }, { status: 403 });
    }
  }

  // Buscar conversación por sessionId
  const conversation = await getConversationBySessionId(sessionId, chatbotId);

  if (!conversation) {
    return Response.json({ messages: [] });
  }

  // Cargar mensajes históricos (filtrar vacíos - tool calls sin texto)
  const dbMessages = await getMessagesByConversationId(conversation.id);
  const messages: UIMessage[] = dbMessages
    .filter((msg) => msg.role !== "SYSTEM" && msg.content && msg.content.trim())
    .map((msg) => ({
      id: msg.id,
      role: msg.role.toLowerCase() as "user" | "assistant",
      parts: [{ type: "text" as const, text: msg.content }],
    }));

  return Response.json({ messages });
}

export async function action({ request }: Route.ActionArgs) {
  const url = new URL(request.url);
  // ✅ Patrón "Last Message Only" - recibir solo el nuevo mensaje
  const { message, id: sessionId } = await request.json();
  const chatbotId = url.searchParams.get("chatbotId");

  // 🔒 VALIDAR FORMATO OBJECTID
  if (!chatbotId) {
    return Response.json(
      { error: "chatbotId inválido o faltante" },
      { status: 404 }
    );
  }

  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId, status: "ACTIVE" },
  });

  if (!chatbot) {
    return Response.json(
      { error: "Chatbot no encontrado o inactivo" },
      { status: 404 }
    );
  }

  // 🔒 VALIDACIÓN DE DOMINIO
  const allowedDomains = chatbot.settings?.security?.allowedDomains || [];
  const origin = getRequestOrigin(request);
  const validation = validateDomainAccess(origin, allowedDomains);

  if (!validation.allowed) {
    console.warn(
      `[Chat Action] ❌ Domain blocked: ${origin || "no-origin"} -> ${chatbot.slug}`,
      validation.reason
    );
    return Response.json(
      { error: "Dominio no autorizado para este chatbot" },
      { status: 403 }
    );
  }

  // ✅ BUSCAR conversación existente ANTES de validar límites
  let conversation = await getConversationBySessionId(sessionId, chatbotId);

  // ✅ CARGAR MENSAJES HISTÓRICOS DE LA DB (patrón 2025)
  // ⚠️ FILTRAR mensajes vacíos - tool calls sin texto causan error en API
  let historicalMessages: UIMessage[] = [];
  if (conversation) {
    const dbMessages = await getMessagesByConversationId(conversation.id);
    historicalMessages = dbMessages
      .filter((msg) => msg.role !== "SYSTEM" && msg.content && msg.content.trim())
      .map((msg) => ({
        id: msg.id,
        role: msg.role.toLowerCase() as "user" | "assistant",
        parts: [{ type: "text" as const, text: msg.content }],
      }));
  }

  // Si la conversación no existe, validar límites y crear nueva
  if (!conversation) {
    const limitCheck = await validateMonthlyConversationLimit(chatbotId);

    if (!limitCheck.canCreate) {
      return Response.json(
        {
          error: `Este chatbot ha alcanzado su límite mensual de conversaciones (${limitCheck.maxAllowed}). Por favor contacta al propietario.`,
        },
        { status: 429 }
      );
    }

    // Usar upsert para evitar race conditions y conflictos con conversaciones DELETED
    conversation = await db.conversation.upsert({
      where: { sessionId },
      create: {
        chatbotId,
        visitorId: nanoid(),
        visitorIp: request.headers.get("x-forwarded-for") || undefined,
        sessionId,
        status: "ACTIVE",
      },
      update: {
        status: "ACTIVE", // Reactivar si estaba DELETED
      },
    });
  }

  // ✅ COMBINAR mensajes históricos + mensaje nuevo (patrón "Last Message Only")
  const allMessages = [...historicalMessages, message];
  const textContent = message.parts
    .filter((p: any) => p.type === "text")
    .map((p: any) => p.text)
    .join("");

  await addUserMessage(conversation.id, textContent);

  // 📊 OBSERVABILITY: Iniciar trace para esta conversación
  let traceCtx: TraceContext | null = null;
  try {
    traceCtx = await startTrace({
      userId: chatbot.userId,
      chatbotId: chatbot.id,
      conversationId: conversation.id,
      input: textContent,
      model: chatbot.aiModel,
    });
  } catch (err) {
    console.error("[Chat Public] ⚠️ Failed to start trace (non-blocking):", err);
  }

  // 🎨 Cargar lista de artefactos instalados para el prompt
  let installedArtifacts = "No hay artefactos instalados.";
  try {
    console.log("[chat.vercel.public] Loading artifacts for chatbot:", chatbotId);
    installedArtifacts = await getInstalledArtifactsForPrompt(chatbotId);
    console.log("[chat.vercel.public] Artifacts loaded OK");
  } catch (err) {
    console.error("[chat.vercel.public] ERROR loading artifacts:", err);
  }

  // 🎭 Construir system prompt usando el agente configurado o instrucciones genéricas
  const { getAgentPrompt } = await import("~/utils/agents/agentPrompts");

  let basePrompt = "";
  if (chatbot.personality && chatbot.personality !== "default") {
    // Usar prompt especializado del agente seleccionado
    basePrompt = getAgentPrompt(chatbot.personality as any);
  } else {
    // Fallback a instructions genéricas
    basePrompt = chatbot.instructions || "Eres un asistente útil.";
  }

  // Agregar custom instructions si existen (sin sobreescribir el prompt base)
  if (chatbot.customInstructions && chatbot.customInstructions.trim()) {
    basePrompt += `\n\n# INSTRUCCIONES ADICIONALES:\n${chatbot.customInstructions}`;
  }

  // System prompt con instrucciones para artefactos (patrón HITL)
  const systemPrompt = `
    ${basePrompt}

    # ⚠️ CRÍTICO - Uso de Knowledge Base:
    Tienes acceso a una base de conocimiento con información específica sobre este negocio.
    - SIEMPRE usa la herramienta de búsqueda cuando el usuario haga preguntas específicas
    - La información en la base de conocimiento es tu fuente de verdad
    - Si encuentras información relevante, úsala para responder
    - Si no encuentras información, indica claramente que no tienes esa información específica

    # 🎨 ARTEFACTOS INTERACTIVOS

    Tienes acceso a componentes visuales interactivos. SIGUE ESTE PROCESO OBLIGATORIO:

    ## PROCESO:
    1. **DETECTAR**: Si el usuario menciona palabras clave de un artefacto (ver abajo) → ACTÍVALO
    2. **BUSCAR DATOS**: SIEMPRE llama getContextTool PRIMERO para obtener datos reales
    3. **EXTRAER**: Del resultado, extrae URLs de imágenes, precios, nombres, etc.
    4. **ABRIR**: Llama openArtifactTool con initialDataJson conteniendo los datos extraídos
    5. **RESPONDER**: ⚠️ OBLIGATORIO - Después de abrir el artefacto, SIEMPRE genera un mensaje de texto explicando qué estás mostrando

    ## REGLAS CRÍTICAS:
    ⛔ NUNCA abras un artefacto sin datos reales (sin images, sin price, etc.)
    ⛔ NUNCA inventes URLs - solo usa las que encuentres en getContextTool
    ⛔ Si no hay datos en RAG → informa al usuario, NO abras artefacto vacío
    ✅ SIEMPRE busca primero con getContextTool antes de abrir cualquier artefacto
    ✅ SIEMPRE responde con texto DESPUÉS de llamar openArtifactTool (ej: "Aquí tienes la galería de imágenes" o "Te muestro el producto")
    ⛔ NUNCA dejes tu respuesta vacía después de mostrar un artefacto

    ## ARTEFACTOS DISPONIBLES (con triggers, datos requeridos y ejemplos):
    ${installedArtifacts}
    `;

  // ⏱️ Start time para medir responseTime
  const startTime = Date.now();

  // 🔧 Cargar custom tools del chatbot (herramientas HTTP personalizadas)
  const customTools = await loadCustomToolsForChatbot(chatbotId);

  // 🌡️ Obtener temperatura solo para modelos que la necesitan (Gemini)
  const modelTemperature = getModelTemperature(chatbot.aiModel);

  // ✅ PATRÓN 2025: streamText con TODOS los mensajes (históricos + nuevos)
  const result = streamText({
    model: mapModel(chatbot.aiModel),
    // 🌡️ Solo Gemini recibe temperatura explícita (GPT/Claude usan sus defaults)
    ...(modelTemperature !== undefined && { temperature: modelTemperature }),
    messages: convertToModelMessages(allMessages), // ⬅️ TODOS los mensajes
    system: systemPrompt,
    tools: {
      getContextTool: createGetContextTool(chatbotId),
      saveLeadTool: createSaveLeadTool(chatbotId, conversation.id, "web"), // ⬅️ Indica canal WEB
      openArtifactTool: createOpenArtifactTool(chatbotId),
      // NOTE: confirmArtifactTool removido - HITL pattern incompatible con transport "Last Message Only"
      ...customTools, // 🔧 Herramientas HTTP personalizadas
    },
    stopWhen: stepCountIs(5),
    // 📊 TRACKING: onFinish de streamText (recibe totalUsage)
    onFinish: async ({ text, totalUsage }) => {
      try {
        // ⚠️ NO guardar mensajes vacíos (solo tool calls sin texto)
        if (!text || !text.trim()) {
          console.log("[Chat Public] ⏭️ Skipping empty message (tool-only response)");
          return;
        }

        // 📊 TRACKING: Extraer métricas de tokens (AI SDK 5.x uses inputTokens/outputTokens)
        const inputTokens = totalUsage?.inputTokens || 0;
        const outputTokens = totalUsage?.outputTokens || 0;
        const totalTokens = inputTokens + outputTokens;

        // 🔍 Detectar provider y modelo
        const { provider, model } = getModelInfo(chatbot.aiModel);

        // 💰 Calcular costo
        const costResult = calculateCost(provider, model, {
          inputTokens,
          outputTokens,
          cachedTokens: 0, // TODO: Vercel AI SDK no expone cached tokens aún
        });

        // ⏱️ Calcular tiempo de respuesta
        const responseTime = Date.now() - startTime;

        // 💾 Guardar mensaje con tracking completo
        await addAssistantMessage(
          conversation.id,
          text,
          totalTokens,
          responseTime,
          undefined,
          model,
          "web",
          undefined,
          inputTokens,
          outputTokens,
          costResult.totalCost,
          provider,
          0
        );

        console.log(
          `[Chat Public] ✅ Message tracked: ${totalTokens} tokens, $${costResult.totalCost.toFixed(6)} (${provider}/${model})`
        );

        // 📊 OBSERVABILITY: Crear span LLM_CALL y completar trace
        if (traceCtx) {
          try {
            // Crear span para la llamada LLM con métricas detalladas
            const spanId = await startSpan(traceCtx, {
              type: "LLM_CALL",
              name: model || chatbot.aiModel,
              input: { prompt: textContent, model: chatbot.aiModel },
            });

            // Completar span con output y métricas
            await endSpan(traceCtx, spanId, {
              output: { response: text.substring(0, 500) }, // Truncar para no sobrecargar
              tokens: totalTokens,
              cost: costResult.totalCost,
              metadata: {
                gen_ai: {
                  system: provider,
                  request: { model },
                  usage: {
                    input_tokens: inputTokens,
                    output_tokens: outputTokens,
                  },
                  response_time_ms: responseTime,
                },
              },
            });
          } catch (spanErr) {
            console.error("[Chat Public] ⚠️ Failed to create LLM span:", spanErr);
          }

          await endTrace(traceCtx, {
            output: text,
            totalTokens,
            totalCost: costResult.totalCost,
            creditsUsed: 0,
          }).catch((err) => {
            console.error("[Chat Public] ⚠️ Failed to end trace:", err);
          });
        }
      } catch (error) {
        console.error("[Chat Public Action] ❌ Error saving message:", error);
        // 📊 OBSERVABILITY: Marcar trace como error
        if (traceCtx) {
          await failTrace(traceCtx, String(error)).catch(() => {});
        }
      }
    },
  });

  // ✅ PATRÓN OFICIAL: toUIMessageStreamResponse CON originalMessages
  return result.toUIMessageStreamResponse({
    originalMessages: allMessages, // ⬅️ Envía mensajes históricos + nuevos al cliente
  });
}

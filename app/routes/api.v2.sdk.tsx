/**
 * SDK API v2 - Unified endpoint for @formmy.app/react SDK
 *
 * Intents:
 * - chat: Streaming chat with an agent
 * - agents.list: List all agents for the authenticated user
 * - agents.create: Create a new agent
 * - agents.get: Get a specific agent
 * - agents.update: Update an agent
 * - agents.delete: Delete an agent
 */

import type { Route } from "./+types/api.v2.sdk";
import pkg from "@prisma/client";
const { KeyScope } = pkg;
import {
  authenticateSdkRequest,
  createSdkErrorResponse,
  SdkAuthError,
} from "@/server/sdk/key-auth.server";
import { db } from "~/utils/db.server";

// Chat imports (reutilizados de chat.vercel.public)
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
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
import { loadCustomToolsForChatbot } from "@/server/tools/vercel/customHttpTool";
import { calculateCost } from "@/server/chatbot/pricing.server";
import { validateMonthlyConversationLimit } from "@/server/chatbot/planLimits.server";
import { applyRateLimit, RATE_LIMIT_CONFIGS } from "@/server/middleware/rateLimiter.server";
import { z } from "zod";

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

const chatMessageSchema = z.object({
  message: z.object({
    parts: z
      .array(
        z.object({
          type: z.enum(["text", "tool-result", "tool-call"]),
          text: z.string().optional(),
        })
      )
      .min(1, "Message must have at least one part"),
  }),
  id: z
    .string()
    .min(1, "Session ID required")
    .max(255, "Session ID too long")
    .regex(/^[\w\-._]+$/, "Invalid session ID format"),
});

const createAgentSchema = z.object({
  name: z.string().min(1, "Name required").max(100, "Name too long"),
  instructions: z.string().max(10000, "Instructions too long").optional(),
  welcomeMessage: z.string().max(1000, "Welcome message too long").optional(),
  model: z.string().optional(),
});

const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  instructions: z.string().max(10000).optional(),
  welcomeMessage: z.string().max(1000).optional(),
  model: z.string().optional(),
  customInstructions: z.string().max(5000).optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// LOADER: GET requests (agents.list, agents.get, chat history)
// ═══════════════════════════════════════════════════════════════════════════

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");

  try {
    switch (intent) {
      case "agents.list":
        return handleAgentsList(request);

      case "agents.get":
        return handleAgentsGet(request, url);

      case "chat.history":
        return handleChatHistory(request, url);

      default:
        return Response.json(
          { error: "Missing or invalid intent", validIntents: ["agents.list", "agents.get", "chat.history"] },
          { status: 400 }
        );
    }
  } catch (error) {
    return createSdkErrorResponse(error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION: POST/PUT/DELETE requests
// ═══════════════════════════════════════════════════════════════════════════

export async function action({ request }: Route.ActionArgs) {
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");

  try {
    // Extract API key for rate limiting identifier
    const apiKey =
      request.headers.get("X-Secret-Key") ||
      request.headers.get("X-Publishable-Key") ||
      request.headers.get("Authorization")?.slice(7) ||
      "unknown";

    // Apply rate limiting based on intent
    const rateLimitConfig = intent === "chat" ? RATE_LIMIT_CONFIGS.sdkChat : RATE_LIMIT_CONFIGS.sdk;
    const rateLimitResult = await applyRateLimit(request, `sdk:${apiKey.slice(-12)}`, rateLimitConfig);

    if (!rateLimitResult.allowed) {
      return Response.json(
        {
          error: "Rate limit exceeded",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    switch (intent) {
      case "chat":
        return handleChat(request, url);

      case "agents.create":
        return handleAgentsCreate(request);

      case "agents.update":
        return handleAgentsUpdate(request, url);

      case "agents.delete":
        // Temporarily disabled - must delete via dashboard
        return Response.json(
          {
            error: "Agent deletion is not available via SDK",
            message: "Please delete agents through the Formmy dashboard at https://formmy.app/dashboard",
            code: "NOT_AVAILABLE",
          },
          { status: 403 }
        );

      default:
        return Response.json(
          { error: "Missing or invalid intent", validIntents: ["chat", "agents.create", "agents.update"] },
          { status: 400 }
        );
    }
  } catch (error) {
    return createSdkErrorResponse(error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENTS HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

async function handleAgentsList(request: Request) {
  const auth = await authenticateSdkRequest(request, { requireSecret: true });

  const agents = await db.chatbot.findMany({
    where: {
      userId: auth.userId,
      status: { not: "DELETED" }, // Exclude deleted agents
    },
    select: {
      id: true,
      name: true,
      slug: true,
      aiModel: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ agents });
}

async function handleAgentsGet(request: Request, url: URL) {
  const auth = await authenticateSdkRequest(request, { requireSecret: true });
  const agentId = url.searchParams.get("agentId");

  if (!agentId) {
    throw new SdkAuthError("Missing agentId parameter", 400);
  }

  const agent = await db.chatbot.findFirst({
    where: { id: agentId, userId: auth.userId },
    select: {
      id: true,
      name: true,
      slug: true,
      aiModel: true,
      instructions: true,
      customInstructions: true,
      welcomeMessage: true,
      personality: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!agent) {
    throw new SdkAuthError("Agent not found", 404);
  }

  return Response.json({ agent });
}

async function handleAgentsCreate(request: Request) {
  const auth = await authenticateSdkRequest(request, { requireSecret: true });

  // Validate request body with Zod
  let body: z.infer<typeof createAgentSchema>;
  try {
    body = createAgentSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new SdkAuthError(
        `Invalid request: ${error.errors.map((e) => e.message).join(", ")}`,
        400,
        "VALIDATION_ERROR"
      );
    }
    throw error;
  }

  const { name, instructions, welcomeMessage, model = "gpt-4o-mini" } = body;

  // Generate unique slug
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
  const slug = `${baseSlug}-${nanoid(6)}`;

  const agent = await db.chatbot.create({
    data: {
      name,
      slug,
      aiModel: model,
      instructions: instructions || "Eres un asistente amable y profesional.",
      welcomeMessage: welcomeMessage || `Hola, soy ${name}. ¿En qué puedo ayudarte?`,
      userId: auth.userId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      aiModel: true,
      instructions: true,
      welcomeMessage: true,
      status: true,
      createdAt: true,
    },
  });

  return Response.json({ agent }, { status: 201 });
}

async function handleAgentsUpdate(request: Request, url: URL) {
  const auth = await authenticateSdkRequest(request, { requireSecret: true });
  const agentId = url.searchParams.get("agentId");

  if (!agentId) {
    throw new SdkAuthError("Missing agentId parameter", 400, "MISSING_PARAM");
  }

  // Verify ownership
  const existing = await db.chatbot.findFirst({
    where: { id: agentId, userId: auth.userId },
  });

  if (!existing) {
    throw new SdkAuthError("Agent not found", 404, "NOT_FOUND");
  }

  // Validate request body with Zod
  let body: z.infer<typeof updateAgentSchema>;
  try {
    body = updateAgentSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new SdkAuthError(
        `Invalid request: ${error.errors.map((e) => e.message).join(", ")}`,
        400,
        "VALIDATION_ERROR"
      );
    }
    throw error;
  }

  const { name, instructions, welcomeMessage, model, customInstructions } = body;

  const agent = await db.chatbot.update({
    where: { id: agentId },
    data: {
      ...(name && { name }),
      ...(instructions && { instructions }),
      ...(welcomeMessage && { welcomeMessage }),
      ...(model && { aiModel: model }),
      ...(customInstructions !== undefined && { customInstructions }),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      aiModel: true,
      instructions: true,
      welcomeMessage: true,
      customInstructions: true,
      status: true,
      updatedAt: true,
    },
  });

  return Response.json({ agent });
}

async function handleAgentsDelete(request: Request, url: URL) {
  const auth = await authenticateSdkRequest(request, { requireSecret: true });
  const agentId = url.searchParams.get("agentId");

  if (!agentId) {
    throw new SdkAuthError("Missing agentId parameter", 400);
  }

  // Verify ownership
  const existing = await db.chatbot.findFirst({
    where: { id: agentId, userId: auth.userId },
  });

  if (!existing) {
    throw new SdkAuthError("Agent not found", 404);
  }

  // Soft delete - just deactivate
  await db.chatbot.update({
    where: { id: agentId },
    data: { status: "DELETED" },
  });

  return Response.json({ success: true, message: "Agent deleted" });
}

// ═══════════════════════════════════════════════════════════════════════════
// CHAT HANDLERS (reutilizado de chat.vercel.public.tsx)
// ═══════════════════════════════════════════════════════════════════════════

async function handleChatHistory(request: Request, url: URL) {
  // Publishable keys can access chat
  const auth = await authenticateSdkRequest(request);

  const sessionId = url.searchParams.get("sessionId");
  const agentId = url.searchParams.get("agentId");

  if (!sessionId || !agentId) {
    return Response.json({ messages: [] });
  }

  // Verify agent belongs to user
  const chatbot = await db.chatbot.findFirst({
    where: { id: agentId, userId: auth.userId },
  });

  if (!chatbot) {
    throw new SdkAuthError("Agent not found", 404);
  }

  const conversation = await getConversationBySessionId(sessionId, agentId);

  if (!conversation) {
    return Response.json({ messages: [] });
  }

  const dbMessages = await getMessagesByConversationId(conversation.id);
  const messages = dbMessages
    .filter((msg) => {
      if (msg.role === "SYSTEM") return false;
      const hasContent = msg.content && msg.content.trim();
      const hasParts = msg.parts && Array.isArray(msg.parts) && (msg.parts as object[]).length > 0;
      return hasContent || hasParts;
    })
    .map((msg) => ({
      id: msg.id,
      role: msg.role.toLowerCase() as "user" | "assistant",
      parts: msg.parts
        ? (msg.parts as object[])
        : [{ type: "text" as const, text: msg.content }],
    }));

  return Response.json({ messages });
}

async function handleChat(request: Request, url: URL) {
  // Publishable keys can access chat (domain already validated)
  const auth = await authenticateSdkRequest(request);

  // Validate request body with Zod
  let body: z.infer<typeof chatMessageSchema>;
  try {
    body = chatMessageSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new SdkAuthError(
        `Invalid request: ${error.errors.map((e) => e.message).join(", ")}`,
        400,
        "VALIDATION_ERROR"
      );
    }
    throw error;
  }

  const { message, id: sessionId } = body;
  const agentId = url.searchParams.get("agentId");

  if (!agentId) {
    throw new SdkAuthError("Missing agentId parameter", 400, "MISSING_PARAM");
  }

  // Validate message has text content
  const textContent = message.parts
    .filter((p) => p.type === "text" && p.text?.trim())
    .map((p) => p.text!)
    .join("");

  if (!textContent) {
    throw new SdkAuthError("Message cannot be empty", 400, "EMPTY_MESSAGE");
  }

  // Verify agent belongs to user and is active
  const chatbot = await db.chatbot.findFirst({
    where: { id: agentId, userId: auth.userId, status: "ACTIVE" },
  });

  if (!chatbot) {
    throw new SdkAuthError("Agent not found or inactive", 404);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REUTILIZADO DE chat.vercel.public.tsx
  // ══════════════════════════════════════════════════════════════════════════

  // Buscar conversación existente
  let conversation = await getConversationBySessionId(sessionId, agentId);

  // Cargar mensajes históricos
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

  // Crear conversación si no existe
  if (!conversation) {
    const limitCheck = await validateMonthlyConversationLimit(agentId);

    if (!limitCheck.canCreate) {
      throw new SdkAuthError(
        `Monthly conversation limit reached (${limitCheck.maxAllowed})`,
        429
      );
    }

    const { conversation: conv } = await db.$transaction(async (tx) => {
      const existing = await tx.conversation.findUnique({ where: { sessionId } });

      if (existing) {
        return {
          conversation: await tx.conversation.update({
            where: { sessionId },
            data: { status: "ACTIVE" },
          }),
        };
      }

      const updatedChatbot = await tx.chatbot.update({
        where: { id: agentId },
        data: {
          conversationCount: { increment: 1 },
          monthlyUsage: { increment: 1 },
        },
      });

      return {
        conversation: await tx.conversation.create({
          data: {
            chatbotId: agentId,
            sessionId,
            visitorId: nanoid(),
            visitorIp: request.headers.get("x-forwarded-for") || undefined,
            status: "ACTIVE",
            name: `SDK User #${updatedChatbot.conversationCount}`,
          },
        }),
      };
    });

    conversation = conv;
  }

  // Combinar mensajes (textContent ya fue validado arriba)
  const allMessages = [...historicalMessages, message];

  await addUserMessage(conversation.id, textContent);

  const startTime = Date.now();

  // Cargar custom tools
  const customTools = await loadCustomToolsForChatbot(agentId);

  // System prompt
  const basePrompt = chatbot.instructions || "Eres un asistente útil.";
  const systemPrompt = chatbot.customInstructions
    ? `${basePrompt}\n\n${chatbot.customInstructions}`
    : basePrompt;

  // Temperatura (solo para Gemini)
  const modelTemperature = getModelTemperature(chatbot.aiModel);

  // streamText
  const result = streamText({
    model: mapModel(chatbot.aiModel),
    ...(modelTemperature !== undefined && { temperature: modelTemperature }),
    messages: await convertToModelMessages(allMessages),
    system: systemPrompt,
    tools: {
      getContextTool: createGetContextTool(agentId),
      saveLeadTool: createSaveLeadTool(agentId, conversation.id, "sdk"),
      ...customTools,
    },
    stopWhen: stepCountIs(5),
    onFinish: async ({ text, totalUsage, steps }) => {
      try {
        const allToolCalls = steps?.flatMap(step => step.toolCalls || []) || [];
        const allToolResults = steps?.flatMap(step => step.toolResults || []) || [];

        const hasText = text && text.trim();
        const hasToolCalls = allToolCalls.length > 0;

        if (!hasText && !hasToolCalls) return;

        const inputTokens = totalUsage?.inputTokens || 0;
        const outputTokens = totalUsage?.outputTokens || 0;
        const totalTokens = inputTokens + outputTokens;
        const { provider, model } = getModelInfo(chatbot.aiModel);
        const costResult = calculateCost(provider, model, { inputTokens, outputTokens, cachedTokens: 0 });
        const responseTime = Date.now() - startTime;

        const parts: object[] = [];
        for (const toolCall of allToolCalls) {
          const tc = toolCall as { toolName: string; toolCallId: string; input: unknown };
          const toolResult = allToolResults.find(
            (r: { toolCallId: string }) => r.toolCallId === tc.toolCallId
          ) as { output: unknown } | undefined;

          parts.push({
            type: `tool-${tc.toolName}`,
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            state: toolResult ? "output-available" : "pending",
            args: tc.input,
            output: toolResult?.output,
          });
        }

        if (hasText) {
          parts.push({ type: "text", text });
        }

        await addAssistantMessage(
          conversation.id,
          hasText ? text : "",
          totalTokens,
          responseTime,
          undefined,
          model,
          "sdk",
          undefined,
          inputTokens,
          outputTokens,
          costResult.totalCost,
          provider,
          0,
          parts.length > 0 ? parts : undefined
        );

        console.log(
          `[SDK Chat] ✅ Message tracked: ${totalTokens} tokens, $${costResult.totalCost.toFixed(6)}`
        );
      } catch (error) {
        console.error("[SDK Chat] ❌ Error saving message:", error);
      }
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: allMessages,
  });
}

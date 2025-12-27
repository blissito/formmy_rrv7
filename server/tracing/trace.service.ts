/**
 * Trace Service - Observability & Tracing
 *
 * Maneja la creación y actualización de traces, spans y eventos
 * para proporcionar observabilidad completa de las conversaciones con agentes.
 *
 * Inspirado en OpenTelemetry pero simplificado para principiantes.
 */

import { db } from "~/utils/db.server";
import type { SpanType, TraceEventType } from "@prisma/client";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateTraceParams {
  userId: string;
  chatbotId?: string;
  conversationId?: string;
  input: string;
  model?: string; // Modelo LLM usado
  metadata?: Record<string, any>;
}

export interface CreateSpanParams {
  traceId: string;
  type: SpanType;
  name: string;
  input?: any;
  parentSpanId?: string;
}

export interface UpdateSpanParams {
  spanId: string;
  output?: any;
  tokens?: number;
  cost?: number;
  credits?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface CreateEventParams {
  traceId: string;
  type: TraceEventType;
  name: string;
  data?: any;
}

export interface CompleteTraceParams {
  traceId: string;
  output: string;
  totalTokens: number;
  totalCost: number;
  creditsUsed: number;
  error?: string;
}

// ============================================================================
// TRACE OPERATIONS
// ============================================================================

/**
 * Validar si un string es un ObjectId válido de MongoDB
 */
function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

/**
 * Crear un nuevo trace para una conversación
 */
export async function createTrace(params: CreateTraceParams) {
  const { userId, chatbotId, conversationId, input, model, metadata } = params;

  try {
    // Solo guardar userId si es un ObjectId válido (usuarios autenticados)
    // Usuarios anónimos tienen IDs como "anon-1762032294689-atiasm" que no son ObjectIds
    const validUserId = isValidObjectId(userId) ? userId : null;

    const trace = await db.trace.create({
      data: {
        userId: validUserId,
        chatbotId: chatbotId || null,
        conversationId: conversationId || null,
        input,
        model: model || null,
        status: "RUNNING",
        startTime: new Date(),
        metadata: metadata || null,
      },
    });


    return trace;
  } catch (error) {
    console.error("❌ [createTrace] Error:", error);
    throw error;
  }
}

/**
 * Completar un trace con el output final y métricas
 */
export async function completeTrace(params: CompleteTraceParams) {
  const { traceId, output, totalTokens, totalCost, creditsUsed, error } = params;

  try {
    const startTrace = await db.trace.findUnique({
      where: { id: traceId },
      select: { startTime: true },
    });

    if (!startTrace) {
      throw new Error(`Trace ${traceId} not found`);
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTrace.startTime.getTime();

    const trace = await db.trace.update({
      where: { id: traceId },
      data: {
        output,
        status: error ? "ERROR" : "COMPLETED",
        endTime,
        durationMs,
        totalTokens,
        totalCost,
        creditsUsed,
      },
    });


    return trace;
  } catch (error) {
    console.error("❌ [completeTrace] Error:", error);
    throw error;
  }
}

/**
 * Marcar un trace como error
 */
export async function errorTrace(traceId: string, errorMessage: string) {
  try {
    const startTrace = await db.trace.findUnique({
      where: { id: traceId },
      select: { startTime: true },
    });

    if (!startTrace) {
      throw new Error(`Trace ${traceId} not found`);
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTrace.startTime.getTime();

    const trace = await db.trace.update({
      where: { id: traceId },
      data: {
        status: "ERROR",
        endTime,
        durationMs,
        output: `Error: ${errorMessage}`,
      },
    });


    return trace;
  } catch (error) {
    console.error("❌ [errorTrace] Error:", error);
    throw error;
  }
}

// ============================================================================
// SPAN OPERATIONS
// ============================================================================

/**
 * Crear un nuevo span dentro de un trace
 */
export async function createSpan(params: CreateSpanParams) {
  const { traceId, type, name, input, parentSpanId } = params;

  try {
    const span = await db.span.create({
      data: {
        traceId,
        type,
        name,
        input: input || null,
        parentSpanId: parentSpanId || null,
        status: "RUNNING",
        startTime: new Date(),
      },
    });


    return span;
  } catch (error) {
    console.error("❌ [createSpan] Error:", error);
    throw error;
  }
}

/**
 * Completar un span con output y métricas
 */
export async function completeSpan(params: UpdateSpanParams) {
  const { spanId, output, tokens, cost, credits, error, metadata } = params;

  try {
    const startSpan = await db.span.findUnique({
      where: { id: spanId },
      select: { startTime: true, type: true, name: true },
    });

    if (!startSpan) {
      throw new Error(`Span ${spanId} not found`);
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startSpan.startTime.getTime();

    const span = await db.span.update({
      where: { id: spanId },
      data: {
        output: output || null,
        status: error ? "ERROR" : "COMPLETED",
        endTime,
        durationMs,
        tokens: tokens || null,
        cost: cost || null,
        credits: credits || null,
        error: error || null,
        metadata: metadata || null,
      },
    });


    return span;
  } catch (error) {
    console.error("❌ [completeSpan] Error:", error);
    throw error;
  }
}

// ============================================================================
// EVENT OPERATIONS
// ============================================================================

/**
 * Crear un evento dentro de un trace
 */
export async function createEvent(params: CreateEventParams) {
  const { traceId, type, name, data } = params;

  try {
    const event = await db.traceEvent.create({
      data: {
        traceId,
        type,
        name,
        data: data || null,
        timestamp: new Date(),
      },
    });


    return event;
  } catch (error) {
    console.error("❌ [createEvent] Error:", error);
    // No lanzar error, eventos son opcionales
    return null;
  }
}

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Obtener un trace completo con spans y eventos
 */
/**
 * Obtener un trace por ID con validación de permisos
 *
 * IMPORTANTE: Siempre valida que el trace pertenezca al userId especificado
 * para evitar que usuarios vean traces de otros usuarios.
 */
export async function getTraceById(traceId: string, userId: string) {
  try {
    const trace = await db.trace.findFirst({
      where: {
        id: traceId,
        userId, // 🔒 Validación de seguridad: solo traces del usuario
      },
      include: {
        spans: {
          orderBy: { startTime: "asc" },
        },
        events: {
          orderBy: { timestamp: "asc" },
        },
        chatbot: {
          select: { id: true, name: true },
        },
      },
    });

    return trace;
  } catch (error) {
    console.error("❌ [getTraceById] Error:", error);
    throw error;
  }
}

/**
 * Listar traces de un usuario con filtros
 */
export async function listTraces(params: {
  userId: string;
  chatbotId?: string;
  limit?: number;
  offset?: number;
}) {
  const { userId, chatbotId, limit = 50, offset = 0 } = params;

  try {
    const where: any = { userId };
    if (chatbotId) {
      where.chatbotId = chatbotId;
    }

    const [traces, total] = await Promise.all([
      db.trace.findMany({
        where,
        select: {
          id: true,
          chatbotId: true,
          conversationId: true,
          userId: true,
          input: true,
          output: true,
          status: true,
          startTime: true,
          endTime: true,
          durationMs: true,
          model: true,
          totalTokens: true,
          totalCost: true,
          creditsUsed: true,
          metadata: true, // Para sessionId de Langfuse
          createdAt: true,
          chatbot: {
            select: { id: true, name: true, slug: true },
          },
          spans: {
            select: {
              id: true,
              type: true,
              name: true,
              startTime: true,
              durationMs: true,
              tokens: true,
              cost: true,
              credits: true,
              status: true,
              input: true,
              output: true,
              error: true,
              metadata: true, // Para gen_ai attributes
            },
            orderBy: { startTime: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.trace.count({ where }),
    ]);

    return { traces, total };
  } catch (error) {
    console.error("❌ [listTraces] Error:", error);
    throw error;
  }
}

/**
 * Obtener estadísticas agregadas de traces
 */
export async function getTraceStats(params: {
  userId: string;
  chatbotId?: string;
  periodDays?: number;
}) {
  const { userId, chatbotId, periodDays = 7 } = params;

  try {
    const since = new Date();
    since.setDate(since.getDate() - periodDays);

    const where: any = {
      userId,
      createdAt: { gte: since },
    };
    if (chatbotId) {
      where.chatbotId = chatbotId;
    }

    const traces = await db.trace.findMany({
      where,
      select: {
        status: true,
        durationMs: true,
        totalTokens: true,
        totalCost: true,
        creditsUsed: true,
      },
    });

    const total = traces.length;
    const completed = traces.filter((t) => t.status === "COMPLETED").length;
    const errors = traces.filter((t) => t.status === "ERROR").length;

    const avgLatency =
      traces.reduce((sum, t) => sum + (t.durationMs || 0), 0) / total || 0;
    const totalTokens = traces.reduce((sum, t) => sum + t.totalTokens, 0);
    const totalCost = traces.reduce((sum, t) => sum + t.totalCost, 0);
    const totalCredits = traces.reduce((sum, t) => sum + t.creditsUsed, 0);

    return {
      period: { days: periodDays, since },
      total,
      completed,
      errors,
      errorRate: total > 0 ? (errors / total) * 100 : 0,
      avgLatency: Math.round(avgLatency),
      totalTokens,
      totalCost,
      totalCredits,
    };
  } catch (error) {
    console.error("❌ [getTraceStats] Error:", error);
    throw error;
  }
}

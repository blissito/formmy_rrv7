/**
 * Tracing Instrumentation
 *
 * Instrumentación automática para agent workflows
 * siguiendo patrones de OpenTelemetry:
 * - Context Propagation
 * - Span Lifecycle Management
 * - Automatic Attribute Capture
 * - Event Recording
 *
 * Referencias:
 * - https://opentelemetry.io/docs/specs/otel/trace/api/
 * - https://opentelemetry.io/docs/specs/semconv/gen-ai/
 */

import type { SpanType } from "@prisma/client";
import {
  createTrace,
  completeTrace,
  errorTrace,
  createSpan,
  completeSpan,
  createEvent,
} from "./trace.service.server";

// ============================================================================
// CONTEXT MANAGEMENT (OpenTelemetry Pattern)
// ============================================================================

/**
 * TraceContext - Almacena el contexto del trace activo
 * Similar a OpenTelemetry Context
 */
export class TraceContext {
  traceId: string;
  userId: string;
  chatbotId?: string;
  conversationId?: string;
  activeSpans: Map<string, string>; // spanKey -> spanId

  constructor(
    traceId: string,
    userId: string,
    chatbotId?: string,
    conversationId?: string
  ) {
    this.traceId = traceId;
    this.userId = userId;
    this.chatbotId = chatbotId;
    this.conversationId = conversationId;
    this.activeSpans = new Map();
  }
}

// ============================================================================
// INSTRUMENTATION API (OpenTelemetry-Style)
// ============================================================================

/**
 * Iniciar un trace para una conversación
 * Similar a tracer.startSpan() en OpenTelemetry
 */
export async function startTrace(params: {
  userId: string;
  chatbotId?: string;
  conversationId?: string;
  input: string;
  model?: string; // Modelo LLM usado
  metadata?: Record<string, any>;
}): Promise<TraceContext> {
  const trace = await createTrace(params);

  return new TraceContext(
    trace.id,
    params.userId,
    params.chatbotId,
    params.conversationId
  );
}

/**
 * Finalizar un trace
 */
export async function endTrace(
  ctx: TraceContext,
  params: {
    output: string;
    totalTokens: number;
    totalCost: number;
    creditsUsed: number;
    error?: string;
  }
) {
  await completeTrace({
    traceId: ctx.traceId,
    ...params,
  });
}

/**
 * Marcar trace como error
 */
export async function failTrace(ctx: TraceContext, errorMessage: string) {
  await errorTrace(ctx.traceId, errorMessage);
}

// ============================================================================
// SPAN INSTRUMENTATION (OpenTelemetry Semantic Conventions)
// ============================================================================

/**
 * Iniciar un span dentro del trace
 * Sigue OpenTelemetry Semantic Conventions para GenAI
 * https://opentelemetry.io/docs/specs/semconv/gen-ai/
 */
export async function startSpan(
  ctx: TraceContext,
  params: {
    type: SpanType;
    name: string;
    input?: any;
    spanKey?: string; // Clave única para recuperar el span
  }
) {
  const span = await createSpan({
    traceId: ctx.traceId,
    type: params.type,
    name: params.name,
    input: params.input,
  });

  // Guardar referencia del span activo
  if (params.spanKey) {
    ctx.activeSpans.set(params.spanKey, span.id);
  }

  return span.id;
}

/**
 * Finalizar un span
 */
export async function endSpan(
  ctx: TraceContext,
  spanIdOrKey: string,
  params: {
    output?: any;
    tokens?: number;
    cost?: number;
    credits?: number;
    error?: string;
    metadata?: Record<string, any>;
  }
) {
  // Resolver spanId desde key si es necesario
  const spanId = ctx.activeSpans.get(spanIdOrKey) || spanIdOrKey;

  await completeSpan({
    spanId,
    ...params,
  });

  // Limpiar referencia
  if (ctx.activeSpans.has(spanIdOrKey)) {
    ctx.activeSpans.delete(spanIdOrKey);
  }
}

// ============================================================================
// LLM CALL INSTRUMENTATION (OpenTelemetry GenAI Conventions)
// ============================================================================

/**
 * Instrumentar llamada a LLM
 * Sigue https://opentelemetry.io/docs/specs/semconv/gen-ai/llm-spans/
 *
 * Atributos estándar:
 * - gen_ai.system (openai, anthropic, etc.)
 * - gen_ai.request.model
 * - gen_ai.request.temperature
 * - gen_ai.usage.input_tokens
 * - gen_ai.usage.output_tokens
 */
export async function instrumentLLMCall(
  ctx: TraceContext,
  params: {
    model: string;
    temperature?: number;
    systemPrompt?: string;
  }
) {
  const provider = params.model.includes("claude")
    ? "anthropic"
    : params.model.includes("gpt")
    ? "openai"
    : "other";

  const spanId = await startSpan(ctx, {
    type: "LLM_CALL",
    name: params.model,
    spanKey: "llm_main",
    input: {
      system: provider,
      model: params.model,
      temperature: params.temperature,
    },
  });

  return {
    spanId,
    complete: async (output: {
      tokens?: number;
      inputTokens?: number;
      outputTokens?: number;
      cost?: number;
      error?: string;
    }) => {
      await endSpan(ctx, "llm_main", {
        output: {
          success: !output.error,
          error: output.error,
        },
        tokens: output.tokens,
        cost: output.cost,
        metadata: {
          gen_ai: {
            system: provider,
            request: {
              model: params.model,
              temperature: params.temperature,
            },
            usage: {
              input_tokens: output.inputTokens,
              output_tokens: output.outputTokens,
            },
          },
        },
      });
    },
  };
}

// ============================================================================
// TOOL CALL INSTRUMENTATION
// ============================================================================

/**
 * Instrumentar llamada a herramienta
 */
export async function instrumentToolCall(
  ctx: TraceContext,
  params: {
    toolName: string;
    input?: any;
  }
) {
  const spanId = await startSpan(ctx, {
    type: "TOOL_CALL",
    name: params.toolName,
    spanKey: `tool_${params.toolName}_${Date.now()}`,
    input: params.input,
  });

  return {
    spanId,
    complete: async (output: {
      result?: any;
      credits?: number;
      error?: string;
    }) => {
      await endSpan(ctx, spanId, {
        output: output.result,
        credits: output.credits,
        error: output.error,
      });
    },
  };
}

// ============================================================================
// RAG INSTRUMENTATION
// ============================================================================

/**
 * Instrumentar búsqueda RAG
 */
export async function instrumentRAGSearch(
  ctx: TraceContext,
  params: {
    query: string;
  }
) {
  const spanId = await startSpan(ctx, {
    type: "RAG_SEARCH",
    name: "search_context",
    spanKey: `rag_${Date.now()}`,
    input: { query: params.query },
  });

  return {
    spanId,
    complete: async (output: {
      sources?: number;
      credits?: number;
      error?: string;
    }) => {
      await endSpan(ctx, spanId, {
        output: {
          sources_count: output.sources,
        },
        credits: output.credits,
        error: output.error,
      });
    },
  };
}

// ============================================================================
// EVENT RECORDING
// ============================================================================

/**
 * Registrar evento dentro del trace
 * Similar a span.addEvent() en OpenTelemetry
 */
export async function recordEvent(
  ctx: TraceContext,
  params: {
    type: "TOOL_START" | "TOOL_END" | "WIDGET_DETECTED" | "SOURCE_FOUND" | "ERROR" | "WARNING";
    name: string;
    data?: any;
  }
) {
  await createEvent({
    traceId: ctx.traceId,
    type: params.type,
    name: params.name,
    data: params.data,
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calcular costo estimado basado en tokens
 * Precios aproximados (actualizar según pricing real)
 */
export function estimateCost(model: string, tokens: number): number {
  const pricing: Record<string, number> = {
    "gpt-4o-mini": 0.15 / 1_000_000, // $0.15 per 1M tokens (avg input/output)
    "gpt-4o": 2.5 / 1_000_000, // $2.50 per 1M tokens (avg)
    "gpt-5-mini": 0.15 / 1_000_000,
    "claude-3-5-haiku": 0.8 / 1_000_000, // $0.80 per 1M tokens (avg)
    "claude-3-5-sonnet": 3.0 / 1_000_000, // $3.00 per 1M tokens (avg)
  };

  const rate = pricing[model] || 0.15 / 1_000_000; // Default fallback
  return tokens * rate;
}
